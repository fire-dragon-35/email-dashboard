import subprocess
import sys


def test_ruff_check_passes() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "ruff", "check", "."],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stdout + result.stderr


def test_vulture_finds_no_dead_code() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "vulture", "tools", "utility"],
        capture_output=True,
        text=True,
    )
    assert result.returncode == 0, result.stdout + result.stderr
