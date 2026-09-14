# Assistant-004 Desktop

**English** | [简体中文](README.zh-CN.md)

An independent transparent Electron/Canvas companion using the four remastered pets. It does not modify Codex. Frames are 768x832 RGBA; playback follows elapsed time and the authored frame durations.

## Windows

Download the unsigned Windows ZIP from [Releases](https://github.com/David-Lzy/codex_anime_pets/releases/latest). Verify SHA-256, extract the **whole** archive, and double-click **Assistant-004 Desktop.exe**. Keep its resources beside the executable. No Python or Node installation is needed for the packaged app.

Drag to move, click to wave, double-click to hop. Right-click or use the tray menu for character, action, sizes (160-640 px), pause, pointer direction, click-through, followed task, position reset or quit. The tray remains usable during click-through. Position is saved and clamped to connected displays on restart. No autostart is enabled.

Both Assistants wear lab coats for working/review/waiting/frustration and casual jackets otherwise. March 7th and Cirno retain signature outfits and their fan-art notices.

## Optional Codex Integration

1. Select **Codex integration** in the tray menu and confirm.
2. The app backs up and merges observer handlers in `$CODEX_HOME/hooks.json` (fallback `~/.codex/hooks.json`), preserving existing handlers.
3. Review and trust the new hooks in Codex when prompted. Unmanaged hooks do not run before trust. Start a new turn after enabling. Workspace policy or client support can prevent hooks from running.
4. The menu distinguishes disabled, unavailable (setup error), awaiting events, connected, and stale/unconfirmed status.

Only event kind, session/turn/call identifiers when available, tool name, timestamp, workspace basename and a structured error flag are sent to a random port bound to **127.0.0.1**, with a random token. Prompts, arguments, full tool output, transcripts and credentials are not transmitted or logged. Remote/server tasks are not connected automatically.

Task submission means working; approval/input requests mean waiting; subsequent observable completion resumes working; Stop/Interrupt returns to idle. A structured tool error triggers brief frustration, not a failed-task verdict. Review is manual. There is no documented approval-completed hook, so approval-resume display can lag until a matching tool result or another observable task event. Background events can arrive late; Hooks are status hints, not a complete execution trace. A silent job is unconfirmed after 30 minutes, not failed.

The default follows the task with the latest accepted event; the menu can pin a task. Hooks run asynchronously, emit no output or decisions, and fail quietly if the app is closed. See [official Codex Hooks documentation](https://learn.chatgpt.com/docs/hooks).

Disabling removes **only this tool's marked handlers**, not other hooks. Backups remain. Disable before deleting or moving the app. Quitting keeps the registration for the next launch. No automatic approval, transcript scraping, remote pages, or remote control is included.

## Build From Source

Requires Node.js 22.12+, pnpm 11.19.0 and the full repository with `pets/*/hd/`:

```sh
cd desktop
pnpm install --frozen-lockfile
pnpm start
pnpm test
pnpm dist:win
```

On macOS/Linux, use `pnpm build:dir` for an unpacked build on that host. **macOS/Linux have not been hardware-validated.** Transparent windows, positioning and tray support vary with the Linux compositor; Wayland behavior is not guaranteed. Their source-launched hook helper needs Node available on Codex's PATH.

## Verification

See the [acceptance record and remaining interactive checks](https://github.com/David-Lzy/codex_anime_pets/blob/main/art/QA.md).
Native click delivery and real Codex trust/approval flows still need an interactive
desktop check; synthetic local events do not certify live task integration.

```sh
python -m unittest discover -s scripts -p 'test_*.py'
node --test desktop/test.cjs
```

The optional `desktop/smoke.cjs` requires Playwright on Node's module path. Set `ASSISTANT004_REAL_ART=1`, `ASSISTANT004_ASSETS` to the absolute `pets` directory, and `ASSISTANT004_REVIEW_ALL=1` to check all real action loops on light/dark backgrounds at Codex and HD sizes. Set `TEST_DPR=1`, `1.25`, or `2` for scaling tests. Without real-art mode, generate geometric fixtures using `scripts/make_test_art.py`; fixtures do not certify artwork.

GitHub Actions gates releases on all four reviewed HD assets and produces the Windows portable ZIP and checksums. Executables are not committed. The renderer has Node integration disabled, context isolation and sandboxing enabled, restricted IPC, and no remote navigation.
