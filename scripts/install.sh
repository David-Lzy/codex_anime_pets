#!/usr/bin/env sh
set -eu

DEFAULT_PET_ID="assistant-004"
PET_ID="$DEFAULT_PET_ID"
INSTALL_ALL=0
LIST_ONLY=0

while [ "$#" -gt 0 ]; do
  case "$1" in
    --pet)
      shift
      if [ "$#" -eq 0 ]; then
        echo "--pet requires a pet id" >&2
        exit 1
      fi
      PET_ID="$1"
      ;;
    --all)
      INSTALL_ALL=1
      ;;
    --list)
      LIST_ONLY=1
      ;;
    -h|--help)
      echo "Usage: ./scripts/install.sh [--pet PET_ID] [--all] [--list]"
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
  shift
done

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
CODEX_HOME_DIR="${CODEX_HOME:-"$HOME/.codex"}"

python_bin=""
if command -v python3 >/dev/null 2>&1; then
  python_bin="python3"
elif command -v python >/dev/null 2>&1; then
  python_bin="python"
else
  echo "Python 3 is required for catalog-aware installation." >&2
  exit 1
fi

if [ "$LIST_ONLY" -eq 1 ]; then
  "$python_bin" "$ROOT_DIR/scripts/install.py" --list
elif [ "$INSTALL_ALL" -eq 1 ]; then
  "$python_bin" "$ROOT_DIR/scripts/install.py" --codex-home "$CODEX_HOME_DIR" --all
else
  "$python_bin" "$ROOT_DIR/scripts/install.py" --codex-home "$CODEX_HOME_DIR" --pet "$PET_ID"
fi

