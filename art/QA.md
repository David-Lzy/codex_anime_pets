# Remaster Acceptance

[English README](../README.md) | [Chinese README](../README.zh-CN.md)

## Artwork

Four pets, 33 native pose-pair images each. All nine actions played for two
complete cycles at 208 and 320 pixels on white and dark backgrounds: 144 cases.
Every authored action frame appeared; see [machine results](playback-review.json).
All contact sheets and representative full-size playback screenshots were also
visually inspected. Source-edge clipping is rejected before padding and matting.
Walking uses translated head registration, grounded poses share a foot baseline,
and jumping retains its drawn crouch, takeoff and apex. Leftward movement mirrors
the complete rightward cycle. Individual drawings still have minor variation;
this is authored sprite animation, not a skeletal or interpolated animation rig.

## Windows Desktop

Real artwork passed both source-launched Electron and the packaged Windows EXE
checks at device scale factors 1, 1.25 and 2, using the packaged resources:
nonblank rendering, frame advancement, pointer-event dragging, pause, resizing,
four-character switching and saved-position restoration. Local event submission,
waiting, completion and integration removal were exercised against a temporary
Codex home; existing hook content was preserved. Unit tests cover error,
interruption, task following and rejected loopback requests.

Native `WS_EX_TRANSPARENT` and owned-window hit testing passed. **Physical mouse
injection could not run because this tool session has no input-desktop access.**
The runnable Windows smoke test reports that check as unavailable, not passed.
Run it in an interactive desktop to verify delivery to its owned underlay window.
Actual Codex trust prompts and live task hooks require interactive user acceptance;
the automated tests send the same event contract locally, not a real user task.
macOS/Linux have not been hardware-tested. Windows builds are unsigned.

Ten Python checks and six Node checks passed, including v1/v2 installation,
backups, legacy-only pet regression, matting, atlas geometry, loopback privacy,
hook preservation, state transitions and cancellation of stale image loads.

## Source History

The exact prompts remain beside their corresponding source PNGs. Earlier long-form
Assistant drafts were generated under the `assistant-004` working ID and later
assigned to `assistant-004-anime`; paths and IDs in those exact prompt records
are historical references, not build dependencies. Later corrected pairs use
the final ID. The compact design uses its separate compact reference images.

The first March 7th and Cirno pose pairs used their existing repository contact
sheets as references from commit `d54ee52652bba4a397aae907c9327080ddcad8eb`.
Those historical sheets can be retrieved from Git history; current contact sheets
show the remasters. The user's external reference attachments are not redistributed.
Fan-character rights and existing restrictions remain in [NOTICE](../NOTICE.md).

## 中文摘要

四款宠物共完成 144 组深浅底、大小尺寸的双循环播放检查，覆盖全部动作帧；
保留原生生成图、准确提示词及抠图、统一缩放、位置校准记录。
Windows 的实际素材播放与程序控制测试通过，原生穿透样式和命中检查通过。
当前工具会话不能发送物理鼠标输入，因此真实点击穿透仍需交互桌面复验；
真实 Codex Hooks 信任提示及任务联动需用户启用后验证。未声称 macOS/Linux
已实机测试。旧版素材通过 Git 历史保留，附件参考图不随仓库重新发布。
