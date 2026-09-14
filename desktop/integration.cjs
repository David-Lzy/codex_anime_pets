'use strict';

const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const {EVENTS, validateEvent} = require('./state.cjs');
const MARKER = 'Assistant004Hook';
const owned = h => /(?:^|\s)--?Assistant004Hook(?:\s|$)/.test(String(h.command || ''));

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), {recursive: true});
  const temporary = `${file}.${crypto.randomUUID()}.tmp`;
  try {
    fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + '\n', {mode: 0o600});
    fs.renameSync(temporary, file);
  } finally { if (fs.existsSync(temporary)) fs.unlinkSync(temporary); }
}

function readConfig(file) {
  if (!fs.existsSync(file)) return {};
  const data = JSON.parse(fs.readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
      (data.hooks != null && (typeof data.hooks !== 'object' || Array.isArray(data.hooks)))) throw Error('Invalid hooks.json; left untouched.');
  for (const groups of Object.values(data.hooks || {})) {
    if (!Array.isArray(groups) || groups.some(g => !g || !Array.isArray(g.hooks))) throw Error('Invalid hook groups; left untouched.');
  }
  return data;
}

function removeOwned(data) {
  const out = structuredClone(data);
  if (!out.hooks) return out;
  for (const [event, groups] of Object.entries(out.hooks)) {
    out.hooks[event] = groups.flatMap(g => {
      if (!g.hooks.some(owned)) return [g];
      const hooks = g.hooks.filter(h => !owned(h));
      return hooks.length ? [{...g, hooks}] : [];
    });
    if (!out.hooks[event].length && groups.length) delete out.hooks[event];
  }
  return out;
}

function configure(home, command, enable) {
  const file = path.join(home, 'hooks.json');
  const before = readConfig(file);
  const after = removeOwned(before);
  if (enable) {
    after.hooks ||= {};
    for (const event of EVENTS) {
      after.hooks[event] ||= [];
      after.hooks[event].push({hooks: [{type: 'command', command, async: true, timeout: 3}]});
    }
  }
  if (JSON.stringify(before) === JSON.stringify(after)) return null;
  if (JSON.stringify(readConfig(file)) !== JSON.stringify(before)) throw Error('Hooks changed during setup; retry without overwriting concurrent edits.');
  const backup = fs.existsSync(file) ? `${file}.assistant004-${Date.now()}-${crypto.randomBytes(3).toString('hex')}.bak` : null;
  if (backup) fs.copyFileSync(file, backup, fs.constants.COPYFILE_EXCL);
  writeJson(file, after);
  return backup;
}

function isEnabled(home) {
  return Object.values(readConfig(path.join(home, 'hooks.json')).hooks || {})
    .some(groups => groups.some(g => g.hooks.some(owned)));
}

function hookCommand(appPath, endpointFile, platform = process.platform, node = 'node') {
  if (platform === 'win32') {
    const quote = s => {
      if (/["%\r\n!]/.test(s)) throw Error('Unsupported special character in installation path.');
      return `"${s}"`;
    };
    return `powershell.exe -NoProfile -NonInteractive -WindowStyle Hidden -ExecutionPolicy Bypass -File ${quote(path.join(appPath, 'hooks', 'bridge.ps1'))} -EndpointFile ${quote(endpointFile)} -${MARKER}`;
  }
  const quote = s => `'${s.replaceAll("'", "'\\''")}'`;
  return `${quote(node)} ${quote(path.join(appPath, 'hooks', 'bridge.cjs'))} --endpoint ${quote(endpointFile)} --${MARKER}`;
}

async function startReceiver(endpointFile, onEvent) {
  const token = crypto.randomBytes(32).toString('hex');
  const expected = Buffer.from(`Bearer ${token}`);
  const server = http.createServer((req, res) => {
    const auth = Buffer.from(String(req.headers.authorization || ''));
    if (req.headers.origin || auth.length !== expected.length || !crypto.timingSafeEqual(auth, expected)) {
      res.writeHead(401).end(); req.resume(); return;
    }
    if (req.method !== 'POST' || req.url !== '/events') { res.writeHead(404).end(); req.resume(); return; }
    let bytes = 0, chunks = [], rejected = false;
    req.on('data', chunk => {
      bytes += chunk.length;
      if (bytes > 4096) { if (!rejected) res.writeHead(413).end(); rejected = true; chunks = []; }
      if (!rejected) chunks.push(chunk);
    });
    req.on('end', () => {
      if (rejected) return;
      try {
        const event = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!validateEvent(event)) { res.writeHead(400).end(); return; }
        // Forward only the documented minimal envelope, never arbitrary input fields.
        const {event: type, sessionId, turnId, callId, tool, failed, at, workspace} = event;
        onEvent({event: type, sessionId, turnId, callId, tool, failed, at, workspace});
        res.writeHead(204).end();
      } catch { res.writeHead(400).end(); }
    });
    req.on('error', () => {});
  });
  server.requestTimeout = 2000;
  server.headersTimeout = 2000;
  server.maxConnections = 32;
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const endpoint = {port: server.address().port, token};
  try { writeJson(endpointFile, endpoint); } catch (e) { server.close(); throw e; }
  return {server, endpoint, close() {
    server.closeAllConnections(); server.close();
    try { if (JSON.parse(fs.readFileSync(endpointFile, 'utf8')).token === token) fs.unlinkSync(endpointFile); } catch {}
  }};
}

module.exports = {writeJson, configure, isEnabled, hookCommand, startReceiver, removeOwned};
