# Codex Pet Collection / Codex 桌面宠物合集

This repository is a shareable collection of Codex desktop pets. Each pet is stored as a self-contained folder under `pets/<pet-id>/`, with install files, preview media, QA metadata, and the saved creation prompt.

这是一个可分享的 Codex 桌面宠物合集仓库。每个宠物都放在独立的 `pets/<pet-id>/` 目录下，包含安装文件、预览图、QA 元数据和保存的创作题词。

Currently included / 当前包含：

- [Assistant-004](pets/assistant-004/README.md) - original chibi AI lab assistant, skeptical coding partner, retro sci-fi researcher.

![Assistant-004 contact sheet](pets/assistant-004/assets/contact-sheet.png)

## AI Search Catalog / AI 检索目录

For AI agents, scripts, and search tools:

- [`catalog.json`](catalog.json) - machine-readable pet registry
- [`PETS.md`](PETS.md) - bilingual human-readable pet list
- [`indexes/ai-search-index.json`](indexes/ai-search-index.json) - flattened retrieval index
- [`indexes/tags.json`](indexes/tags.json) - tag-to-pet lookup table
- [`schemas/catalog.schema.json`](schemas/catalog.schema.json) - lightweight schema for future entries
- [`manifest.json`](manifest.json) - package file hashes

给 AI、脚本和检索工具使用：

- [`catalog.json`](catalog.json) - 机器可读宠物注册表
- [`PETS.md`](PETS.md) - 中英双语宠物列表
- [`indexes/ai-search-index.json`](indexes/ai-search-index.json) - 扁平化 AI 检索索引
- [`indexes/tags.json`](indexes/tags.json) - 标签到宠物的查找表
- [`schemas/catalog.schema.json`](schemas/catalog.schema.json) - 后续条目的轻量 schema
- [`manifest.json`](manifest.json) - 包文件哈希清单

Suggested AI search query examples:

```text
Find a Codex pet that feels like a skeptical AI lab assistant.
Find a chibi coding partner pet with retro sci-fi research vibes.
找一个理性、吐槽感、实验室助理风格的 Codex 宠物。
找一个适合 AI 工程师的 chibi 研究员桌面宠物。
```

## Quick Install / 快速安装

Default installs `assistant-004`.

默认安装 `assistant-004`。

### Windows

Double-click:

```text
scripts\install.bat
```

Or run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

Install a specific pet:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 -PetId assistant-004
```

List available pets:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1 -List
```

### macOS / Linux

```sh
chmod +x scripts/install.sh
./scripts/install.sh
```

Install a specific pet:

```sh
./scripts/install.sh --pet assistant-004
```

List available pets:

```sh
./scripts/install.sh --list
```

### Universal Python Installer / 通用 Python 安装器

```sh
python scripts/install.py
```

Install a specific pet:

```sh
python scripts/install.py --pet assistant-004
```

Install all pets:

```sh
python scripts/install.py --all
```

List pets:

```sh
python scripts/install.py --list
```

The installer copies each selected pet's `pet.json` and `spritesheet.webp` to:

```text
~/.codex/pets/<pet-id>/
```

If `CODEX_HOME` is set, the installer uses:

```text
$CODEX_HOME/pets/<pet-id>/
```

安装脚本会把所选宠物的 `pet.json` 和 `spritesheet.webp` 复制到当前用户的 Codex 宠物目录。如果设置了 `CODEX_HOME`，则优先安装到该目录下。

## Manual Install / 手动安装

Copy:

```text
pets/assistant-004/pet.json
pets/assistant-004/spritesheet.webp
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

## Repository Layout / 仓库结构

```text
catalog.json
PETS.md
indexes/
  ai-search-index.json
  tags.json
manifest.json
schemas/catalog.schema.json
scripts/
  install.bat
  install.ps1
  install.py
  install.sh
pets/
  assistant-004/
    README.md
    pet.json
    spritesheet.webp
    creation-prompt.md
    assets/
      contact-sheet.png
      previews/*.gif
      validation.json
      review.json
```

## Adding More Pets / 添加更多宠物

To add another pet later:

1. Create `pets/<new-pet-id>/`.
2. Add `pet.json` and `spritesheet.webp`.
3. Add preview media and prompt files if available.
4. Add a new entry to `catalog.json`.
5. Add a short bilingual listing to `PETS.md`.
6. Regenerate `manifest.json`.

以后添加新宠物时：

1. 创建 `pets/<new-pet-id>/`。
2. 放入 `pet.json` 和 `spritesheet.webp`。
3. 如果有预览和题词，也一起放入。
4. 在 `catalog.json` 中新增条目。
5. 在 `PETS.md` 中加入中英双语简介。
6. 重新生成 `manifest.json`。

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
