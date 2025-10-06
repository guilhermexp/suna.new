from __future__ import annotations

import copy
import os
from typing import Any, Dict, List, Optional

from core.utils.logger import logger

from .central_agents import get_central_agent_definition, get_default_restrictions


def extract_agent_config(
    agent_data: Dict[str, Any],
    version_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Extract agent configuration for centrally managed and custom agents."""

    metadata = agent_data.get("metadata", {})
    agent_id = agent_data.get("agent_id", "Unknown")
    definition = get_central_agent_definition(metadata)

    if os.getenv("ENV_MODE", "").upper() == "STAGING":
        print(
            f"[DEBUG] extract_agent_config: agent={agent_id}, "
            f"centrally_managed={metadata.get('centrally_managed')}"
        )
        print(
            f"[DEBUG] extract_agent_config: icon_name={agent_data.get('icon_name')}, "
            f"icon_color={agent_data.get('icon_color')}, "
            f"icon_background={agent_data.get('icon_background')}"
        )

    if definition:
        return _extract_central_agent_config(agent_data, version_data, definition)

    return _extract_custom_agent_config(agent_data, version_data)


def _extract_central_agent_config(
    agent_data: Dict[str, Any],
    version_data: Optional[Dict[str, Any]],
    definition,
) -> Dict[str, Any]:
    """Build runtime configuration for centrally managed agents."""

    agent_id = agent_data.get("agent_id", "Unknown")
    metadata = agent_data.get("metadata", {})
    logger.debug(
        "Using centrally managed config '%s' for agent %s",
        definition.key,
        agent_id,
    )

    system_prompt = definition.system_prompt()
    agentpress_tools = definition.agentpress_tools()
    restrictions = get_default_restrictions(metadata)
    metadata_restrictions = metadata.get("restrictions")
    if isinstance(metadata_restrictions, dict):
        restrictions.update(metadata_restrictions)

    config: Dict[str, Any] = {
        "agent_id": agent_data["agent_id"],
        "name": definition.name,
        "description": definition.description,
        "system_prompt": system_prompt,
        "model": definition.model(),
        "agentpress_tools": _extract_agentpress_tools_for_run(agentpress_tools),
        "is_default": bool(agent_data.get("is_default") or definition.is_default),
        "is_suna_default": bool(metadata.get("is_suna_default", False)),
        "centrally_managed": True,
        "account_id": agent_data.get("account_id"),
        "current_version_id": agent_data.get("current_version_id"),
        "version_name": version_data.get("version_name", "v1") if version_data else "v1",
        "restrictions": restrictions,
        "icon_name": agent_data.get("icon_name") or definition.icon_name,
        "icon_color": agent_data.get("icon_color") or definition.icon_color,
        "icon_background": agent_data.get("icon_background") or definition.icon_background,
    }

    if version_data:
        if version_data.get("config"):
            version_config = version_data["config"]
            tools = version_config.get("tools", {})
            config["configured_mcps"] = tools.get("mcp", [])
            config["custom_mcps"] = tools.get("custom_mcp", [])
            config["workflows"] = version_config.get("workflows", [])
            config["triggers"] = version_config.get("triggers", [])
        else:
            config["configured_mcps"] = version_data.get("configured_mcps", [])
            config["custom_mcps"] = version_data.get("custom_mcps", [])
            config["workflows"] = []
            config["triggers"] = []
    else:
        config["configured_mcps"] = agent_data.get("configured_mcps", [])
        config["custom_mcps"] = agent_data.get("custom_mcps", [])
        config["workflows"] = []
        config["triggers"] = []

    return config


def _extract_custom_agent_config(
    agent_data: Dict[str, Any],
    version_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    agent_id = agent_data.get("agent_id", "Unknown")
    metadata = agent_data.get("metadata", {})

    if os.getenv("ENV_MODE", "").upper() == "STAGING":
        print(
            f"[DEBUG] _extract_custom_agent_config: icon_name={agent_data.get('icon_name')}, "
            f"icon_color={agent_data.get('icon_color')}, "
            f"icon_background={agent_data.get('icon_background')}"
        )

    if version_data:
        logger.debug(
            "Using version data for custom agent %s (version: %s)",
            agent_id,
            version_data.get("version_name", "unknown"),
        )

        if version_data.get("config"):
            config_payload = version_data["config"].copy()
            system_prompt = config_payload.get("system_prompt", "")
            model = config_payload.get("model")
            tools = config_payload.get("tools", {})
            configured_mcps = tools.get("mcp", [])
            custom_mcps = tools.get("custom_mcp", [])
            agentpress_tools = tools.get("agentpress", {})
            workflows = config_payload.get("workflows", [])
            triggers = config_payload.get("triggers", [])
        else:
            system_prompt = version_data.get("system_prompt", "")
            model = version_data.get("model")
            configured_mcps = version_data.get("configured_mcps", [])
            custom_mcps = version_data.get("custom_mcps", [])
            agentpress_tools = version_data.get("agentpress_tools", {})
            workflows: List[Dict[str, Any]] = []
            triggers: List[Dict[str, Any]] = []

        config = {
            "agent_id": agent_data["agent_id"],
            "name": agent_data["name"],
            "description": agent_data.get("description"),
            "system_prompt": system_prompt,
            "model": model,
            "agentpress_tools": _extract_agentpress_tools_for_run(agentpress_tools),
            "configured_mcps": configured_mcps,
            "custom_mcps": custom_mcps,
            "workflows": workflows,
            "triggers": triggers,
            "icon_name": agent_data.get("icon_name"),
            "icon_color": agent_data.get("icon_color"),
            "icon_background": agent_data.get("icon_background"),
            "is_default": agent_data.get("is_default", False),
            "is_suna_default": False,
            "centrally_managed": bool(metadata.get("centrally_managed", False)),
            "account_id": agent_data.get("account_id"),
            "current_version_id": agent_data.get("current_version_id"),
            "version_name": version_data.get("version_name", "v1"),
            "restrictions": copy.deepcopy(metadata.get("restrictions", {})),
        }

        return config

    logger.warning(
        "No version data found for custom agent %s, creating default configuration",
        agent_id,
    )
    logger.debug("Agent data keys: %s", list(agent_data.keys()))
    logger.debug("Agent current_version_id: %s", agent_data.get("current_version_id"))

    fallback_config = {
        "agent_id": agent_data["agent_id"],
        "name": agent_data.get("name", "Unnamed Agent"),
        "description": agent_data.get("description", ""),
        "system_prompt": "You are a helpful AI assistant.",
        "model": None,
        "agentpress_tools": _extract_agentpress_tools_for_run(
            _get_default_agentpress_tools()
        ),
        "configured_mcps": [],
        "custom_mcps": [],
        "workflows": [],
        "triggers": [],
        "icon_name": agent_data.get("icon_name"),
        "icon_color": agent_data.get("icon_color"),
        "icon_background": agent_data.get("icon_background"),
        "is_default": agent_data.get("is_default", False),
        "is_suna_default": False,
        "centrally_managed": bool(metadata.get("centrally_managed", False)),
        "account_id": agent_data.get("account_id"),
        "current_version_id": agent_data.get("current_version_id"),
        "version_name": "v1",
        "restrictions": copy.deepcopy(metadata.get("restrictions", {})),
    }

    return fallback_config


def build_unified_config(
    system_prompt: str,
    agentpress_tools: Dict[str, Any],
    configured_mcps: List[Dict[str, Any]],
    custom_mcps: Optional[List[Dict[str, Any]]] = None,
    suna_metadata: Optional[Dict[str, Any]] = None,
    workflows: Optional[List[Dict[str, Any]]] = None,
    triggers: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    simplified_tools: Dict[str, bool] = {}
    for tool_name, tool_config in agentpress_tools.items():
        if isinstance(tool_config, dict):
            simplified_tools[tool_name] = tool_config.get("enabled", False)
        elif isinstance(tool_config, bool):
            simplified_tools[tool_name] = tool_config

    config = {
        "system_prompt": system_prompt,
        "tools": {
            "agentpress": simplified_tools,
            "mcp": configured_mcps or [],
            "custom_mcp": custom_mcps or [],
        },
        "workflows": workflows or [],
        "triggers": triggers or [],
        "metadata": {},
    }

    if suna_metadata:
        config["suna_metadata"] = suna_metadata

    return config


def _get_default_agentpress_tools() -> Dict[str, bool]:
    return {
        "sb_shell_tool": True,
        "sb_files_tool": True,
        "sb_deploy_tool": True,
        "sb_expose_tool": True,
        "web_search_tool": True,
        "image_search_tool": True,
        "sb_vision_tool": True,
        "sb_image_edit_tool": True,
        "sb_presentation_outline_tool": True,
        "sb_presentation_tool": True,
        "sb_sheets_tool": False,
        "browser_tool": True,
        "data_providers_tool": True,
        "people_search_tool": False,
        "agent_config_tool": True,
        "mcp_search_tool": True,
        "credential_profile_tool": True,
        "agent_creation_tool": True,
        "workflow_tool": True,
        "trigger_tool": True,
    }


def _extract_agentpress_tools_for_run(
    agentpress_config: Dict[str, Any]
) -> Dict[str, Any]:
    if not agentpress_config:
        return {}

    run_tools: Dict[str, Any] = {}
    for tool_name, enabled in agentpress_config.items():
        if isinstance(enabled, bool):
            run_tools[tool_name] = {
                "enabled": enabled,
                "description": f"{tool_name} tool",
            }
        elif isinstance(enabled, dict):
            run_tools[tool_name] = enabled
        else:
            run_tools[tool_name] = {
                "enabled": bool(enabled),
                "description": f"{tool_name} tool",
            }

    return run_tools
