#!/usr/bin/env python3
"""Synchronize GEMINI_API_KEY to dotenv files without printing the value."""

from __future__ import annotations

import os
import stat
import sys
import tempfile
from pathlib import Path


def validate_key(key: str) -> str:
    normalized = key.strip()
    if not normalized:
        raise ValueError("GEMINI_API_KEY is empty")
    if "\n" in normalized or "\r" in normalized:
        raise ValueError("GEMINI_API_KEY contains a newline")
    return normalized


def sync_env_file(path: Path, key: str) -> None:
    """Atomically replace one GEMINI_API_KEY entry and preserve other settings."""

    normalized = validate_key(key)
    existing = path.read_text(encoding="utf-8").splitlines() if path.exists() else []
    updated: list[str] = []
    replaced = False

    for line in existing:
        if line.lstrip().startswith("GEMINI_API_KEY="):
            if not replaced:
                updated.append(f"GEMINI_API_KEY={normalized}")
                replaced = True
            continue
        updated.append(line)

    if not replaced:
        updated.append(f"GEMINI_API_KEY={normalized}")

    path.parent.mkdir(parents=True, exist_ok=True)
    file_mode = stat.S_IMODE(path.stat().st_mode) if path.exists() else 0o600
    fd, tmp_name = tempfile.mkstemp(prefix=".env.", dir=path.parent, text=True)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as tmp:
            tmp.write("\n".join(updated).rstrip("\n") + "\n")
        os.chmod(tmp_name, file_mode)
        os.replace(tmp_name, path)
    except Exception:
        try:
            os.unlink(tmp_name)
        except FileNotFoundError:
            pass
        raise


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print("usage: sync_gemini_env.py <dotenv-path> [...]", file=sys.stderr)
        return 2

    try:
        key = validate_key(os.environ.get("GEMINI_API_KEY", ""))
        for raw_path in argv[1:]:
            path = Path(raw_path)
            sync_env_file(path, key)
            print(f"    -> synchronized {path} (value hidden)")
    except (OSError, ValueError) as exc:
        print(str(exc), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
