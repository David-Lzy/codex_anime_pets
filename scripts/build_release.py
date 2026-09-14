#!/usr/bin/env python3
"""Create a portable collection ZIP from public files, with deterministic text bytes."""
from __future__ import annotations

import argparse
import hashlib
import json
import subprocess
import zipfile
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEXT = {".md", ".json", ".py", ".sh", ".ps1", ".bat", ".cjs", ".js", ".css", ".html", ".yaml", ".yml"}
ROOT_FILES = {".gitattributes", ".gitignore", "LICENSE", "NOTICE.md", "PETS.md", "README.md", "README.zh-CN.md", "catalog.json"}


def public_files():
    files = subprocess.check_output(["git", "ls-files", "--cached", "--others", "--exclude-standard", "-z"], cwd=ROOT).decode("utf-8").split("\0")
    for name in sorted(set(files)):
        if not name or name == "manifest.json":
            continue
        file = ROOT / name
        if not file.is_file():
            continue
        parts = Path(name).parts
        if name in ROOT_FILES or parts[0] in {"pets", "scripts", "indexes", "schemas", "art", ".github"} or (
            parts[0] == "desktop" and "node_modules" not in parts and "dist" not in parts):
            if file.suffix in {".bak", ".log", ".tmp"} or "__pycache__" in parts:
                continue
            if not file.resolve().is_relative_to(ROOT.resolve()):
                raise ValueError(f"Redirected release file: {name}")
            yield name, file


def canonical(file: Path) -> bytes:
    data = file.read_bytes()
    if file.suffix in TEXT or file.name in {".gitattributes", ".gitignore", "LICENSE"}:
        data = data.replace(b"\r\n", b"\n")
        if file.suffix in {".ps1", ".bat"}:
            data = data.replace(b"\n", b"\r\n")
    return data


def validate(require_hd=False):
    from PIL import Image
    catalog = json.loads((ROOT / "catalog.json").read_text(encoding="utf-8"))
    ready = {p["id"]: p for p in catalog["pets"] if p.get("status") == "ready"}
    for pet in ready.values():
        file = ROOT / pet["files"]["pet_json"]
        meta = json.loads(file.read_text(encoding="utf-8"))
        version = meta.get("spriteVersionNumber", 1)
        if version not in (1, 2):
            raise ValueError(f"Unsupported pet version: {pet['id']}")
        with Image.open(ROOT / pet["files"]["spritesheet"]) as image:
            if image.size != (1536, 1872 if version == 1 else 2288) or image.mode != "RGBA" or image.getchannel("A").getextrema() != (0, 255):
                raise ValueError(f"Invalid atlas: {pet['id']}")
    if require_hd:
        for id in ("assistant-004", "assistant-004-anime"):
            if id not in ready:
                raise ValueError(f"Not ready for release: {id}")
            pet = ROOT / "pets" / id
            spec = json.loads((pet / "source/frames.json").read_text(encoding="utf-8"))
            if spec.get("reviewed") is not True:
                raise ValueError(f"Visual acceptance missing: {id}")
            data = json.loads((pet / "hd/animation.json").read_text(encoding="utf-8"))
            if (data["cellWidth"], data["cellHeight"]) != (768, 832):
                raise ValueError("Wrong HD cell size")
            for clip in data["clips"].values():
                with Image.open(pet / "hd" / clip["file"]) as image:
                    if image.width != 768 * clip["columns"] or image.mode != "RGBA":
                        raise ValueError(f"Invalid HD clip: {clip['file']}")


def build(output: Path, require_hd: bool):
    validate(require_hd)
    output.mkdir(parents=True, exist_ok=True)
    files = list(public_files())
    manifest = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    manifest.update({"manifest_self_hash": "excluded", "updated": datetime.now(timezone.utc).date().isoformat(),
                     "text_bytes": "Git checkout line endings: CRLF for .ps1/.bat, LF for other text", "files": []})
    archive = output / "Codex-Anime-Pets.zip"
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED, compresslevel=6) as zip:
        for name, file in files:
            data = canonical(file)
            manifest["files"].append({"path": name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})
            info = zipfile.ZipInfo(name, (1980, 1, 1, 0, 0, 0))
            info.external_attr = (0o100755 if name.endswith(".sh") else 0o100644) << 16
            info.compress_type = zipfile.ZIP_DEFLATED
            zip.writestr(info, data)
        data = (json.dumps(manifest, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
        (ROOT / "manifest.json").write_bytes(data)
        info = zipfile.ZipInfo("manifest.json", (1980, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        zip.writestr(info, data)
    digest = hashlib.sha256(archive.read_bytes()).hexdigest()
    (output / "SHA256SUMS.txt").write_text(f"{digest}  {archive.name}\n", encoding="ascii")
    return archive


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "build/releases")
    parser.add_argument("--require-hd", action="store_true")
    parser.add_argument("--check", action="store_true", help="Validate assets without writing a package")
    args = parser.parse_args()
    try:
        if args.check:
            validate(args.require_hd)
            print("Asset checks passed")
        else:
            print(build(args.output.resolve(), args.require_hd))
    except (ValueError, FileNotFoundError, KeyError) as error:
        parser.exit(2, f"Release validation failed: {error}\n")
