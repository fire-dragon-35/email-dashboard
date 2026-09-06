import logging
import re

from utility import ToolLogger
from utility.logger import AppLogger


def test_get_returns_same_instance_for_same_name() -> None:
    first = ToolLogger.get("tool-a")
    second = ToolLogger.get("tool-a")

    assert first is second


def test_get_returns_different_instances_for_different_names() -> None:
    a = ToolLogger.get("tool-b")
    c = ToolLogger.get("tool-c")

    assert a is not c


def test_color_is_deterministic_for_a_given_name() -> None:
    first = ToolLogger("determ-tool")
    second = ToolLogger("determ-tool")

    assert first._color == second._color
    assert re.fullmatch(r"#[0-9a-f]{6}", first._color)


def test_output_is_prefixed_with_tool_name_and_colored() -> None:
    log = ToolLogger("prefix-check")
    console = AppLogger.console()

    with console.capture() as capture:
        log.info("hello %s", "world")

    output = capture.get()
    assert "[tool-prefix-check]" in output
    assert "hello world" in output


def test_messages_below_level_are_suppressed() -> None:
    log = ToolLogger("level-check", level=logging.WARNING)
    console = AppLogger.console()

    with console.capture() as capture:
        log.info("should not appear")
        log.warning("should appear")

    output = capture.get()
    assert "should not appear" not in output
    assert "should appear" in output
