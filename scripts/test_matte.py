import tempfile
import unittest
from pathlib import Path

from PIL import Image, ImageDraw
from matte_pet import key_green, prepare_pair_canvas, split_pair


class MattingTest(unittest.TestCase):
    def test_green_white_black_and_antialias(self):
        image = Image.new("RGB", (4, 1))
        image.putdata([(0, 255, 0), (255, 255, 255), (0, 0, 0), (128, 255, 128)])
        pixels = list(key_green(image).getdata())
        self.assertEqual(pixels[:3], [(0, 0, 0, 0), (255, 255, 255, 255), (0, 0, 0, 255)])
        self.assertEqual(pixels[3], (255, 255, 255, 128))

    def test_brown_edge_has_no_yellow_spill(self):
        image = Image.new("RGB", (4, 1))
        image.putdata([(0, 255, 0), (100, 50, 25), (50, 153, 13), (0, 255, 0)])
        edge = key_green(image).getpixel((2, 0))
        self.assertEqual(edge[:3], (100, 50, 25))
        self.assertLessEqual(abs(edge[3] - 128), 2)

    def test_curved_split_preserves_crossing_hair_and_shoe(self):
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / "pair.png"
            image = Image.new("RGB", (1200, 1300), "#00ff00")
            draw = ImageDraw.Draw(image)
            draw.rectangle((200, 100, 500, 1200), fill="white")
            draw.rectangle((200, 1100, 660, 1200), fill="white")
            draw.rectangle((800, 100, 1000, 1200), fill="black")
            draw.rectangle((580, 400, 900, 600), fill="black")
            image.save(source)
            report = split_pair(source, Path(folder) / "frame")
            self.assertLess(report["split_range"][0], report["split_range"][1])
            original = key_green(image).getchannel("A").histogram()[255]
            total = 0
            for entry in report["frames"]:
                with Image.open(Path(folder) / entry["file"]) as frame:
                    total += frame.getchannel("A").histogram()[255]
            self.assertEqual(total, original)

    def test_shared_canvas_preserves_height(self):
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / "pair.png"
            image = Image.new("RGB", (1200, 1300), "#00ff00")
            draw = ImageDraw.Draw(image)
            draw.rectangle((200, 100, 400, 1200), fill="white")
            draw.rectangle((800, 220, 1000, 1100), fill="black")
            image.save(source)
            report = split_pair(source, Path(folder) / "frame")
            self.assertEqual(report["source_canvas"], [768, 1536])
            a, b = report["frames"]
            self.assertEqual(a["bounds"][3] - b["bounds"][3], 100)
            self.assertEqual(b["bounds"][1] - a["bounds"][1], 120)

    def test_provider_wide_canvas_preserves_native_scale(self):
        image = Image.new("RGB", (1774, 887), "#00ff00")
        draw = ImageDraw.Draw(image)
        draw.rectangle((200, 80, 700, 850), fill="white")
        draw.rectangle((1074, 80, 1574, 850), fill="black")
        prepared, report = prepare_pair_canvas(image)
        self.assertEqual(prepared.size, (1774, 887))
        self.assertEqual(report["canvas_scale"], 1)
        self.assertEqual(report["canvas_padding_top"], 0)

        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / "wide.png"
            image.save(source)
            split_report = split_pair(source, Path(folder) / "frame")
            self.assertEqual(split_report["native_size"], [1774, 887])
            self.assertEqual(split_report["normalized_size"], [1774, 887])
            self.assertEqual(split_report["source_canvas"], [887, 1536])
            self.assertEqual(split_report["padding_top"], 265)
            self.assertTrue(all(entry["bounds"][3] - entry["bounds"][1] >= 591
                                for entry in split_report["frames"]))

    def test_mixed_provider_canvas_only_downscales_the_whole_image(self):
        image = Image.new("RGB", (1536, 1024), "#00ff00")
        prepared, report = prepare_pair_canvas(image, target_height=887)
        self.assertEqual(prepared.size, (1330, 887))
        self.assertAlmostEqual(report["canvas_scale"], 887 / 1024)
        with self.assertRaisesRegex(ValueError, "only downscale"):
            prepare_pair_canvas(image, target_height=1100)

    def test_rejects_clipped_source_before_padding(self):
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / "clipped.png"
            image = Image.new("RGB", (1200, 1300), "#00ff00")
            ImageDraw.Draw(image).rectangle((1100, 900, 1199, 1100), fill="white")
            image.save(source)
            with self.assertRaisesRegex(ValueError, "touches the image edge"):
                split_pair(source, Path(folder) / "frame")


if __name__ == "__main__":
    unittest.main()
