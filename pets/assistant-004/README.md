# Assistant-004

[English collection guide](../../README.md) | [中文合集说明](../../README.zh-CN.md)

Original 3.5-head research assistant with chestnut hair, skeptical eyes, casual jacket and state-dependent lab coat. Codex v2/v1 and HD desktop animation.

原创约3.5头身研究助理，栗色长发、冷静眼神，按动作切换日常短外套与白大褂。支持 Codex v2/v1 和独立高清桌宠。

| Idle | Working | Greeting | Jump |
| --- | --- | --- | --- |
| ![idle](assets/previews/idle.gif) | ![running](assets/previews/running.gif) | ![waving](assets/previews/waving.gif) | ![jumping](assets/previews/jumping.gif) |

## Install / 安装

From the repository or extracted install-bundle root / 在仓库或解压后的安装包根目录运行：

```sh
python scripts/install.py --pet assistant-004
```

Windows without Python / Windows 无需 Python：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 -PetId assistant-004
```

Older client: add `--legacy` or PowerShell `-Legacy`. Existing files are backed up. / 旧客户端加兼容参数，已有文件先备份。

## Assets / 素材

- `pet.json`, `spritesheet.webp`: v2, 1536x2288, 8x11 cells, 192x208 per cell.
- `compat/v1/`: v1, 1536x1872; the same nine remastered action rows.
- `hd/`: independent desktop clips, true RGBA, 768x832 frames, real-time frame durations.
- `source/pairs/`: native green-screen pose drawings and exact `*.prompt.json` generation records. Available in the full GitHub source, omitted from the lightweight install bundle.
- `source/frames.json`: shared-canvas registration; PNG intermediates regenerate with `scripts/register_art.py`.
- [Contact sheet](assets/contact-sheet.png), [validation](assets/validation.json), [review record](assets/review.json), [creation brief](creation-prompt.md).

Nine action rows plus 16 clockwise idle directions. 73 used frames including eight mirrored left-movement frames. No frame-by-frame bounding-box enlargement. / 九种动作与16个顺时针朝向，共73个使用帧，其中8个左移帧来自右移镜像；不逐帧裁切拉伸。

Working, review, waiting and frustrated states use the lab coat; all others use the casual jacket. / 工作、审阅、等待、挫败穿白大褂，其余动作穿日常短外套。

## Rights / 权利说明

Original Assistant-004 design, not a one-to-one reproduction of a named franchise character.

原创 Assistant-004 设计，不是一比一复刻已有系列角色。 See [NOTICE](../../NOTICE.md).
