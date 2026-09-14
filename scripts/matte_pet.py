#!/usr/bin/env python3
"""Key approved green-screen pose pairs, without scaling individual subjects."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt


def key_green(image: Image.Image) -> Image.Image:
    rgb = np.asarray(image.convert("RGB"), dtype=np.float32) / 255
    green = rgb[:, :, 1] - np.maximum(rgb[:, :, 0], rgb[:, :, 2])
    screen = green > .75
    if not np.any(screen):
        raise ValueError("No dominant chroma green background found")
    # Generated backgrounds have slight color noise; estimate the screen, not the subject.
    strength = float(np.percentile(green[screen], 1))
    background = np.median(rgb[screen], axis=0)
    alpha = np.clip(1 - green / strength, 0, 1)
    alpha[screen] = 0
    alpha[alpha < 0.025] = 0
    foreground = rgb - (1 - alpha[:, :, None]) * background
    foreground = np.clip(foreground / np.maximum(alpha[:, :, None], 1e-6), 0, 1)
    opaque = green <= 0
    if np.any(opaque):
        distance, nearest = distance_transform_edt(~opaque, return_indices=True)
        color = rgb[nearest[0], nearest[1]]
        direction = color - background
        recovered = np.clip(np.sum((rgb - background) * direction, axis=2) /
                            np.maximum(np.sum(direction * direction, axis=2), 1e-6), 0, 1)
        residual = np.max(np.abs(background + recovered[:, :, None] * direction - rgb), axis=2)
        edge = (alpha > 0) & (alpha < .98) & (distance <= 4) & (residual < .08)
        # Recover edge coverage using nearby solid ink, avoiding yellow fringes around brown hair.
        foreground[edge] = color[edge]
        alpha[edge] = recovered[edge]
        alpha[alpha < .025] = 0
    foreground[alpha == 0] = 0
    return Image.fromarray(np.rint(np.dstack((foreground, alpha)) * 255).astype(np.uint8))


def split_pair(source: Path, output: Path, split: int | None = None) -> dict:
    with Image.open(source) as image:
        if not 832 <= image.height <= 1344 or image.width > 1536:
            raise ValueError("Regenerate on the shared canvas: height 832..1344, width <=1536")
        keyed = key_green(image)
    alpha = np.asarray(keyed.getchannel("A"))
    if any(np.any(edge > 32) for edge in (alpha[:2], alpha[-2:], alpha[:, :2], alpha[:, -2:])):
        raise ValueError("Source figure touches the image edge; regenerate with complete shoes, hair and wings")
    lo, hi = round(keyed.width * .4), round(keyed.width * .6)
    if split is None:
        # Find a continuous empty path between figures; shoes and hair may cross the midpoint.
        cost = (alpha[:, lo:hi] > 0).astype(float) * 1e6
        cost += np.abs(np.arange(lo, hi) - keyed.width / 2) / keyed.width
        back = np.zeros(cost.shape, dtype=np.int8)
        for y in range(1, keyed.height):
            previous = np.pad(cost[y - 1], 1, constant_values=np.inf)
            neighbors = np.stack((previous[:-2], previous[1:-1], previous[2:]))
            choice = neighbors.argmin(axis=0)
            back[y] = choice - 1
            cost[y] += neighbors[choice, np.arange(hi - lo)]
        x = int(cost[-1].argmin())
        if cost[-1, x] >= 1e6:
            raise ValueError("Figures overlap; regenerate separated drawings")
        boundary = np.empty(keyed.height, dtype=int)
        for y in range(keyed.height - 1, -1, -1):
            boundary[y] = x + lo
            x += int(back[y, x])
    else:
        if not lo <= split <= hi or np.any(alpha[:, split]):
            raise ValueError("Requested split cuts a figure")
        boundary = np.full(keyed.height, split)
    left_edge, right_edge = int(boundary.min()), int(boundary.max())
    width = max(768, right_edge, keyed.width - left_edge)
    output.parent.mkdir(parents=True, exist_ok=True)
    report = {"source": source.name, "native_size": keyed.size, "split_range": [left_edge, right_edge],
              "source_canvas": [width, 1536], "padding_top": 128, "scale": 1, "frames": []}
    pixels = np.asarray(keyed).copy()
    left_mask = np.arange(keyed.width)[None, :] < boundary[:, None]
    for index, (left, right) in enumerate(((0, right_edge), (left_edge, keyed.width))):
        selected = pixels.copy()
        selected[~left_mask if index == 0 else left_mask] = 0
        cell = Image.fromarray(selected).crop((left, 0, right, keyed.height))
        frame = Image.new("RGBA", (width, 1536))
        frame.alpha_composite(cell, ((width - cell.width) // 2, 128))
        box = frame.getchannel("A").getbbox()
        if not box or box[3] - box[1] < 650:
            raise ValueError("Figure lacks native detail; regenerate at a larger scale")
        file = output.with_name(f"{output.name}-{index}.png")
        frame.save(file)
        report["frames"].append({"file": file.name, "bounds": box})
    output.with_suffix(".json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path, help="Output filename prefix, without extension")
    parser.add_argument("--split", type=int)
    args = parser.parse_args()
    print(json.dumps(split_pair(args.source, args.output, args.split), indent=2))
