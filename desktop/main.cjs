'use strict';

const {app, BrowserWindow, Menu, Tray, nativeImage, screen, ipcMain, dialog} = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {pathToFileURL} = require('node:url');
const {STATES, TaskStates, clampBounds} = require('./state.cjs');
const integration = require('./integration.cjs');

if (process.env.ASSISTANT004_PROFILE) app.setPath('userData', path.resolve(process.env.ASSISTANT004_PROFILE));
const single = app.requestSingleInstanceLock();
if (!single) app.quit();
let win, tray, receiver, timer, saveTimer, dragOrigin, integrationError = '', artworkError = false;
let gesture = null, lastUpdate = '';
let lastCursor = null, lookUntil = 0;
const tasks = new TaskStates();
const home = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
const settingsFile = path.join(app.getPath('userData'), 'settings.json');
const endpointFile = path.join(app.getPath('userData'), 'hook-endpoint.json');
const settings = {pet: 'assistant-004', height: 320, paused: false, clickThrough: false, mode: 'auto', taskId: '', look: true};
const models = new Map();

function persist() {
  if (win && !win.isDestroyed()) Object.assign(settings, {x: win.getBounds().x, y: win.getBounds().y});
  try { integration.writeJson(settingsFile, settings); } catch (e) { integrationError = `Settings: ${e.message}`; }
}
function bounds(height = settings.height) {
  const area = screen.getPrimaryDisplay().workArea;
  const width = Math.round(height * 768 / 832);
  return clampBounds({height, width, x: Number.isFinite(settings.x) ? settings.x : area.x + area.width - width - 28,
    y: Number.isFinite(settings.y) ? settings.y : area.y + area.height - height - 20}, screen.getAllDisplays().map(d => d.workArea));
}
function readModels() {
  const root = process.env.ASSISTANT004_SMOKE === '1' && process.env.ASSISTANT004_TEST_ASSETS ? path.resolve(process.env.ASSISTANT004_TEST_ASSETS) :
    app.isPackaged ? path.join(process.resourcesPath, 'pets') : path.resolve(__dirname, '..', 'pets');
  for (const entry of fs.readdirSync(root, {withFileTypes: true})) {
    const id = entry.name;
    if (!entry.isDirectory() || !/^[a-z0-9-]+$/.test(id) || !fs.existsSync(path.join(root, id, 'hd', 'animation.json'))) continue;
    const folder = path.join(root, id, 'hd');
    const model = JSON.parse(fs.readFileSync(path.join(folder, 'animation.json'), 'utf8'));
    if (model.cellWidth !== 768 || model.cellHeight !== 832) throw Error(`Invalid HD dimensions: ${id}`);
    for (const key of [...STATES, 'look']) {
      const clip = model.clips[key];
      if (!clip || !Array.isArray(clip.durations) || !clip.durations.length || clip.durations.some(n => !Number.isFinite(n) || n <= 0) ||
          !Number.isInteger(clip.columns) || clip.columns < 1 || !/^[a-z-]+\.webp$/.test(clip.file)) throw Error(`Invalid animation: ${id}/${key}`);
      if (!fs.existsSync(path.join(folder, clip.file))) throw Error(`Missing HD animation: ${id}/${key}`);
      clip.url = pathToFileURL(path.join(folder, clip.file)).href;
    }
    models.set(id, {...model, id});
  }
  if (!models.size) throw Error('No HD pets installed. Reinstall the complete package.');
  if (!models.has(settings.pet)) settings.pet = models.keys().next().value;
}
function snapshot() {
  const linked = tasks.current(settings.taskId);
  let state = settings.mode === 'auto' ? linked.state : settings.mode;
  if (gesture && gesture.until > Date.now()) state = gesture.state;
  else gesture = null;
  let look = null;
  if (state === 'idle' && settings.look && !settings.paused && !dragOrigin) {
    const p = screen.getCursorScreenPoint(), b = win.getBounds();
    if (lastCursor && (p.x !== lastCursor.x || p.y !== lastCursor.y)) lookUntil = Date.now() + 1500;
    lastCursor = p;
    const dx = p.x - b.x - b.width / 2, dy = p.y - b.y - b.height / 2;
    if (Date.now() < lookUntil && Math.hypot(dx, dy) > 10 && Math.hypot(dx, dy) < 1000) look = Math.round(((Math.atan2(dx, -dy) * 180 / Math.PI + 360) % 360) / 22.5) % 16;
  }
  return {state, look, paused: settings.paused, model: models.get(settings.pet),
    status: integrationError || (receiver ? linked.status : 'Integration disabled')};
}
function update() {
  if (!win || win.isDestroyed()) return;
  if (dragOrigin) {
    const p = dragOrigin.point;
    const b = clampBounds({...dragOrigin.bounds, x: dragOrigin.bounds.x + p.x - dragOrigin.cursor.x,
      y: dragOrigin.bounds.y + p.y - dragOrigin.cursor.y}, screen.getAllDisplays().map(d => d.workArea));
    win.setBounds(b);
  }
  const value = snapshot();
  const key = JSON.stringify([value.state, value.look, value.paused, settings.pet, value.status]);
  if (key !== lastUpdate) { lastUpdate = key; win.webContents.send('pet:update', value); }
  tray?.setToolTip(`Assistant-004: ${artworkError ? 'Artwork unavailable' : value.status} | ${value.state}`);
}
async function enableIntegration() {
  if (receiver) return;
  let next;
  try {
    next = await integration.startReceiver(endpointFile, e => { tasks.accept(e); update(); });
    const helperRoot = app.isPackaged ? app.getAppPath() + '.unpacked' : __dirname;
    integration.configure(home, integration.hookCommand(helperRoot, endpointFile), true);
    receiver = next; integrationError = ''; settings.integration = true; persist(); update();
  } catch (e) { next?.close(); integrationError = `Integration unavailable: ${e.message}`; update(); throw e; }
}
function disableIntegration() {
  integration.configure(home, '', false);
  receiver?.close(); receiver = null; settings.integration = false; integrationError = ''; persist(); update();
}
async function toggleIntegration() {
  try {
    if (receiver) disableIntegration();
    else {
      const choice = await dialog.showMessageBox(win, {type: 'question', buttons: ['Enable', 'Cancel'], defaultId: 1, cancelId: 1,
        message: 'Enable local Codex status integration?',
        detail: 'Back up and append observer hooks in CODEX_HOME/hooks.json. Existing hooks stay intact. No conversations leave this computer. Start a new Codex turn after enabling.'});
      if (choice.response === 0) await enableIntegration();
    }
  } catch (e) { dialog.showErrorBox('Codex integration', e.message); }
}
function set(name, value) {
  settings[name] = value;
  if (name === 'height') win.setBounds(bounds(value));
  if (name === 'clickThrough') win.setIgnoreMouseEvents(value, {forward: true});
  persist(); lastUpdate = ''; update();
}
function menu() {
  const linked = tasks.current(settings.taskId);
  const items = [
    {label: 'Assistant-004 Desktop', enabled: false},
    {label: integrationError || (receiver ? linked.status : 'Integration disabled'), enabled: false},
    {type: 'separator'},
    {label: 'Character', submenu: [...models].map(([id, model]) => ({label: model.displayName, type: 'radio', checked: settings.pet === id, click: () => set('pet', id)}))},
    {label: 'Action', submenu: [{label: 'Automatic', type: 'radio', checked: settings.mode === 'auto', click: () => set('mode', 'auto')},
      ...STATES.map(state => ({label: state, type: 'radio', checked: settings.mode === state, click: () => set('mode', state)}))]},
    {label: 'Size', submenu: [160, 240, 320, 480, 640].map(height => ({label: `${height} px`, type: 'radio', checked: settings.height === height, click: () => set('height', height)}))},
    {label: 'Paused', type: 'checkbox', checked: settings.paused, click: item => set('paused', item.checked)},
    {label: 'Look toward pointer', type: 'checkbox', checked: settings.look, click: item => set('look', item.checked)},
    {label: 'Click through (use tray to restore)', type: 'checkbox', checked: settings.clickThrough, click: item => set('clickThrough', item.checked)},
    {type: 'separator'},
    {label: 'Codex integration', type: 'checkbox', checked: !!receiver, click: toggleIntegration},
    {label: 'Follow task', submenu: [{label: 'Most recently active', type: 'radio', checked: !settings.taskId, click: () => set('taskId', '')},
      ...[...tasks.tasks.values()].reverse().map(t => ({label: `${t.workspace || 'Task'} (${t.id.slice(0, 8)})`, type: 'radio', checked: settings.taskId === t.id, click: () => set('taskId', t.id)}))]},
    {label: 'Reset position', click: () => { delete settings.x; delete settings.y; win.setBounds(bounds()); persist(); }},
    {type: 'separator'},
    {label: 'Quit', click: () => app.quit()}
  ];
  Menu.buildFromTemplate(items).popup({window: win});
}

app.on('second-instance', () => { win?.show(); win?.focus(); });
app.on('before-quit', () => {
  clearInterval(timer); clearTimeout(saveTimer); persist(); receiver?.close(); tray?.destroy();
});
app.on('window-all-closed', () => app.quit());

if (single) app.whenReady().then(async () => {
  try {
    try {
      const saved = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
      if (typeof saved.pet === 'string' && /^[a-z0-9-]+$/.test(saved.pet)) settings.pet = saved.pet;
      if ([160, 240, 320, 480, 640].includes(saved.height)) settings.height = saved.height;
      for (const key of ['x', 'y']) if (Number.isFinite(saved[key])) settings[key] = saved[key];
      for (const key of ['paused', 'clickThrough', 'look', 'integration']) if (typeof saved[key] === 'boolean') settings[key] = saved[key];
      if (STATES.includes(saved.mode) || saved.mode === 'auto') settings.mode = saved.mode;
      if (typeof saved.taskId === 'string' && saved.taskId.length <= 160) settings.taskId = saved.taskId;
    } catch {}
    readModels();
    win = new BrowserWindow({...bounds(), frame: false, transparent: true, backgroundColor: '#00000000',
      alwaysOnTop: true, skipTaskbar: true, resizable: false, maximizable: false, fullscreenable: false, show: false,
      webPreferences: {preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: true, nodeIntegration: false}});
    win.webContents.setWindowOpenHandler(() => ({action: 'deny'}));
    win.webContents.on('will-navigate', e => e.preventDefault());
    win.webContents.session.setPermissionRequestHandler((_, __, callback) => callback(false));
    const trusted = event => event.sender === win.webContents && event.senderFrame === win.webContents.mainFrame;
    ipcMain.handle('pet:ready', event => { if (trusted(event)) return snapshot(); });
    ipcMain.on('pet:menu', event => { if (trusted(event)) menu(); });
    ipcMain.on('pet:gesture', (event, state) => {
      if (!trusted(event) || !['waving', 'jumping'].includes(state)) return;
      const duration = models.get(settings.pet).clips[state].durations.reduce((a, b) => a + b, 0);
      gesture = {state, until: Date.now() + duration}; update();
    });
    ipcMain.on('pet:loaded', (event, ok) => { if (trusted(event)) artworkError = !ok; });
    ipcMain.on('pet:drag', (event, point) => {
      if (!trusted(event) || settings.clickThrough) return;
      if (!point || !['start', 'move', 'end'].includes(point.phase)) return;
      if (point.phase === 'end') { update(); dragOrigin = null; persist(); return; }
      if (![point.x, point.y].every(n => Number.isFinite(n) && Math.abs(n) < 100000)) return;
      if (point.phase === 'start') dragOrigin = {cursor: point, point, bounds: win.getBounds()};
      if (point.phase === 'move' && dragOrigin) dragOrigin.point = point;
    });
    win.on('blur', () => { dragOrigin = null; });
    win.on('moved', () => { clearTimeout(saveTimer); saveTimer = setTimeout(persist, 250); });
    screen.on('display-removed', () => win.setBounds(bounds()));
    screen.on('display-metrics-changed', () => win.setBounds(bounds()));
    const iconFile = process.env.ASSISTANT004_SMOKE === '1' && process.env.ASSISTANT004_TEST_ASSETS ?
      path.join(process.env.ASSISTANT004_TEST_ASSETS, settings.pet, 'hd', 'tray.png') :
      path.join(app.isPackaged ? process.resourcesPath : path.resolve(__dirname, '..'), 'pets', settings.pet, 'hd', 'tray.png');
    const icon = nativeImage.createFromPath(iconFile);
    if (icon.isEmpty()) throw Error('Missing tray icon. Reinstall the complete package.');
    tray = new Tray(icon.resize({width: 24, height: 24}));
    tray.on('click', menu); tray.on('right-click', menu);
    await win.loadFile(path.join(__dirname, 'index.html'));
    win.setIgnoreMouseEvents(settings.clickThrough, {forward: true});
    win.showInactive();
    timer = setInterval(update, 50);
    if (settings.integration) { try { await enableIntegration(); } catch {} }
    if (process.env.ASSISTANT004_SMOKE === '1') globalThis.__petTest = {win, tasks, settings, models, set, snapshot, enableIntegration, disableIntegration, endpointFile, home};
  } catch (e) { dialog.showErrorBox('Assistant-004 could not start', e.message); app.quit(); }
});
