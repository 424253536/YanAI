from __future__ import annotations

import unittest
from threading import Event
from unittest.mock import patch

from api import support


class AccountRefreshWatcherTests(unittest.TestCase):
    def test_account_refresh_watcher_refreshes_all_tokens(self) -> None:
        stop_event = Event()
        calls: list[list[str]] = []

        class FakeConfig:
            refresh_account_interval_minute = 1

        class FakeAccountService:
            def list_tokens(self) -> list[str]:
                stop_event.set()
                return ["token-a", "token-b"]

            def refresh_accounts(self, tokens: list[str]) -> dict[str, object]:
                calls.append(tokens)
                return {"refreshed": len(tokens), "errors": [], "items": []}

        with (
            patch.object(support, "config", FakeConfig()),
            patch.object(support, "account_service", FakeAccountService()),
        ):
            thread = support.start_account_refresh_watcher(stop_event)
            thread.join(timeout=2)

        self.assertFalse(thread.is_alive())
        self.assertEqual(calls, [["token-a", "token-b"]])


if __name__ == "__main__":
    unittest.main()
