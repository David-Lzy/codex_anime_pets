# Assistant-004 Codex Pet / Codex 桌面宠物

Assistant-004 is an original, copyright-safe Codex desktop pet: a tiny chibi AI research assistant with chestnut hair, sharp blue-violet eyes, a white lab jacket, and a skeptical lab-partner personality.

Assistant-004 是一个原创、版权安全的 Codex 桌面宠物：一位小小的 chibi AI 研究助理，栗色长发、蓝紫色眼睛、白色实验外套，性格理性、精准、略带吐槽感。

![Assistant-004 contact sheet](assets/contact-sheet.png)

## Quick Install / 快速安装

### Windows

Double-click:

```text
scripts\install.bat
```

Or run in PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

### macOS / Linux

```sh
chmod +x scripts/install.sh
./scripts/install.sh
```

### Universal Python Installer / 通用 Python 安装器

Works on Windows, macOS, and Linux with Python 3:

```sh
python scripts/install.py
```

If your system uses `python3`:

```sh
python3 scripts/install.py
```

The installer copies:

```text
pet/assistant-004/pet.json
pet/assistant-004/spritesheet.webp
```

to:

```text
~/.codex/pets/assistant-004/
```

If `CODEX_HOME` is set, the installer uses:

```text
$CODEX_HOME/pets/assistant-004/
```

安装脚本会把宠物文件复制到当前用户的 Codex 宠物目录。如果设置了 `CODEX_HOME`，则优先安装到该目录下。

## Manual Install / 手动安装

Copy this folder:

```text
pet/assistant-004/
```

to:

```text
~/.codex/pets/assistant-004/
```

Expected final layout:

```text
.codex/
  pets/
    assistant-004/
      pet.json
      spritesheet.webp
```

手动安装时，只需要复制 `pet/assistant-004/` 这个目录，确保目标目录里有 `pet.json` 和 `spritesheet.webp` 两个文件。

## Included Files / 包含文件

- `pet/assistant-004/pet.json` - Codex pet metadata / Codex 宠物元数据
- `pet/assistant-004/spritesheet.webp` - final animated sprite atlas / 最终动画精灵图
- `assets/contact-sheet.png` - visual QA contact sheet / 视觉 QA 总览图
- `assets/previews/*.gif` - per-state animation previews / 各状态动画预览
- `assets/validation.json` - atlas validation result / 图集验证结果
- `assets/review.json` - frame inspection result / 帧检查结果
- `prompts/assistant-004-creation-prompt.md` - saved creation prompt / 保存的创作题词
- `scripts/install.*` - one-command installers / 一键安装脚本

## Animation States / 动画状态

Assistant-004 follows the Codex pet atlas contract:

| Row | State | Frames | Meaning |
| --- | --- | ---: | --- |
| 0 | idle | 6 | quiet breathing and blink |
| 1 | running-right | 8 | rightward drag movement |
| 2 | running-left | 8 | leftward drag movement |
| 3 | waving | 4 | restrained greeting |
| 4 | jumping | 5 | small controlled hop |
| 5 | failed | 8 | annoyed but composed failure reaction |
| 6 | waiting | 6 | arms-crossed waiting for user input |
| 7 | running | 6 | focused processing / task work |
| 8 | review | 6 | sharp inspection / code review mood |

## QA Summary / 验证摘要

- Atlas size: `1536x1872`
- Cell size: `192x208`
- Format: `WEBP`, `RGBA`
- Transparent RGB residue pixels: `0`
- Frame inspection: no errors, no warnings

## License / 许可

This package includes a permissive `MIT` license for easy sharing. Adjust `LICENSE` before publishing if you want stricter terms.

本包附带宽松的 `MIT` 许可，方便分享和二次使用。如果公开发布前希望采用更严格的条款，可以先修改 `LICENSE`。

## GitHub Sharing / GitHub 分享

This folder can be committed directly to a GitHub repository. SSH authentication on the creator machine was confirmed with GitHub, but a specific remote repository URL is still needed before pushing.

这个文件夹可以直接作为 GitHub 仓库提交。当前机器已确认可以通过 SSH 认证到 GitHub；如果要推送到指定仓库，还需要填入具体的仓库 SSH 地址。

Example:

```sh
git remote add origin git@github.com:YOUR_NAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Notes / 说明

Assistant-004 is an original anime-inspired chibi assistant. It does not copy any named anime, game, or visual novel character, and it contains no readable franchise marks, logos, or text.

Assistant-004 是原创 anime-inspired chibi 助理形象，不复刻任何具名动漫、游戏或视觉小说角色，也不包含可读的品牌标识、logo 或文字。
