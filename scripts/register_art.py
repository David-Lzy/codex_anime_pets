#!/usr/bin/env python3
"""Register grounded frames by their feet; preserve airborne and crouch displacement."""
import argparse
import json
from pathlib import Path

from PIL import Image, ImageOps
import numpy as np
from build_pet import STATES, COUNTS, dump, load_frame
from matte_pet import split_pair

ROOT = Path(__file__).resolve().parents[1]


def register(pet: Path):
    plan = json.loads((ROOT / "art/animation-prompts.json").read_text(encoding="utf-8"))
    pairs = sorted((pet / "source/pairs").glob("*.png"))
    heights = []
    for pair in pairs:
        with Image.open(pair) as image:
            heights.append(image.height)
    target_height = min(heights)
    reports = []
    for pair in pairs:
        reports.append(split_pair(pair, pet / "source/frames" / pair.stem,
                                  target_height=target_height))
    source_width = max(report["source_canvas"][0] for report in reports)
    for report in reports:
        for entry in report["frames"]:
            file = pet / "source/frames" / entry["file"]
            with Image.open(file) as image:
                if image.width == source_width:
                    continue
                padded = Image.new("RGBA", (source_width, image.height))
                padded.alpha_composite(image, ((source_width - image.width) // 2, 0))
                padded.save(file)
    frames = {}
    baseline = 1380
    scale = 832 / 1536
    with Image.open(pet / "source/frames/idle-00-0.png") as idle:
        idle_box = idle.getchannel("A").getbbox()
        idle_top = idle_box[1] + baseline - idle_box[3]
    target_center = source_width / 2
    walk_center = None
    for state, count in zip(STATES + ["look"], COUNTS + [16]):
        entries = []
        if state == "running-left":
            for i, entry in enumerate(frames["running-right"]):
                source = Image.open(pet / entry["file"])
                target = pet / "source/frames" / f"running-left-{i:02}.png"
                ImageOps.mirror(source).save(target)
                entries.append({"file": target.relative_to(pet).as_posix(), "offset": [-entry["offset"][0], entry["offset"][1]], "mirrored_from": entry["file"]})
        else:
            for i in range(count):
                file = pet / "source/frames" / f"{state}-{i // 2 * 2:02}-{i % 2}.png"
                if not file.exists():
                    raise ValueError(f"Missing generated frame: {file.relative_to(pet)}")
                with Image.open(file) as image:
                    alpha = image.getchannel("A")
                    box = alpha.getbbox()
                    feet = alpha.crop((0, box[3] - 160, image.width, box[3])).getbbox()
                    center = (feet[0] + feet[2]) / 2
                    if state == "running-right":
                        # Foot span changes during a stride; register the head instead of chasing the leading shoe.
                        head = np.asarray(alpha.crop((0, box[1], image.width, box[1] + 240)), dtype=float)
                        head_center = float((head.sum(axis=0) * np.arange(image.width)).sum() / head.sum())
                        if walk_center is None:
                            walk_center = head_center - center + target_center
                        center = head_center - walk_center + target_center
                    dx = round((target_center - center) * scale)
                    dy = round((baseline - box[3]) * scale)
                    if state == "jumping" and i in (1, 2):
                        # Translate drawn takeoff/apex poses on one canvas; never resize crouches or bent legs.
                        dy = round((idle_top - (45 if i == 1 else 110) - box[1]) * scale)
                entries.append({"file": file.relative_to(pet).as_posix(), "offset": [dx, dy]})
        frames[state] = entries
    for state, entries in frames.items():
        if state == "jumping":
            continue
        for entry in entries:
            rendered = load_frame(pet, entry, (source_width, 1536))
            bottom = rendered.getchannel("A").getbbox()[3]
            entry["offset"][1] += 750 - bottom
    old_meta = pet / "pet.json"
    meta = json.loads(old_meta.read_text(encoding="utf-8")) if old_meta.exists() else {}
    spec = {"id": pet.name, "display_name": meta.get("displayName", "Assistant-004 Anime"),
            "description": meta.get("description", "Original anime research assistant with state-dependent outfits."),
            "reviewed": False, "source_canvas": [source_width, 1536], "per_frame_bbox_scaling": False,
            "registration": "Translation only: shared foot baseline, head-registered walk, 45/110 native-pixel takeoff/apex lift. Drawn body proportions and crouch heights retained.",
            "frames": frames}
    viewport = plan["models"].get(pet.name, {}).get("frame_viewport")
    if viewport is not None:
        spec["frame_viewport"] = viewport
    if pet.name.startswith("assistant-004"):
        spec["outfits"] = {state: "lab" if state in plan["lab_states"] else "casual" for state in frames}
    dump(pet / "source/frames.json", spec)
    return spec


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pet", type=Path)
    args = parser.parse_args()
    print(json.dumps(register(args.pet.resolve()), indent=2))
