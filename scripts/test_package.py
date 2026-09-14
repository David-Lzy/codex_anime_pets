"""Run with python -m unittest discover -s scripts -p 'test_*.py'."""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

from PIL import Image, ImageDraw
from install import install_pet, load_catalog
from build_pet import load_frame, resize_rgba, REMASTER_IDS, STATES, COUNTS
from build_release import install_bundle

ROOT = Path(__file__).resolve().parents[1]


class PackageTests(unittest.TestCase):
    def test_release_art_contract(self):
        for id in REMASTER_IDS:
            pet = ROOT / "pets" / id
            meta = json.loads((pet / "pet.json").read_text(encoding="utf-8"))
            self.assertEqual(meta["spriteVersionNumber"], 2)
            with Image.open(pet / "spritesheet.webp") as atlas:
                self.assertEqual(atlas.size, (1536, 2288))
                self.assertEqual(atlas.getchannel("A").getextrema(), (0, 255))
            with Image.open(pet / "compat/v1/spritesheet.webp") as legacy:
                self.assertEqual(legacy.size, (1536, 1872))
            clips = json.loads((pet / "hd/animation.json").read_text())["clips"]
            report = json.loads((pet / "assets/validation.json").read_text())["states"]
            for state, count in zip(STATES + ["look"], COUNTS + [16]):
                self.assertEqual(len(clips[state]["durations"]), count)
                bounds = report[state]["bounds"]
                if state != "jumping":
                    self.assertLessEqual(max(b[3] for b in bounds) - min(b[3] for b in bounds), 1)
            hop = report["jumping"]["bounds"]
            self.assertLess(hop[2][1], hop[1][1])
            self.assertLess(hop[1][1], hop[0][1])
            self.assertLess(hop[2][3], hop[1][3])
            self.assertLess(hop[1][3], hop[0][3])
        self.assertFalse(install_bundle("pets/assistant-004/hd/idle.webp"))
        self.assertFalse(install_bundle("pets/assistant-004/source/pairs/idle-00.png"))
        self.assertTrue(install_bundle("pets/assistant-004/compat/v1/pet.json"))

    def test_install_all_and_backup(self):
        with tempfile.TemporaryDirectory() as folder:
            home = Path(folder)
            for pet in load_catalog(ROOT)["pets"]:
                if pet.get("status") != "ready":
                    continue
                target = install_pet(ROOT, home, pet)
                self.assertTrue((target / "spritesheet.webp").is_file())
                install_pet(ROOT, home, pet, legacy=True)
                self.assertEqual(json.loads((target / "pet.json").read_text()).get("spriteVersionNumber", 1), 1)
                old_pet = {**pet, "files": pet["files"]["legacy"]}
                for legacy in (False, True):
                    install_pet(ROOT, home, old_pet, legacy=legacy)
                    self.assertEqual(json.loads((target / "pet.json").read_text()).get("spriteVersionNumber", 1), 1)
            self.assertTrue(any((home / "pets" / ".backups").iterdir()))

    def test_path_escape_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            for pet in [{"id": "../bad"}, {"id": "safe", "files": {"pet_json": "../secret", "spritesheet": "../secret"}}]:
                with self.assertRaises(SystemExit):
                    install_pet(ROOT, Path(folder), pet)

    def test_shared_canvas_preserves_hop_and_crouch(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            boxes = [(250, 250, 500, 800), (250, 100, 500, 650), (250, 400, 500, 800)]
            frames = []
            for index, box in enumerate(boxes):
                im = Image.new("RGBA", (768, 832))
                ImageDraw.Draw(im).rectangle(box, fill="#844235")
                file = root / f"{index}.png"
                im.save(file)
                frames.append(load_frame(root, {"file": file.name}, (768, 832)))
            bounds = [im.getchannel("A").getbbox() for im in frames]
            self.assertEqual(bounds[0][3] - bounds[1][3], 150)
            self.assertNotEqual(bounds[0][3] - bounds[0][1], bounds[2][3] - bounds[2][1])
            im.convert("RGB").save(root / "fake.png")
            with self.assertRaisesRegex(ValueError, "RGBA"):
                load_frame(root, {"file": "fake.png"}, (768, 832))
            with self.assertRaises(ValueError):
                load_frame(root, {"file": "0.png"}, (384, 416))
            self.assertEqual(resize_rgba(frames[0], (192, 208)).mode, "RGBA")

    @unittest.skipUnless(sys.platform == "win32", "Windows installer")
    def test_powershell_install_legacy_and_id_validation(self):
        with tempfile.TemporaryDirectory() as folder:
            cmd = ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(ROOT / "scripts/install.ps1"), "-CodexHome", folder]
            result = subprocess.run(cmd + ["-All", "-Legacy"], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            result = subprocess.run(cmd + ["-All"], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            result = subprocess.run(cmd + ["-PetId", "unknown"], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)


if __name__ == "__main__":
    unittest.main()
