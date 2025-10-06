from __future__ import annotations

from typing import Any, Dict, Optional

from core.services.supabase import DBConnection
from core.utils.logger import logger

from .central_agent_installer import CentralAgentInstaller
from .central_agents import SUNA_CENTRAL_AGENT


class SunaDefaultAgentService:
    """Facade preserving the legacy API for installing the central Suna agent."""

    def __init__(self, db: DBConnection = None):
        self._installer = CentralAgentInstaller(SUNA_CENTRAL_AGENT, db)
        logger.debug("🔄 SunaDefaultAgentService initialized using central installer")

    async def get_suna_default_config(self) -> Dict[str, Any]:
        from core.suna_config import SUNA_CONFIG

        return SUNA_CONFIG.copy()

    async def install_for_all_users(self) -> Dict[str, Any]:
        summary = await self._installer.install_for_all_users()
        details = list(summary.get('details', []))
        if summary["failed_count"] and not any('Falha' in d or 'Failed' in d for d in details):
            details.append(
                f"Falha ao instalar para {summary['failed_count']} contas pessoais"
            )
        if summary["installed_count"]:
            details.append(
                f"Instalado com sucesso em {summary['installed_count']} contas"
            )
        if not details:
            details.append("Nenhuma conta precisava da instalação")
        return {
            "installed_count": summary["installed_count"],
            "failed_count": summary["failed_count"],
            "details": details,
        }

    async def install_suna_agent_for_user(
        self, account_id: str, replace_existing: bool = False
    ) -> Optional[str]:
        return await self._installer.ensure_for_user(
            account_id, replace_existing=replace_existing
        )

    async def get_suna_agent_stats(self) -> Dict[str, Any]:
        stats = await self._installer.get_stats()
        stats["note"] = "Suna agents always use central configuration"
        return stats

    async def install_agent_for_user(self, account_id: str) -> Optional[str]:
        """Backward compatible helper used by older scripts."""
        return await self.install_suna_agent_for_user(account_id)
