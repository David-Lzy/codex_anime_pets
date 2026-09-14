'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {spawn} = require('node:child_process');
const {TaskStates, validateEvent, clampBounds} = require('./state.cjs');
const {configure, startReceiver, hookCommand} = require('./integration.cjs');
const {normalize} = require('./hooks/bridge.cjs');
function removeTemp(folder) {
  assert.equal(path.dirname(path.resolve(folder)), path.resolve(os.tmpdir()));
  assert.ok(path.basename(folder).startsWith('assistant004-'));
  fs.rmSync(folder, {recursive: true, force: true});
}

const event = (type, extra = {}) => ({event: type, sessionId: 'test-session', turnId: 'turn-1', callId: '',
  tool: '', failed: false, at: Date.now(), workspace: 'workspace', ...extra});

test('busy, concurrent approval, input, transient failure, stop and delayed hooks', () => {
  const states = new TaskStates();
  states.accept(event('UserPromptSubmit'));
  assert.equal(states.current().state, 'running');
  states.accept(event('PermissionRequest', {tool: 'Bash', callId: 'a'}));
  states.accept(event('PostToolUse', {tool: 'read_file', callId: 'b'}));
  assert.equal(states.current().state, 'waiting');
  states.accept(event('PostToolUse', {tool: 'Bash', callId: 'a'}));
  assert.equal(states.current().state, 'running');
  states.accept(event('PreToolUse', {tool: 'functions.request_user_input', callId: 'q'}));
  assert.equal(states.current().state, 'waiting');
  states.accept(event('PostToolUse', {tool: 'functions.request_user_input', callId: 'q'}));
  states.accept(event('PostToolUse', {failed: true}));
  assert.equal(states.current().state, 'failed');
  assert.equal(states.current('', Date.now() + 2300).state, 'running');
  states.accept(event('Stop'));
  assert.equal(states.current().state, 'idle');
  assert.equal(states.accept(event('PostToolUse')), false);
  states.accept(event('UserPromptSubmit', {turnId: 'turn-2'}));
  assert.equal(states.accept(event('PostToolUse', {turnId: 'turn-1'})), false);
  states.accept(event('Interrupt', {turnId: 'turn-2'}));
  assert.equal(states.current().state, 'idle');
  assert.equal(states.current('unknown').status, 'Awaiting events');
  assert.equal(validateEvent(event('Invalid')), false);
  assert.equal(validateEvent(event('Stop', {at: 1})), false);
  states.accept(event('UserPromptSubmit', {sessionId: 'older'}));
  states.accept(event('UserPromptSubmit', {sessionId: 'newest'}));
  states.accept(event('Stop', {sessionId: 'newest'}));
  assert.equal(states.current().state, 'idle');
  assert.equal(states.current('older').state, 'running');
});

test('hook normalization excludes conversations and preserves only structured errors', () => {
  const e = normalize({session_id: 's', hook_event_name: 'PostToolUse', cwd: 'C:\\Users\\private\\project',
    prompt: 'secret', tool_input: {password: 'secret'}, tool_response: {exit_code: 1, output: 'secret'}});
  assert.equal(e.failed, true);
  assert.equal(e.workspace, 'project');
  assert.ok(!JSON.stringify(e).includes('secret'));
  assert.equal(normalize({tool_response: 'this says error but is not a structured failure'}).failed, false);
});

test('hook merge, repeated enable and disable preserve unrelated handlers and reject corruption', t => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'assistant004-hooks-'));
  t.after(() => removeTemp(home));
  const file = path.join(home, 'hooks.json');
  const before = {description: 'existing', hooks: {PreCompact: [], SessionStart: [{hooks: []}],
    Stop: [{matcher: 'x', hooks: [{type: 'command', command: 'keep me'}]}]}};
  fs.writeFileSync(file, JSON.stringify(before));
  const command = 'observer --Assistant004Hook';
  const backup = configure(home, command, true);
  assert.deepEqual(JSON.parse(fs.readFileSync(backup)), before);
  configure(home, command, true);
  assert.equal(JSON.parse(fs.readFileSync(file)).hooks.Stop.length, 2);
  configure(home, command, false);
  assert.deepEqual(JSON.parse(fs.readFileSync(file)), before);
  fs.writeFileSync(file, '{invalid');
  assert.throws(() => configure(home, command, true));
  assert.equal(fs.readFileSync(file, 'utf8'), '{invalid');
  assert.match(hookCommand('C:\\Program Files\\pet', 'C:\\profile\\endpoint.json', 'win32'), /WindowStyle Hidden/);
  assert.throws(() => hookCommand('C:\\bad%PATH%', 'endpoint', 'win32'));
});

test('receiver requires token, rejects invalid or large payloads, and real bridges send events', async t => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'assistant004-receiver-'));
  const endpointFile = path.join(home, 'endpoint.json');
  const received = [];
  const receiver = await startReceiver(endpointFile, e => received.push(e));
  t.after(() => { receiver.close(); removeTemp(home); });
  const url = `http://127.0.0.1:${receiver.endpoint.port}/events`;
  const headers = {Authorization: `Bearer ${receiver.endpoint.token}`};
  assert.equal((await fetch(url, {method: 'POST'})).status, 401);
  assert.equal((await fetch(url, {method: 'POST', headers, body: '{}'})).status, 400);
  assert.equal((await fetch(url, {method: 'POST', headers, body: 'x'.repeat(4100)})).status, 413);
  assert.equal((await fetch(url, {method: 'POST', headers, body: JSON.stringify(event('Stop', {secret: 'no'}))})).status, 204);
  assert.ok(!JSON.stringify(received).includes('secret'));
  const input = {hook_event_name: 'UserPromptSubmit', session_id: 'bridge-session', turn_id: 'bridge-turn', cwd: home};
  async function run(exe, args) {
    const child = spawn(exe, args, {windowsHide: true, stdio: ['pipe', 'pipe', 'pipe']});
    let output = ''; child.stdout.on('data', b => output += b); child.stderr.on('data', b => output += b);
    child.stdin.end(JSON.stringify(input));
    const code = await new Promise((resolve, reject) => { child.once('error', reject); child.once('exit', resolve); });
    assert.equal(code, 0, output); assert.equal(output, '');
  }
  await run(process.execPath, [path.join(__dirname, 'hooks/bridge.cjs'), '--endpoint', endpointFile]);
  if (process.platform === 'win32') await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass',
    '-File', path.join(__dirname, 'hooks/bridge.ps1'), '-EndpointFile', endpointFile, '-Assistant004Hook']);
  assert.equal(received.filter(e => e.sessionId === 'bridge-session').length, process.platform === 'win32' ? 2 : 1);
  receiver.close();
  await run(process.execPath, [path.join(__dirname, 'hooks/bridge.cjs'), '--endpoint', endpointFile]);
});

test('removed monitors and extreme saved coordinates remain visible', () => {
  const area = {x: -1920, y: 0, width: 1920, height: 1080};
  assert.deepEqual(clampBounds({x: 9000, y: 9000, width: 300, height: 320}, [area]),
    {x: -300, y: 760, width: 300, height: 320});
});

test('returning to a cached action cancels a pending image decode', async () => {
  const vm = require('node:vm'), pending = [];
  const canvas = {getContext: () => ({}), addEventListener() {}};
  const context = vm.createContext({document: {querySelector: () => canvas}, performance: {now: () => 0},
    requestAnimationFrame() {}, window: {pet: {onUpdate() {}, ready: () => new Promise(() => {}), loaded() {}}},
    Image: class {decode() {return new Promise(resolve => pending.push(resolve));}}});
  vm.runInContext(fs.readFileSync(path.join(__dirname, 'renderer.js'), 'utf8'), context);
  const update = state => vm.runInContext(`update({state: '${state}', look: null, model: {id: 'test', cellWidth: 768, cellHeight: 832,
    clips: {idle: {url: 'idle'}, running: {url: 'running'}}}})`, context);
  const idle = update('idle'); pending.shift()(); await idle;
  const running = update('running'); await update('idle'); pending.shift()(); await running;
  assert.equal(vm.runInContext('displayedKey', context), 'test:idle');
});
