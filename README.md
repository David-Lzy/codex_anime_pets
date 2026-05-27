# Codex Anime Pets

[English](README.md) | [中文](README.zh-CN.md)

A searchable collection of Codex desktop pets. Each pet is stored as a self-contained folder under `pets/<pet-id>/`, with install files, preview media, QA metadata, and the saved creation prompt.

Currently included:

- [Assistant-004](pets/assistant-004/README.md) - original chibi AI lab assistant, skeptical coding partner, retro sci-fi researcher.

![Assistant-004 contact sheet](pets/assistant-004/assets/contact-sheet.png)

## AI Search Catalog

For AI agents, scripts, and search tools:

- [`catalog.json`](catalog.json) - machine-readable pet registry
- [`PETS.md`](PETS.md) - human-readable pet list
- [`indexes/ai-search-index.json`](indexes/ai-search-index.json) - flattened retrieval index
- [`indexes/tags.json`](indexes/tags.json) - tag-to-pet lookup table
- [`schemas/catalog.schema.json`](schemas/catalog.schema.json) - lightweight schema for future entries
- [`manifest.json`](manifest.json) - package file hashes

Suggested AI search query examples:

```text
Find a Codex pet that feels like a skeptical AI lab assistant.
Find a chibi coding partner pet with retro sci-fi research vibes.
Find a desktop pet for AI engineers, code review, debugging, and model training.
```

## Quick Install

Default installs `assistant-004`.

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

### Universal Python Installer

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

## Manual Install

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

## Repository Layout

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

## Adding More Pets

To add another pet later:

1. Create `pets/<new-pet-id>/`.
2. Add `pet.json` and `spritesheet.webp`.
3. Add preview media and prompt files if available.
4. Add a new entry to `catalog.json`.
5. Add a short listing to `PETS.md`.
6. Regenerate `manifest.json`.

## License

This package uses the `MIT` license for easy sharing, modification, and reuse. If you want stricter asset terms later, a common option is: code and metadata under MIT, pet artwork under CC BY 4.0.

## GitHub Sharing

This repository is ready to clone, install, and extend:

```sh
git clone git@github.com:David-Lzy/codex_anime_pets.git
cd codex_anime_pets
python scripts/install.py --list
python scripts/install.py --pet assistant-004
```

