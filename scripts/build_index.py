#!/usr/bin/env python3
"""Rebuild bilingual retrieval indexes from the pet catalog."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def build():
    pets = json.loads((ROOT / "catalog.json").read_text(encoding="utf-8"))["pets"]
    records, tags = [], {}
    for pet in pets:
        record = {"id": pet["id"], "display_name": pet["display_name"], "path": f"pets/{pet['id']}/",
                  "install_command": pet["install"]["command_python"], "status": pet["status"],
                  "sprite_version": pet["atlas"].get("sprite_version", 1), "hd": pet.get("hd", False)}
        for locale, suffix in (("en", ""), ("zh", "_zh")):
            record[f"summary_{locale}"] = pet.get("short_description" + suffix, "")
            words = [pet.get("display_name" + suffix, ""), pet.get("type" + suffix, "")]
            for key in ("search_keywords", "visual_keywords", "personality", "best_for"):
                words.extend(pet.get(key + suffix, []))
            record[f"query_text_{locale}"] = " ".join(words)
        record["tags"] = sorted(set(pet["category"] + [s.lower().replace(" ", "-") for s in pet["search_keywords"]]))
        if pet.get("fan_notice"):
            record["fan_notice"] = pet["fan_notice"]
        for tag in record["tags"] + pet.get("search_keywords_zh", []):
            tags.setdefault(tag, []).append(pet["id"])
        records.append(record)
    for name, data in (("ai-search-index.json", {"schema_version": 1, "records": records}), ("tags.json", dict(sorted(tags.items())))):
        (ROOT / "indexes" / name).write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    assert len({r["id"] for r in records}) == len(pets), "Duplicate pet IDs"
    return len(records)


if __name__ == "__main__":
    print(f"Indexed {build()} pets")
