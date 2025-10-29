from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Optional, List

from core.utils.logger import logger
from core.services.supabase import DBConnection

from .central_agents import CentrallyManagedAgentDefinition


@dataclass
class CentralAgentInstaller:
    definition: CentrallyManagedAgentDefinition
    db: DBConnection = None

    def __post_init__(self):
        self._db = self.db or DBConnection()
        logger.debug(
            "[CENTRAL_AGENT] Initialized installer for %s", self.definition.key
        )

    async def install_for_all_users(self) -> Dict[str, int]:
        logger.debug(
            "[CENTRAL_AGENT] Installing %s for all eligible users",
            self.definition.key,
        )
        client = await self._db.client

        accounts_result = (
            await client.schema("basejump")
            .table("accounts")
            .select("id")
            .eq("personal_account", True)
            .execute()
        )
        all_account_ids = {row["id"] for row in accounts_result.data or []}

        existing_result = (
            await client.table("agents")
            .select("account_id")
            .eq(f"metadata->>{self.definition.metadata_flag}", "true")
            .execute()
        )
        existing_account_ids = {row["account_id"] for row in existing_result.data or []}

        missing_accounts = all_account_ids - existing_account_ids
        logger.debug(
            "[CENTRAL_AGENT] %s missing accounts found for %s",
            len(missing_accounts),
            self.definition.key,
        )

        success = 0
        failures = 0
        details: List[str] = []

        for account_id in missing_accounts:
            try:
                await self._create_agent_for_user(account_id)
                success += 1
                details.append(f"Installed for {account_id}")
            except Exception as exc:  # pragma: no cover - defensive logging
                failures += 1
                message = f"Failed to install for {account_id}: {exc}"
                details.append(message)
                logger.error(
                    "[CENTRAL_AGENT] Failed to install %s for %s: %s",
                    self.definition.key,
                    account_id,
                    exc,
                )

        if not missing_accounts:
            details.append('All personal accounts already have this agent installed.')

        return {
            "installed_count": success,
            "failed_count": failures,
            "total_missing": len(missing_accounts),
            "details": details,
        }

    async def ensure_for_user(
        self, account_id: str, replace_existing: bool = False
    ) -> Optional[str]:
        client = await self._db.client

        existing_result = (
            await client.table("agents")
            .select("agent_id")
            .eq("account_id", account_id)
            .eq(f"metadata->>{self.definition.metadata_flag}", "true")
            .maybe_single()
            .execute()
        )

        if existing_result.data and not replace_existing:
            agent_id = existing_result.data["agent_id"]
            logger.debug(
                "[CENTRAL_AGENT] %s already installed for %s as %s",
                self.definition.key,
                account_id,
                agent_id,
            )
            return agent_id

        if existing_result.data and replace_existing:
            await self._delete_agent(existing_result.data["agent_id"])
            logger.debug(
                "[CENTRAL_AGENT] Existing %s removed for reinstall",
                self.definition.key,
            )

        agent_id = await self._create_agent_for_user(account_id)
        logger.debug(
            "[CENTRAL_AGENT] Installed %s for user %s as %s",
            self.definition.key,
            account_id,
            agent_id,
        )
        return agent_id

    async def get_stats(self) -> Dict[str, int]:
        client = await self._db.client

        total_result = (
            await client.table("agents")
            .select("agent_id", count="exact")
            .eq(f"metadata->>{self.definition.metadata_flag}", "true")
            .execute()
        )

        return {
            "total_agents": total_result.count or 0,
        }

    async def _create_agent_for_user(self, account_id: str) -> str:
        client = await self._db.client

        metadata = self.definition.build_metadata()
        agent_data = {
            "account_id": account_id,
            "name": self.definition.name,
            "description": self.definition.description,
            "is_default": self.definition.is_default,
            "icon_name": self.definition.icon_name,
            "icon_color": self.definition.icon_color,
            "icon_background": self.definition.icon_background,
            "system_prompt": self.definition.system_prompt(),
            "configured_mcps": list(self.definition.configured_mcps()),
            "custom_mcps": list(self.definition.custom_mcps()),
            "agentpress_tools": self.definition.agentpress_tools(),
            "metadata": metadata,
            "version_count": 1,
        }

        result = await client.table("agents").insert(agent_data).execute()
        if not result.data:
            raise RuntimeError("Failed to create centrally managed agent record")

        agent_id = result.data[0]["agent_id"]
        await self._create_initial_version(agent_id, account_id)

        return agent_id

    async def _create_initial_version(self, agent_id: str, account_id: str) -> None:
        from core.versioning.version_service import get_version_service

        version_service = await get_version_service()
        await version_service.create_version(
            agent_id=agent_id,
            user_id=account_id,
            system_prompt=self.definition.system_prompt(),
            configured_mcps=list(self.definition.configured_mcps()),
            custom_mcps=list(self.definition.custom_mcps()),
            agentpress_tools=self.definition.agentpress_tools(),
            model=self.definition.model(),
            version_name="v1",
            change_description=self.definition.default_change_description,
        )

    async def _delete_agent(self, agent_id: str) -> None:
        client = await self._db.client

        try:
            from core.triggers.trigger_service import get_trigger_service

            trigger_service = get_trigger_service(self._db)
            triggers_result = (
                await client.table("agent_triggers")
                .select("trigger_id")
                .eq("agent_id", agent_id)
                .execute()
            )

            for trigger_record in triggers_result.data or []:
                try:
                    await trigger_service.delete_trigger(trigger_record["trigger_id"])
                except Exception as exc:  # pragma: no cover - defensive logging
                    logger.warning(
                        "[CENTRAL_AGENT] Failed cleaning trigger %s: %s",
                        trigger_record["trigger_id"],
                        exc,
                    )
        except Exception as exc:  # pragma: no cover - cleanup best effort
            logger.warning(
                "[CENTRAL_AGENT] Trigger cleanup failed for %s: %s",
                agent_id,
                exc,
            )

        await client.table("agents").delete().eq("agent_id", agent_id).execute()
