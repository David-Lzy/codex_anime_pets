# Assistant-004 Desktop

[English](README.md) | [中文](README.zh-CN.md)

**Development status:** the engine and local event bridge are implemented. The new HD character animations are not yet accepted or included. A production launch requires both reviewed HD asset folders; test fixtures are never release artwork.

## Run From Source

Requires Node.js 22.12+ and pnpm 11.19.0. From this directory:

```sh
pnpm install --frozen-lockfile
pnpm start
```

Required assets: `pets/assistant-004/hd/` and `pets/assistant-004-anime/hd/`, each containing `animation.json`, lossless WebP animation clips and `tray.png`. Frames are 768x832 pixels. The packager creates these from reviewed source frames; it rejects fake transparency, undersized frames and static-frame padding.

## Local Codex Integration

Choose **Codex integration** in the tray menu. Enabling it asks for confirmation, backs up `$CODEX_HOME/hooks.json` (or `~/.codex/hooks.json`) and appends observer hooks. Existing hooks are retained. Start a new Codex turn after enabling.

Events go only to a random port bound to `127.0.0.1`, authenticated with a random token stored in the app's user-data directory. The bridge sends event type, task/turn/tool-call identifiers, tool name, a structured error flag, timestamp and workspace basename. It does not transmit prompts, tool arguments, tool output, credentials or transcripts. Nothing is uploaded to a service.

Hooks run in the background, produce no output, and never approve, reject or change a Codex action. Tool errors show a brief frustrated pose, not a failed-task verdict. Unsupported/unstructured errors are not guessed from text. Missing events are labelled unconfirmed after 30 minutes, not treated as failure. Remote/server sessions are not connected automatically.

Disabling integration removes only handlers bearing the exact `Assistant004Hook` flag. Backups remain available. Disable integration before deleting or moving the application. Simply quitting leaves the configuration in place for the next launch; bridge calls fail quietly while the app is closed.

Official interface: [Codex Hooks](https://learn.chatgpt.com/docs/hooks).

## Controls

Drag the character to move it. Click to wave; double-click for a small hop. Right-click or open the tray menu to select a character, action, size, pause, pointer tracking, mouse passthrough or task to follow. The tray remains usable with mouse passthrough enabled. No autostart is configured.

Working, inspecting, waiting and frustrated poses use the lab coat. Idle, greeting, hopping and directional movement use the casual jacket. Clothing changes with the selected animation.

## Tests And Packaging

```sh
pnpm test
python ../scripts/make_test_art.py
node smoke.cjs
pnpm dist:win
```

On macOS/Linux, `pnpm build:dir` produces an unpacked application for the current host; these builds have not been hardware-validated.

The optional Electron smoke test also requires Playwright on Node's module path. Its geometric fixtures test rendering, transparency, time-based animation, pause, drag, scaling and event delivery; they do **not** certify art quality. Set `TEST_DPR=1.25` or `2` to exercise display scaling.

The Windows ZIP is unsigned; review its source and verify its SHA-256 checksum before running. macOS/Linux currently have source/build instructions only and no hardware acceptance claim. Transparent windows, tray integration and positioning can vary by Linux compositor; Wayland behavior is not guaranteed. A source-launched macOS/Linux build needs `node` available to Codex's hook process.

Tag-based GitHub Actions releases are gated on both reviewed HD assets. No executable is committed to Git history. The render process is sandboxed and isolated, has no Node integration, and cannot navigate to remote pages.
