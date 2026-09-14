# March 7th

[English collection guide](../../README.md) | [中文合集说明](../../README.zh-CN.md)

Fan-made Codex desktop pet of March 7th: pink-haired, cheerful, camera-carrying chibi adventurer with icy star accents.

三月七 fan-made Codex 桌面宠物：粉发、开朗、相机随身、带冰晶与星旅气质的 chibi 冒险者。

| Idle | Working | Greeting | Jump |
| --- | --- | --- | --- |
| ![idle](assets/previews/idle.gif) | ![running](assets/previews/running.gif) | ![waving](assets/previews/waving.gif) | ![jumping](assets/previews/jumping.gif) |

## Install / 安装

From the repository or extracted install-bundle root / 在仓库或解压后的安装包根目录运行：

```sh
python scripts/install.py --pet march-7th-001
```

Windows without Python / Windows 无需 Python：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 -PetId march-7th-001
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

The signature fan-art outfit is retained in every state. / 所有动作保留角色同人服装。

## Rights / 权利说明

March 7th and Honkai: Star Rail are associated with HoYoverse/miHoYo. This pet is an unofficial fan-made asset and is not endorsed by or affiliated with HoYoverse/miHoYo.

Unofficial fan art for non-commercial personal desktop use. Underlying character and franchise rights are not granted by the code's MIT license. / 非官方同人，仅供非商业个人桌面使用；代码 MIT 协议不授予角色和作品权利。 See [NOTICE](../../NOTICE.md).
