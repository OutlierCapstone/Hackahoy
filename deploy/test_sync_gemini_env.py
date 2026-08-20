import os
import stat
import tempfile
import unittest
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
from unittest.mock import patch

from deploy.sync_gemini_env import main, sync_env_file, validate_key


class SyncGeminiEnvTests(unittest.TestCase):
    def test_replaces_duplicates_preserves_other_lines_and_enforces_private_mode(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / ".env"
            path.write_text(
                "KEEP=value\nGEMINI_API_KEY=old\nGEMINI_API_KEY=stale\n",
                encoding="utf-8",
            )
            os.chmod(path, 0o640)

            sync_env_file(path, "new-key")

            self.assertEqual(
                path.read_text(encoding="utf-8"),
                "KEEP=value\nGEMINI_API_KEY=new-key\n",
            )
            if os.name != "nt":
                self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o600)

    def test_creates_parent_and_private_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "nested" / ".env"
            sync_env_file(path, "new-key")
            self.assertEqual(path.read_text(encoding="utf-8"), "GEMINI_API_KEY=new-key\n")
            if os.name != "nt":
                self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o600)

    def test_rejects_empty_or_multiline_key(self):
        for value in ("", "   ", "bad\nkey", "bad\rkey"):
            with self.subTest(value=value):
                with self.assertRaises(ValueError):
                    validate_key(value)

    def test_cli_never_prints_key_value(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / ".env"
            output = StringIO()
            with patch.dict(os.environ, {"GEMINI_API_KEY": "sensitive-test-value"}), redirect_stdout(output):
                result = main(["sync_gemini_env.py", str(path)])
            self.assertEqual(result, 0)
            self.assertNotIn("sensitive-test-value", output.getvalue())


if __name__ == "__main__":
    unittest.main()
