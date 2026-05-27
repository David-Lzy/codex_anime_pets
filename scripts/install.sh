#!/usr/bin/env sh
set -eu

PET_ID="assistant-004"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
SOURCE_DIR="$ROOT_DIR/pet/$PET_ID"
CODEX_HOME_DIR="${CODEX_HOME:-"$HOME/.codex"}"
TARGET_DIR="$CODEX_HOME_DIR/pets/$PET_ID"

if [ ! -f "$SOURCE_DIR/pet.json" ]; then
  echo "Missing pet.json at $SOURCE_DIR/pet.json" >&2
  exit 1
fi

if [ ! -f "$SOURCE_DIR/spritesheet.webp" ]; then
  echo "Missing spritesheet.webp at $SOURCE_DIR/spritesheet.webp" >&2
  exit 1
fi

mkdir -p "$TARGET_DIR"
cp "$SOURCE_DIR/pet.json" "$TARGET_DIR/pet.json"
cp "$SOURCE_DIR/spritesheet.webp" "$TARGET_DIR/spritesheet.webp"

echo "Installed Assistant-004"
echo "Target: $TARGET_DIR"
echo "Restart Codex or refresh the pet picker if the pet does not appear immediately."

