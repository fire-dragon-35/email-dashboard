import json
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from tools.azure_cli_client import AzureCliClient, AzureCliError


def _completed(returncode: int = 0, stdout: str = "", stderr: str = "") -> SimpleNamespace:
    return SimpleNamespace(returncode=returncode, stdout=stdout, stderr=stderr)


def _client_with_fake_runner() -> tuple[AzureCliClient, MagicMock]:
    runner = MagicMock()
    return AzureCliClient(runner=runner), runner


def test_run_appends_json_output_flag_and_parses_result() -> None:
    client, runner = _client_with_fake_runner()
    runner.return_value = _completed(stdout=json.dumps({"id": "sub-1"}))

    result = client.run("account", "show")

    assert result == {"id": "sub-1"}
    runner.assert_called_once_with(["az", "account", "show", "--output", "json"])


def test_run_returns_none_for_empty_output() -> None:
    client, runner = _client_with_fake_runner()
    runner.return_value = _completed(stdout="")

    assert client.run("logout") is None


def test_run_raises_azure_cli_error_on_nonzero_exit() -> None:
    client, runner = _client_with_fake_runner()
    runner.return_value = _completed(returncode=1, stderr="ERROR: not logged in")

    with pytest.raises(AzureCliError) as excinfo:
        client.run("account", "show")

    assert excinfo.value.returncode == 1
    assert "not logged in" in str(excinfo.value)


def test_is_logged_in_true_when_account_show_succeeds() -> None:
    client, runner = _client_with_fake_runner()
    runner.return_value = _completed(stdout=json.dumps({"id": "sub-1"}))

    assert client.is_logged_in() is True


def test_is_logged_in_false_when_account_show_fails() -> None:
    client, runner = _client_with_fake_runner()
    runner.return_value = _completed(returncode=1, stderr="ERROR: Please run 'az login'")

    assert client.is_logged_in() is False


def test_list_subscriptions_returns_parsed_list() -> None:
    client, runner = _client_with_fake_runner()
    runner.return_value = _completed(stdout=json.dumps([{"id": "sub-1"}, {"id": "sub-2"}]))

    result = client.list_subscriptions()

    assert result == [{"id": "sub-1"}, {"id": "sub-2"}]
    runner.assert_called_once_with(["az", "account", "list", "--output", "json"])


def test_set_subscription_calls_account_set() -> None:
    client, runner = _client_with_fake_runner()
    runner.return_value = _completed(stdout="")

    client.set_subscription("sub-1")

    runner.assert_called_once_with(
        ["az", "account", "set", "--subscription", "sub-1", "--output", "json"]
    )


def test_resource_group_exists_true_and_false() -> None:
    client, runner = _client_with_fake_runner()
    runner.return_value = _completed(stdout=json.dumps({"name": "rg-1"}))
    assert client.resource_group_exists("rg-1") is True

    client, runner = _client_with_fake_runner()
    runner.return_value = _completed(returncode=1, stderr="ERROR: not found")
    assert client.resource_group_exists("missing-rg") is False


def test_list_resource_groups_returns_parsed_list() -> None:
    client, runner = _client_with_fake_runner()
    runner.return_value = _completed(stdout=json.dumps([{"name": "rg-1"}]))

    result = client.list_resource_groups()

    assert result == [{"name": "rg-1"}]
    runner.assert_called_once_with(["az", "group", "list", "--output", "json"])
