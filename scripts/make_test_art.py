"""Generate geometric engine-test fixtures, never pet artwork or release inputs."""
import json
from pathlib import Path

from PIL import Image, ImageDraw
from build_pet import STATES, COUNTS, DURATIONS, REMASTER_IDS, dump

ROOT = Path(__file__).resolve().parents[1] / "build" / "engine-test" / "pets"
for pet in REMASTER_IDS:
    folder = ROOT / pet / "hd"
    folder.mkdir(parents=True, exist_ok=True)
    animation = {"cellWidth": 768, "cellHeight": 832, "displayName": f"TEST FIXTURE {pet}", "clips": {}}
    for state, count, durations in zip(STATES + ["look"], COUNTS + [16], DURATIONS + [[200] * 16]):
        atlas = Image.new("RGBA", (768 * 4, 832 * ((count + 3) // 4)))
        draw = ImageDraw.Draw(atlas)
        for i in range(count):
            x, y = (i % 4) * 768, (i // 4) * 832
            draw.rectangle((x + 230 + i * 3, y + 100, x + 520, y + 800), fill=(40 + i * 11, 110, 180, 255))
        atlas.save(folder / f"{state}.webp", lossless=True)
        animation["clips"][state] = {"file": f"{state}.webp", "columns": 4, "durations": durations}
    dump(folder / "animation.json", animation)
    Image.new("RGBA", (32, 32), "#289db4").save(folder / "tray.png")
print(ROOT)
