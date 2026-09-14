'use strict';

const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

function normalize(input, at = Date.now()) {
  let output = input.tool_response;
  if (typeof output === 'string') { try { output = JSON.parse(output); } catch { output = null; } }
  const failed = !!(output && typeof output === 'object' && (output.isError === true || output.is_error === true ||
    (Number.isInteger(output.exit_code) && output.exit_code !== 0)));
  return {event: input.hook_event_name, sessionId: input.session_id, turnId: input.turn_id || '',
    callId: input.tool_use_id || '',
    tool: String(input.tool_name || '').slice(0, 180), failed, at,
    workspace: path.basename(String(input.cwd || '').replaceAll('\\', '/')).slice(0, 100)};
}

if (require.main === module) {
  const at = Date.now();
  let chunks = [], bytes = 0;
  process.stdin.on('data', data => { bytes += data.length; if (bytes > 8 * 1024 * 1024) process.exit(0); chunks.push(data); });
  process.stdin.on('end', () => {
    try {
      if (bytes > 8 * 1024 * 1024) return;
      const endpointFile = process.argv[process.argv.indexOf('--endpoint') + 1];
      const {port, token} = JSON.parse(fs.readFileSync(endpointFile, 'utf8'));
      if (!Number.isInteger(port) || port < 1 || port > 65535 || !/^[a-f0-9]{64}$/.test(token)) return;
      const body = JSON.stringify(normalize(JSON.parse(Buffer.concat(chunks).toString('utf8')), at));
      const req = http.request({host: '127.0.0.1', port, path: '/events', method: 'POST', timeout: 750,
        headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'}}, res => res.resume());
      req.on('error', () => {}); req.on('timeout', () => req.destroy()); req.end(body);
    } catch {}
  });
  process.stdin.on('error', () => {});
  setTimeout(() => process.exit(0), 1800).unref();
}
module.exports = {normalize};
