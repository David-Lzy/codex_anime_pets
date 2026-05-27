#!/usr/bin/env python3
"""Install Assistant-004 into the local Codex pets directory."""

from __future__ import annotations

import argparse
import json
import os
import shutil
from pathlib import Path

PET_ID = "assistant-004"


def default_codex_home() -> Path:
    env_value = os.environ.get("CODEX_HOME")
    if env_value:
        return Path(env_value).expanduser()
    return Path.home() / ".codex"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--codex-home",
        type=Path,
        default=default_codex_home(),
        help="Override the Codex home directory. Defaults to CODEX_HOME or ~/.codex.",
    )
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    source_dir = root / "pet" / PET_ID
    target_dir = args.codex_home.expanduser() / "pets" / PET_ID

    pet_json = source_dir / "pet.json"
    spritesheet = source_dir / "spritesheet.webp"
    if not pet_json.is_file() or not spritesheet.is_file():
        raise SystemExit(f"Missing pet files in {source_dir}")

    target_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(pet_json, target_dir / "pet.json")
    shutil.copy2(spritesheet, target_dir / "spritesheet.webp")

    metadata = json.loads((target_dir / "pet.json").read_text(encoding="utf-8"))
    print(f"Installed {metadata.get('displayName', PET_ID)}")
    print(f"Target: {target_dir}")
    print("Restart Codex or refresh the pet picker if the pet does not appear immediately.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

