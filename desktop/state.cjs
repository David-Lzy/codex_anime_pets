'use strict';

const STATES = ['idle', 'running-right', 'running-left', 'waving', 'jumping', 'failed', 'waiting', 'running', 'review'];
const EVENTS = ['UserPromptSubmit', 'PreToolUse', 'PermissionRequest', 'PostToolUse', 'Stop', 'Interrupt'];
const INPUT_TOOL = /(?:^|[._])request_user_input(?:_async)?$/;

function validateEvent(e, now = Date.now()) {
  return e && EVENTS.includes(e.event) && /^[\w:-]{1,160}$/.test(e.sessionId || '') &&
    (e.turnId === '' || /^[\w:-]{1,160}$/.test(e.turnId || '')) &&
    (e.callId === '' || /^[\w:-]{1,180}$/.test(e.callId || '')) &&
    typeof e.tool === 'string' && e.tool.length <= 180 &&
    typeof e.failed === 'boolean' && Number.isFinite(e.at) && Math.abs(now - e.at) < 120000 &&
    typeof e.workspace === 'string' && e.workspace.length <= 100;
}

class TaskStates {
  tasks = new Map();
  accept(e) {
    if (!validateEvent(e)) return false;
    let task = this.tasks.get(e.sessionId);
    if (task && e.at < task.at) return false;
    if (!task) task = {id: e.sessionId, state: 'idle', closed: false, turnId: e.turnId, failedUntil: 0, waiting: new Set(), pastTurns: new Set()};
    if (e.turnId && task.pastTurns.has(e.turnId)) return false;
    const newTurn = e.turnId && e.turnId !== task.turnId;
    // Late background tool hooks cannot reopen a completed turn.
    if (task.closed && !newTurn && e.event !== 'UserPromptSubmit') return false;
    if (newTurn || e.event === 'UserPromptSubmit') {
      if (newTurn && task.turnId) {
        task.pastTurns.add(task.turnId);
        while (task.pastTurns.size > 16) task.pastTurns.delete(task.pastTurns.values().next().value);
      }
      task.closed = false;
      task.failedUntil = 0;
      task.waiting.clear();
    }
    task.turnId = e.turnId || task.turnId;
    task.at = e.at;
    task.workspace = e.workspace;
    if (e.event === 'Stop' || e.event === 'Interrupt') {
      task.state = 'idle'; task.closed = true; task.failedUntil = 0; task.waiting.clear();
    } else if (e.event === 'PermissionRequest' || (e.event === 'PreToolUse' && INPUT_TOOL.test(e.tool))) {
      task.waiting.add(e.callId || e.tool); task.state = 'waiting'; task.failedUntil = 0;
    } else {
      if (e.event === 'PostToolUse') task.waiting.delete(e.callId || e.tool);
      task.state = task.waiting.size ? 'waiting' : 'running';
      if (e.event === 'PostToolUse' && e.failed) task.failedUntil = e.at + 2200;
    }
    this.tasks.delete(e.sessionId);
    this.tasks.set(e.sessionId, task);
    while (this.tasks.size > 50) this.tasks.delete(this.tasks.keys().next().value);
    return true;
  }
  current(fixedId, now = Date.now()) {
    const values = [...this.tasks.values()];
    const task = fixedId ? this.tasks.get(fixedId) : values.at(-1);
    if (!task) return {state: 'idle', status: 'Awaiting events', task: null};
    // A silent long-running job is not a failure. The status explicitly becomes unconfirmed.
    if (!task.closed && now - task.at > 30 * 60 * 1000) return {state: 'idle', status: 'No recent events (state unconfirmed)', task};
    return {state: now < task.failedUntil ? 'failed' : task.state, status: 'Connected', task};
  }
}

function clampBounds(bounds, workAreas) {
  const area = workAreas.find(a => bounds.x + bounds.width / 2 >= a.x && bounds.x + bounds.width / 2 <= a.x + a.width &&
    bounds.y + bounds.height / 2 >= a.y && bounds.y + bounds.height / 2 <= a.y + a.height) || workAreas[0];
  const height = Math.min(bounds.height, area.height);
  const width = Math.min(bounds.width, area.width);
  return {width, height, x: Math.round(Math.max(area.x, Math.min(bounds.x, area.x + area.width - width))),
    y: Math.round(Math.max(area.y, Math.min(bounds.y, area.y + area.height - height)))};
}

module.exports = {STATES, EVENTS, TaskStates, validateEvent, clampBounds};
