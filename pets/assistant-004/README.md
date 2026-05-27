# Assistant-004

Assistant-004 is an original, copyright-safe Codex desktop pet: a tiny chibi AI research assistant with chestnut hair, sharp blue-violet eyes, a white lab jacket, and a skeptical lab-partner personality.

Assistant-004 是一个原创、版权安全的 Codex 桌面宠物：一位小小的 chibi AI 研究助理，栗色长发、蓝紫色眼睛、白色实验外套，性格理性、精准、略带吐槽感。

![Assistant-004 contact sheet](assets/contact-sheet.png)

## Install / 安装

From the repository root:

```sh
python scripts/install.py --pet assistant-004
```

Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 -PetId assistant-004
```

macOS / Linux:

```sh
./scripts/install.sh --pet assistant-004
```

## Files / 文件

- `pet.json` - Codex pet metadata / Codex 宠物元数据
- `spritesheet.webp` - final animated sprite atlas / 最终动画精灵图
- `creation-prompt.md` - saved creation prompt / 保存的创作题词
- `assets/contact-sheet.png` - visual QA contact sheet / 视觉 QA 总览图
- `assets/previews/*.gif` - per-state previews / 各状态预览

## QA Summary / 验证摘要

- Atlas size: `1536x1872`
- Cell size: `192x208`
- Format: `WEBP`, `RGBA`
- Transparent RGB residue pixels: `0`
- Frame inspection: no errors, no warnings

