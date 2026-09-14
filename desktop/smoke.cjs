'use strict';
// Test-only geometric sprites exercise the engine without claiming artwork acceptance.
const {_electron} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

(async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'assistant004-engine-'));
  let instance;
  try {
    const executablePath = process.env.ASSISTANT004_TEST_EXE || require('electron');
    const args = [...(process.env.ASSISTANT004_TEST_EXE ? [] : [__dirname]), `--force-device-scale-factor=${process.env.TEST_DPR || 1}`];
    instance = await _electron.launch({executablePath, args,
      env: {...process.env, ASSISTANT004_SMOKE: '1', ASSISTANT004_PROFILE: path.join(temp, 'profile'), CODEX_HOME: path.join(temp, 'codex'),
        ASSISTANT004_TEST_ASSETS: path.resolve(__dirname, '../build/engine-test/pets')}});
    const page = await instance.firstWindow();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.waitForFunction(() => {
      const c = document.querySelector('canvas');
      if (!c || c.width < 100 || c.height < 100) return false;
      const pixels = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      for (let i = 3; i < pixels.length; i += 4) if (pixels[i] > 0) return true;
      return false;
    });
    const originalBounds = await instance.evaluate(() => globalThis.__petTest.win.getBounds());
    await page.mouse.move(120, 170); await page.mouse.down();
    await page.mouse.move(135, 175); await page.waitForTimeout(100);
    await page.mouse.move(180, 200); await page.waitForTimeout(150); await page.mouse.up();
    const draggedBounds = await instance.evaluate(() => globalThis.__petTest.win.getBounds());
    assert.ok(Math.hypot(draggedBounds.x - originalBounds.x, draggedBounds.y - originalBounds.y) > 10, 'Real pointer drag must move the window');
    await instance.evaluate(() => { globalThis.__petTest.set('look', false); globalThis.__petTest.set('mode', 'running'); });
    await page.waitForTimeout(350);
    const pixels = () => page.evaluate(() => {
      const c = document.querySelector('canvas'), a = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let occupied = 0, checksum = 0;
      for (let i = 0; i < a.length; i += 4) { if (a[i + 3]) occupied++; checksum += a[i]; }
      return {occupied, checksum, total: a.length / 4};
    });
    const before = await pixels(); await page.waitForTimeout(350); const after = await pixels();
    assert.ok(before.occupied > before.total * 0.1 && before.occupied < before.total * 0.8);
    assert.notEqual(before.checksum, after.checksum);
    await instance.evaluate(() => globalThis.__petTest.set('paused', true));
    await page.waitForTimeout(150);
    const paused = await pixels(); await page.waitForTimeout(350); assert.deepEqual(await pixels(), paused);
    await instance.evaluate(() => { const t = globalThis.__petTest; t.set('paused', false); t.set('pet', 'assistant-004-anime'); t.set('height', 640); });
    await page.waitForTimeout(250);
    assert.equal(await instance.evaluate(() => globalThis.__petTest.win.getBounds().height), 640);
    await instance.evaluate(() => globalThis.__petTest.set('clickThrough', true));
    assert.equal(await instance.evaluate(() => globalThis.__petTest.settings.clickThrough), true);
    await instance.evaluate(() => globalThis.__petTest.set('clickThrough', false));
    await instance.evaluate(async () => globalThis.__petTest.enableIntegration());
    const endpoint = JSON.parse(fs.readFileSync(path.join(temp, 'profile/hook-endpoint.json')));
    for (const [event, expected] of [['UserPromptSubmit', 'running'], ['PermissionRequest', 'waiting'], ['PostToolUse', 'running'], ['Stop', 'idle']]) {
      await fetch(`http://127.0.0.1:${endpoint.port}/events`, {method: 'POST', headers: {Authorization: `Bearer ${endpoint.token}`}, body: JSON.stringify({
        event, sessionId: 'live-smoke', turnId: 'turn-1', callId: 'call-1', tool: 'Bash', at: Date.now(), failed: false, workspace: 'smoke'})});
      assert.equal(await instance.evaluate(() => globalThis.__petTest.tasks.current().state), expected);
    }
    await instance.evaluate(() => globalThis.__petTest.disableIntegration());
    assert.ok(!fs.readFileSync(path.join(temp, 'codex/hooks.json'), 'utf8').includes('Assistant004Hook'));
    assert.deepEqual(errors, []);
    const screenshot = path.resolve(__dirname, '../build/engine-test/window.png');
    await page.screenshot({path: screenshot, omitBackground: true});
    console.log(JSON.stringify({engineSmoke: 'passed', fixtureOnly: true, dpr: process.env.TEST_DPR || '1', drag: {before: originalBounds, after: draggedBounds}, screenshot, geometry: await instance.evaluate(() => globalThis.__petTest.win.getBounds())}));
  } finally {
    if (instance) await instance.close();
    assert.equal(path.dirname(path.resolve(temp)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(temp).startsWith('assistant004-'));
    fs.rmSync(temp, {recursive: true, force: true});
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
