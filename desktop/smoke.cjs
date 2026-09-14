'use strict';
// Test-only geometric sprites exercise the engine without claiming artwork acceptance.
const {_electron} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

(async () => {
  const realArt = process.env.ASSISTANT004_REAL_ART === '1';
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'assistant004-engine-'));
  const originalHooks = {description: 'Retain this existing configuration', hooks: {Stop: [{hooks: [{type: 'command', command: 'existing-handler'}]}]}};
  fs.mkdirSync(path.join(temp, 'codex'));
  fs.writeFileSync(path.join(temp, 'codex/hooks.json'), JSON.stringify(originalHooks));
  let instance;
  try {
    const executablePath = process.env.ASSISTANT004_TEST_EXE || require('electron');
    const args = [...(process.env.ASSISTANT004_TEST_EXE ? [] : [__dirname]), `--force-device-scale-factor=${process.env.TEST_DPR || 1}`];
    const launchOptions = {executablePath, args,
      env: {...process.env, ASSISTANT004_SMOKE: '1', ASSISTANT004_PROFILE: path.join(temp, 'profile'), CODEX_HOME: path.join(temp, 'codex'),
        ASSISTANT004_TEST_ASSETS: process.env.ASSISTANT004_ASSETS || path.resolve(__dirname, realArt ? '../build/art-review' : '../build/engine-test/pets')}};
    instance = await _electron.launch(launchOptions);
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
    const ids = await instance.evaluate(() => [...globalThis.__petTest.models.keys()]);
    if (!realArt) assert.equal(ids.length, 4);
    for (const pet of ids) {
      await instance.evaluate((_, id) => globalThis.__petTest.set('pet', id), pet);
      await page.waitForTimeout(200);
      assert.equal(await instance.evaluate(() => globalThis.__petTest.snapshot().model.id), pet);
      assert.ok((await pixels()).occupied > 0);
    }
    const loops = [];
    if (realArt && process.env.ASSISTANT004_REVIEW_ALL === '1') {
      const reviewDir = path.resolve(__dirname, '../build/art-review/playback');
      fs.mkdirSync(reviewDir, {recursive: true});
      for (const pet of ids) for (const height of [208, 320]) for (const background of ['#ffffff', '#17191c']) {
        await instance.evaluate((_, v) => { const t = globalThis.__petTest; t.set('pet', v.pet); t.set('height', v.height); }, {pet, height});
        await page.evaluate(bg => { document.body.style.background = bg; }, background);
        for (const state of require('./state.cjs').STATES) {
          await instance.evaluate((_, s) => globalThis.__petTest.set('mode', s), state);
          await page.waitForFunction(key => displayedKey === key, `${pet}:${state}`);
          const durations = await instance.evaluate(() => globalThis.__petTest.snapshot().model.clips[globalThis.__petTest.settings.mode].durations);
          const sums = new Set(), until = Date.now() + durations.reduce((a, b) => a + b, 0) * 2;
          while (Date.now() < until) { sums.add((await pixels()).checksum); await page.waitForTimeout(45); }
          assert.ok(sums.size >= durations.length, `${pet}/${state} must display every drawn frame`);
          const name = `${pet}-${state}-${height}-${background === '#ffffff' ? 'light' : 'dark'}`;
          await page.screenshot({path: path.join(reviewDir, name + '.png')});
          loops.push({pet, state, height, background, uniqueDisplayedFrames: sums.size});
        }
        console.log(JSON.stringify({playback: pet, height, background, passed: true}));
      }
      fs.writeFileSync(path.join(reviewDir, 'results.json'), JSON.stringify(loops, null, 2));
      await page.evaluate(() => { document.body.style.background = 'transparent'; });
    }
    await instance.evaluate(() => globalThis.__petTest.set('clickThrough', true));
    assert.equal(await instance.evaluate(() => globalThis.__petTest.settings.clickThrough), true);
    if (process.platform === 'win32') {
      const handles = await instance.evaluate(async ({BrowserWindow}) => {
        const t = globalThis.__petTest;
        t.underlay = new BrowserWindow({...t.win.getBounds(), frame: false, show: false, webPreferences: {sandbox: true}});
        await t.underlay.loadURL('data:text/html,<body style="margin:0"><button style="width:100vw;height:100vh" onclick="document.body.dataset.hits=1">Click-through verification</button>');
        t.underlay.show(); t.underlay.moveTop(); t.underlay.focus();
        return {pet: t.win.getNativeWindowHandle().readBigUInt64LE().toString(), test: t.underlay.getNativeWindowHandle().readBigUInt64LE().toString(), pid: process.pid};
      });
      try {
        await page.waitForTimeout(250);
        const native = JSON.parse(require('node:child_process').execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-ExecutionPolicy', 'Bypass',
          '-File', path.join(__dirname, 'native-smoke.ps1'), '-PetHandle', handles.pet, '-TestHandle', handles.test, '-OwnerProcessId', String(handles.pid)], {windowsHide: true, timeout: 10000, encoding: 'utf8'}));
        assert.equal(native.style && native.hitTest, true);
        if (native.pointerInput) assert.equal(await instance.evaluate(() => globalThis.__petTest.underlay.webContents.executeJavaScript('document.body.dataset.hits')), '1', 'Native click must reach the window behind the pet');
        else assert.equal(native.reason, 'Input desktop is unavailable');
        console.log(JSON.stringify({nativeWindows: native}));
      } finally { await instance.evaluate(() => { globalThis.__petTest.underlay.close(); delete globalThis.__petTest.underlay; }); }
    }
    await instance.evaluate(() => globalThis.__petTest.set('clickThrough', false));
    await instance.evaluate(async () => globalThis.__petTest.enableIntegration());
    const endpoint = JSON.parse(fs.readFileSync(path.join(temp, 'profile/hook-endpoint.json')));
    for (const [event, expected] of [['UserPromptSubmit', 'running'], ['PermissionRequest', 'waiting'], ['PostToolUse', 'running'], ['Stop', 'idle']]) {
      await fetch(`http://127.0.0.1:${endpoint.port}/events`, {method: 'POST', headers: {Authorization: `Bearer ${endpoint.token}`}, body: JSON.stringify({
        event, sessionId: 'live-smoke', turnId: 'turn-1', callId: 'call-1', tool: 'Bash', at: Date.now(), failed: false, workspace: 'smoke'})});
      assert.equal(await instance.evaluate(() => globalThis.__petTest.tasks.current().state), expected);
    }
    await instance.evaluate(() => globalThis.__petTest.disableIntegration());
    assert.deepEqual(JSON.parse(fs.readFileSync(path.join(temp, 'codex/hooks.json'), 'utf8')), originalHooks);
    await assert.rejects(fetch(`http://127.0.0.1:${endpoint.port}/events`, {method: 'POST'}));
    assert.deepEqual(errors, []);
    const screenshot = path.resolve(__dirname, realArt ? '../build/art-review/window.png' : '../build/engine-test/window.png');
    await page.screenshot({path: screenshot, omitBackground: true});
    const restoredBounds = await instance.evaluate(() => globalThis.__petTest.win.getBounds());
    await instance.close(); instance = await _electron.launch(launchOptions); await instance.firstWindow();
    await instance.evaluate(async () => { for (let i = 0; i < 100; i++) { if (globalThis.__petTest) return; await new Promise(resolve => setTimeout(resolve, 50)); } throw Error('Restored app did not become ready'); });
    const actualBounds = await instance.evaluate(() => globalThis.__petTest.win.getBounds());
    assert.ok(Math.abs(actualBounds.x - restoredBounds.x) <= 2 && Math.abs(actualBounds.y - restoredBounds.y) <= 2, 'Position restored after exit');
    console.log(JSON.stringify({engineSmoke: 'passed', fixtureOnly: !realArt, models: ids, dpr: process.env.TEST_DPR || '1', drag: {before: originalBounds, after: draggedBounds}, screenshot, restoredBounds: actualBounds}));
  } finally {
    if (instance) await instance.close();
    assert.equal(path.dirname(path.resolve(temp)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(temp).startsWith('assistant004-'));
    fs.rmSync(temp, {recursive: true, force: true});
  }
})().catch(e => { console.error(e); process.exitCode = 1; });
