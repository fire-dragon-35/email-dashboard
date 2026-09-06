from __future__ import annotations

import json
import shutil
import subprocess
from collections.abc import Callable, Sequence
from typing import Any

from utility import ToolLogger

log = ToolLogger.get("azure-cli-client")

CommandRunner = Callable[[Sequence[str]], "subprocess.CompletedProcess[str]"]


class AzureCliError(RuntimeError):
    def __init__(self, command: Sequence[str], returncode: int, stderr: str) -> None:
        super().__init__(f"`{' '.join(command)}` failed ({returncode}): {stderr.strip()}")
        self.command = command
        self.returncode = returncode
        self.stderr = stderr


class AzureCliClient:
    def __init__(self, runner: CommandRunner | None = None) -> None:
        self._runner = runner or self._default_runner

    @staticmethod
    def _default_runner(command: Sequence[str]) -> subprocess.CompletedProcess[str]:
        return subprocess.run(command, capture_output=True, text=True)

    @staticmethod
    def is_installed() -> bool:
        return shutil.which("az") is not None

    def run(self, *args: str) -> Any:
        command = ["az", *args, "--output", "json"]
        result = self._runner(command)
        if result.returncode != 0:
            log.error("Command failed: %s", " ".join(command))
            raise AzureCliError(command, result.returncode, result.stderr)
        output = result.stdout.strip()
        return json.loads(output) if output else None

    def login(self) -> Any:
        result = self.run("login")
        log.info("Logged in to Azure CLI")
        return result

    def logout(self) -> None:
        self.run("logout")
        log.info("Logged out of Azure CLI")

    def is_logged_in(self) -> bool:
        try:
            self.run("account", "show")
            return True
        except AzureCliError:
            return False

    def current_account(self) -> dict[str, Any]:
        return self.run("account", "show")

    def list_subscriptions(self) -> list[dict[str, Any]]:
        return self.run("account", "list")

    def set_subscription(self, subscription_id: str) -> None:
        self.run("account", "set", "--subscription", subscription_id)
        log.info("Active subscription set to %s", subscription_id)

    def list_resource_groups(self) -> list[dict[str, Any]]:
        return self.run("group", "list")

    def resource_group_exists(self, name: str) -> bool:
        try:
            self.run("group", "show", "--name", name)
            return True
        except AzureCliError:
            return False
