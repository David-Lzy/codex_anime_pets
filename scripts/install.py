#!/usr/bin/env python3
"""Install one or more pets from this Codex pet collection."""

from __future__ import annotations

import argparse
import json
import os
import shutil
from pathlib import Path

DEFAULT_PET_ID = "assistant-004"


def default_codex_home() -> Path:
    env_value = os.environ.get("CODEX_HOME")
    if env_value:
        return Path(env_value).expanduser()
    return Path.home() / ".codex"


def load_catalog(root: Path) -> dict:
    catalog_path = root / "catalog.json"
    if not catalog_path.is_file():
        raise SystemExit(f"Missing catalog.json at {catalog_path}")
    return json.loads(catalog_path.read_text(encoding="utf-8"))


def catalog_pets(catalog: dict) -> dict[str, dict]:
    return {pet["id"]: pet for pet in catalog.get("pets", [])}


def list_pets(pets: dict[str, dict]) -> None:
    for pet_id in sorted(pets):
        pet = pets[pet_id]
        description = pet.get("short_description", "")
        print(f"{pet_id}\t{pet.get('display_name', pet_id)}\t{description}")


def install_pet(root: Path, codex_home: Path, pet: dict) -> Path:
    pet_id = pet["id"]
    files = pet.get("files", {})
    pet_json_rel = files.get("pet_json", f"pets/{pet_id}/pet.json")
    spritesheet_rel = files.get("spritesheet", f"pets/{pet_id}/spritesheet.webp")

    pet_json = root / pet_json_rel
    spritesheet = root / spritesheet_rel
    if not pet_json.is_file():
        raise SystemExit(f"Missing pet.json for {pet_id}: {pet_json}")
    if not spritesheet.is_file():
        raise SystemExit(f"Missing spritesheet for {pet_id}: {spritesheet}")

    target_dir = codex_home.expanduser() / "pets" / pet_id
    target_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy2(pet_json, target_dir / "pet.json")
    shutil.copy2(spritesheet, target_dir / "spritesheet.webp")
    return target_dir


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--codex-home",
        type=Path,
        default=default_codex_home(),
        help="Override the Codex home directory. Defaults to CODEX_HOME or ~/.codex.",
    )
    parser.add_argument(
        "--pet",
        default=DEFAULT_PET_ID,
        help=f"Pet id to install. Defaults to {DEFAULT_PET_ID}.",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Install all ready pets in catalog.json.",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List available pets and exit.",
    )
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[1]
    catalog = load_catalog(root)
    pets = catalog_pets(catalog)
    if not pets:
        raise SystemExit("No pets found in catalog.json")

    if args.list:
        list_pets(pets)
        return 0

    selected = list(pets.values()) if args.all else [pets.get(args.pet)]
    if selected == [None]:
        available = ", ".join(sorted(pets))
        raise SystemExit(f"Unknown pet id: {args.pet}. Available pets: {available}")

    for pet in selected:
        if pet.get("status") != "ready":
            print(f"Skipping {pet['id']} because status is {pet.get('status')!r}")
            continue
        target_dir = install_pet(root, args.codex_home, pet)
        print(f"Installed {pet.get('display_name', pet['id'])}")
        print(f"Target: {target_dir}")

    print("Restart Codex or refresh the pet picker if the pet does not appear immediately.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

