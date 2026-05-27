# Cirno (009)

Fan-made Codex desktop pet of Cirno: blue-haired, overconfident ice fairy chibi with crystalline wings and playful debugging energy.

琪露诺 fan-made Codex 桌面宠物：蓝发、自信过头的冰之妖精 chibi，带冰晶翅膀和调试时的玩闹气质。

![Cirno (009) contact sheet](assets/contact-sheet.png)

## Install / 安装

From the repository root:

```sh
python scripts/install.py --pet cirno-009
```

Windows PowerShell:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 -PetId cirno-009
```

macOS / Linux:

```sh
./scripts/install.sh --pet cirno-009
```

## Files / 文件

- `pet.json` - Codex pet metadata / Codex 宠物元数据
- `spritesheet.webp` - generated animated sprite atlas / 生成的动画精灵图
- `creation-prompt.md` - saved creation prompt / 保存的生成提示词
- `assets/contact-sheet.png` - visual QA contact sheet / 视觉 QA 总览图
- `assets/previews/*.gif` - per-state previews / 各状态预览

## QA Summary / 验证摘要

- Atlas size: `1536x1872`
- Cell size: `192x208`
- Format: `WEBP`, `RGBA`
- Transparent RGB residue pixels: `0`
- Frame inspection: no errors, no warnings

## Fan Notice / Fan-made 说明

Cirno and Touhou Project are associated with Team Shanghai Alice/ZUN. This pet is an unofficial fan-made asset and is not endorsed by or affiliated with Team Shanghai Alice/ZUN.

该条目是非官方 fan-made 素材，不代表原版权方，也未获得官方背书。
