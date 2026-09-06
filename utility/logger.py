from __future__ import annotations

import colorsys
import hashlib
import logging
from typing import ClassVar

from rich.console import Console
from rich.logging import RichHandler
from rich.text import Text

__all__ = ["AppLogger", "ToolLogger"]


class AppLogger:
    _configured: ClassVar[bool] = False
    _console: ClassVar[Console] = Console()

    def __init__(self) -> None:
        raise TypeError("AppLogger is a static factory; use AppLogger.get(name)")

    @classmethod
    def _configure(cls, level: int) -> None:
        if cls._configured:
            return

        handler = RichHandler(
            console=cls._console,
            rich_tracebacks=True,
            show_path=False,
            markup=True,
        )
        logging.basicConfig(
            level=level,
            format="%(message)s",
            datefmt="[%X]",
            handlers=[handler],
        )
        cls._configured = True

    @classmethod
    def get(cls, name: str, level: int = logging.INFO) -> logging.Logger:
        cls._configure(level)
        logger = logging.getLogger(name)
        logger.setLevel(level)
        return logger

    @classmethod
    def console(cls) -> Console:
        return cls._console


class ToolLogger:
    """Colorized `[tool-<name>] message` logger for scripts under `tools/`."""

    _SATURATION = 0.65
    _VALUE = 0.95

    _instances: ClassVar[dict[str, ToolLogger]] = {}

    def __init__(self, name: str, level: int = logging.INFO) -> None:
        self._name = name
        self._level = level
        self._color = self._color_for(name)
        self._console = AppLogger.console()

    @classmethod
    def get(cls, name: str, level: int = logging.INFO) -> ToolLogger:
        if name not in cls._instances:
            cls._instances[name] = cls(name, level=level)
        return cls._instances[name]

    @classmethod
    def _color_for(cls, name: str) -> str:
        digest = hashlib.sha256(name.encode("utf-8")).digest()
        hue = int.from_bytes(digest[:4], "big") / 2**32
        r, g, b = colorsys.hsv_to_rgb(hue, cls._SATURATION, cls._VALUE)
        return f"#{int(r * 255):02x}{int(g * 255):02x}{int(b * 255):02x}"

    def _emit(
        self, level: int, message: str, *args: object, style: str | None = None
    ) -> None:
        if level < self._level:
            return
        body = message % args if args else message
        line = Text()
        line.append(f"[tool-{self._name}]", style=self._color)
        line.append(f" {body}", style=style)
        self._console.print(line)

    def debug(self, message: str, *args: object) -> None:
        self._emit(logging.DEBUG, message, *args, style="dim")

    def info(self, message: str, *args: object) -> None:
        self._emit(logging.INFO, message, *args)

    def warning(self, message: str, *args: object) -> None:
        self._emit(logging.WARNING, message, *args, style="yellow")

    def error(self, message: str, *args: object) -> None:
        self._emit(logging.ERROR, message, *args, style="bold red")

    def exception(self, message: str = "An exception occurred") -> None:
        self._emit(logging.ERROR, message, style="bold red")
        self._console.print_exception()
