import logging

import pytest

from utility import AppLogger


def test_get_returns_standard_logger_with_correct_name() -> None:
    logger = AppLogger.get("test.logger.name")

    assert isinstance(logger, logging.Logger)
    assert logger.name == "test.logger.name"


def test_get_is_idempotent_and_does_not_duplicate_handlers() -> None:
    root_before = len(logging.getLogger().handlers)

    AppLogger.get("test.logger.idempotent")
    AppLogger.get("test.logger.idempotent")
    AppLogger.get("test.logger.other")

    root_after = len(logging.getLogger().handlers)
    assert root_after == root_before or root_after == 1


def test_get_respects_requested_level() -> None:
    logger = AppLogger.get("test.logger.level", level=logging.WARNING)

    assert logger.level == logging.WARNING


def test_direct_instantiation_is_disallowed() -> None:
    with pytest.raises(TypeError):
        AppLogger()


def test_console_returns_shared_rich_console() -> None:
    from rich.console import Console

    console = AppLogger.console()

    assert isinstance(console, Console)
    assert AppLogger.console() is console
