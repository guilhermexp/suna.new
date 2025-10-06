from __future__ import annotations

from typing import Dict, Optional

from core.services.supabase import DBConnection
from core.utils.logger import logger

from .central_agent_installer import CentralAgentInstaller
from .central_agents import CLAUDE_CODE_CENTRAL_AGENT


class ClaudeCodeAgentService:
    """Service layer to install the centrally managed Claude Code CLI agent."""

    def __init__(self, db: DBConnection = None):
        self._installer = CentralAgentInstaller(CLAUDE_CODE_CENTRAL_AGENT, db)
        logger.debug("🔄 ClaudeCodeAgentService initialized")

    async def install_for_all_users(self) -> Dict[str, int]:
        return await self._installer.install_for_all_users()

    async def ensure_agent_for_user(
        self, account_id: str, replace_existing: bool = False
    ) -> Optional[str]:
        return await self._installer.ensure_for_user(
            account_id, replace_existing=replace_existing
        )

    async def get_stats(self) -> Dict[str, int]:
        return await self._installer.get_stats()
