#!/usr/bin/env python3
"""Pack reviewed full-canvas RGBA frames. Never resize individual character bounds."""
from __future__ import annotations

import argparse
import hashlib
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw

STATES = ["idle", "running-right", "running-left", "waving", "jumping", "failed", "waiting", "running", "review"]
COUNTS = [6, 8, 8, 4, 5, 8, 6, 6, 6]
DURATIONS = [[280, 110, 110, 140, 140, 320], [120] * 7 + [220], [120] * 7 + [220],
             [140] * 3 + [280], [140] * 4 + [280], [140] * 7 + [240], [150] * 5 + [260],
             [120] * 5 + [220], [150] * 5 + [280]]
CELL = (768, 832)


def dump(file: Path, data: dict) -> None:
    file.parent.mkdir(parents=True, exist_ok=True)
    file.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def resize_rgba(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return image.convert("RGBa").resize(size, Image.Resampling.LANCZOS).convert("RGBA")


def load_frame(root: Path, entry: dict, source_size: tuple[int, int]) -> Image.Image:
    file = (root / entry["file"]).resolve()
    if not file.is_relative_to(root.resolve()):
        raise ValueError("Source frame escapes pet directory")
    with Image.open(file) as source:
        if source.mode != "RGBA" or source.getchannel("A").getextrema() != (0, 255):
            raise ValueError(f"Real RGBA transparency required: {file.name}")
        if source.size != source_size or source.width < CELL[0] or source.height < CELL[1]:
            raise ValueError(f"Native resolution/shared source canvas mismatch: {file.name}")
        scale = min(CELL[0] / source.width, CELL[1] / source.height)
        size = (round(source.width * scale), round(source.height * scale))
        frame = Image.new("RGBA", CELL)
        dx, dy = entry.get("offset", [0, 0])
        if not all(isinstance(v, int) and abs(v) <= 160 for v in (dx, dy)):
            raise ValueError("Invalid registration translation")
        frame.alpha_composite(resize_rgba(source, size), ((CELL[0] - size[0]) // 2 + dx, (CELL[1] - size[1]) // 2 + dy))
    bbox = frame.getchannel("A").getbbox()
    if bbox is None or bbox[0] < 2 or bbox[1] < 2 or bbox[2] > CELL[0] - 2 or bbox[3] > CELL[1] - 2:
        raise ValueError(f"Empty or clipped frame: {file.name}")
    return frame


def build(root: Path) -> dict:
    spec = json.loads((root / "source" / "frames.json").read_text(encoding="utf-8"))
    if spec.get("reviewed") is not True:
        raise ValueError("Art must pass visual review before release")
    source_size = tuple(spec["source_canvas"])
    if len(source_size) != 2:
        raise ValueError("source_canvas must contain width and height")
    rows = {}
    for state, count in zip(STATES + ["look"], COUNTS + [16]):
        entries = spec["frames"][state]
        if len(entries) != count:
            raise ValueError(f"{state} requires exactly {count} frames")
        frames = [load_frame(root, entry, source_size) for entry in entries]
        unique = len({hashlib.sha256(frame.tobytes()).digest() for frame in frames})
        if unique < (16 if state == "look" else min(3, count)):
            raise ValueError(f"Repeated static frames in {state}")
        rows[state] = frames
    # All inputs are checked before touching the installed-format output files.
    hd = root / "hd"
    hd.mkdir(parents=True, exist_ok=True)
    atlas = Image.new("RGBA", (1536, 2288))
    animation = {"id": spec["id"], "displayName": spec["display_name"], "cellWidth": 768, "cellHeight": 832, "clips": {}}
    report = {"schema_version": 2, "source_canvas": source_size, "output_cell": CELL, "per_frame_bbox_scaling": False, "states": {}}
    previews = root / "assets" / "previews"
    previews.mkdir(parents=True, exist_ok=True)
    for row, (state, frames) in enumerate(rows.items()):
        durations = DURATIONS[row] if row < 9 else [200] * 16
        strip = Image.new("RGBA", (CELL[0] * 4, CELL[1] * math.ceil(len(frames) / 4)))
        smalls = []
        for i, frame in enumerate(frames):
            strip.alpha_composite(frame, ((i % 4) * CELL[0], (i // 4) * CELL[1]))
            small = resize_rgba(frame, (192, 208))
            atlas.alpha_composite(small, ((i % 8) * 192, (row + i // 8) * 208))
            smalls.append(small)
        strip.save(hd / f"{state}.webp", lossless=True, method=6)
        animation["clips"][state] = {"file": f"{state}.webp", "columns": 4, "durations": durations,
            "outfit": "lab" if state in {"running", "review", "failed", "waiting"} else "casual"}
        report["states"][state] = {"count": len(frames), "bounds": [frame.getchannel("A").getbbox() for frame in frames]}
        rendered = []
        for small in smalls:
            background = Image.new("RGB", small.size, "#eef0f3")
            background.paste(small, mask=small.getchannel("A"))
            rendered.append(background)
        rendered[0].save(previews / f"{state}.gif", save_all=True, append_images=rendered[1:], duration=durations, loop=0, disposal=2)
    atlas.save(root / "spritesheet.webp", lossless=True, method=6)
    legacy = root / "compat" / "v1"
    legacy.mkdir(parents=True, exist_ok=True)
    atlas.crop((0, 0, 1536, 1872)).save(legacy / "spritesheet.webp", lossless=True, method=6)
    meta = {"id": spec["id"], "displayName": spec["display_name"], "description": spec["description"],
            "spriteVersionNumber": 2, "spritesheetPath": "spritesheet.webp"}
    dump(root / "pet.json", meta)
    dump(legacy / "pet.json", {**meta, "spriteVersionNumber": 1})
    dump(hd / "animation.json", animation)
    dump(root / "assets" / "validation.json", report)
    contact = Image.new("RGB", atlas.size, "#eef0f3")
    contact.paste(atlas, mask=atlas.getchannel("A"))
    contact.save(root / "assets" / "contact-sheet.png")
    frame = rows["idle"][0]
    box = frame.getchannel("A").getbbox()
    face = frame.crop((box[0], box[1], box[2], min(box[3], box[1] + (box[2] - box[0]))))
    face.thumbnail((64, 64), Image.Resampling.LANCZOS)
    icon = Image.new("RGBA", (64, 64))
    icon.alpha_composite(face, ((64 - face.width) // 2, (64 - face.height) // 2))
    icon.save(hd / "tray.png")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pet", type=Path)
    args = parser.parse_args()
    print(json.dumps(build(args.pet.resolve()), indent=2))
