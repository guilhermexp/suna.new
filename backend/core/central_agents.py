from __future__ import annotations

import copy
import os
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Dict, Iterable, Optional


def _load_claude_md() -> str:
    root_dir = Path(__file__).resolve().parents[2]
    claude_path = root_dir / "CLAUDE.md"
    try:
        return claude_path.read_text(encoding="utf-8").strip()
    except FileNotFoundError:
        return (
            "CLAUDE.md não foi encontrado no repositório. "
            "Verifique a estrutura do projeto para garantir que o guia esteja presente."
        )


@dataclass(frozen=True)
class CentrallyManagedAgentDefinition:
    """Definition describing how to manage a centrally maintained agent."""

    key: str
    metadata_flag: str
    name: str
    description: str
    model_factory: Callable[[], str]
    system_prompt_factory: Callable[[], str]
    agentpress_tools_factory: Callable[[], Dict[str, Any]]
    configured_mcps_factory: Callable[[], Iterable[Any]] = tuple
    custom_mcps_factory: Callable[[], Iterable[Any]] = tuple
    icon_name: str = "sparkles"
    icon_color: str = "#2563EB"
    icon_background: str = "#EFF6FF"
    restrictions: Dict[str, bool] = field(default_factory=dict)
    default_change_description: str = "Initial centrally managed agent installation"
    is_default: bool = False
    extra_metadata_factory: Optional[Callable[[], Dict[str, Any]]] = None

    def build_metadata(self) -> Dict[str, Any]:
        metadata = {
            self.metadata_flag: True,
            "centrally_managed": True,
            "managed_agent_key": self.key,
            "installation_date": datetime.now(timezone.utc).isoformat(),
            "restrictions": copy.deepcopy(self.restrictions),
        }
        if self.extra_metadata_factory:
            extra = self.extra_metadata_factory() or {}
            metadata.update(extra)
        return metadata

    def system_prompt(self) -> str:
        return self.system_prompt_factory()

    def model(self) -> str:
        return self.model_factory()

    def agentpress_tools(self) -> Dict[str, Any]:
        return copy.deepcopy(self.agentpress_tools_factory())

    def configured_mcps(self) -> Iterable[Any]:
        return copy.deepcopy(tuple(self.configured_mcps_factory()))

    def custom_mcps(self) -> Iterable[Any]:
        return copy.deepcopy(tuple(self.custom_mcps_factory()))


def _suna_model() -> str:
    from core.suna_config import SUNA_CONFIG

    return SUNA_CONFIG["model"]


def _suna_system_prompt() -> str:
    from core.suna_config import SUNA_CONFIG

    return SUNA_CONFIG["system_prompt"]


def _suna_tools() -> Dict[str, Any]:
    from core.suna_config import SUNA_CONFIG

    return copy.deepcopy(SUNA_CONFIG["agentpress_tools"])


def _suna_configured_mcps() -> Iterable[Any]:
    from core.suna_config import SUNA_CONFIG

    return copy.deepcopy(SUNA_CONFIG.get("configured_mcps", []))


def _suna_custom_mcps() -> Iterable[Any]:
    from core.suna_config import SUNA_CONFIG

    return copy.deepcopy(SUNA_CONFIG.get("custom_mcps", []))


def _claude_code_model() -> str:
    return os.getenv("CLAUDE_CODE_BRIDGE_MODEL", "anthropic/claude-code-bridge")


def _claude_code_system_prompt() -> str:
    base_instructions = (
        "Você é o agente oficial `Claude Code CLI` executado via ponte no Suna. "
        "Respeite exatamente as instruções abaixo, espelhadas do arquivo CLAUDE.md do repositório.\n\n"
    )
    return f"{base_instructions}{_load_claude_md()}"


def _claude_code_tools() -> Dict[str, Any]:
    # Reutiliza o mesmo conjunto de ferramentas padrão do Suna para manter paridade
    from core.suna_config import SUNA_CONFIG

    return copy.deepcopy(SUNA_CONFIG["agentpress_tools"])


_CLAUDE_CODE_RESTRICTIONS = {
    "system_prompt_editable": False,
    "tools_editable": False,
    "name_editable": False,
    "description_editable": False,
    "mcps_editable": True,
}

_SUNA_RESTRICTIONS = {
    "system_prompt_editable": False,
    "tools_editable": False,
    "name_editable": False,
    "description_editable": False,
    "mcps_editable": True,
}


def _claude_extra_metadata() -> Dict[str, Any]:
    return {
        "source_prompt": "CLAUDE.md",
        "notes": "Centrally managed Claude Code CLI bridge agent",
    }


SUNA_CENTRAL_AGENT = CentrallyManagedAgentDefinition(
    key="suna_default",
    metadata_flag="is_suna_default",
    name="Suna",
    description="Suna is your AI assistant with centrally managed instructions.",
    model_factory=_suna_model,
    system_prompt_factory=_suna_system_prompt,
    agentpress_tools_factory=_suna_tools,
    configured_mcps_factory=_suna_configured_mcps,
    custom_mcps_factory=_suna_custom_mcps,
    icon_name="sun",
    icon_color="#F59E0B",
    icon_background="#FFF3CD",
    restrictions=_SUNA_RESTRICTIONS,
    default_change_description="Initial Suna agent installation",
    is_default=True,
)

CLAUDE_CODE_CENTRAL_AGENT = CentrallyManagedAgentDefinition(
    key="claude_code_cli",
    metadata_flag="is_claude_code_default",
    name="Claude Code CLI",
    description=(
        "Agente oficial para o fluxo do Claude Code CLI via ponte, com prompt protegido e ferramentas do Suna."
    ),
    model_factory=_claude_code_model,
    system_prompt_factory=_claude_code_system_prompt,
    agentpress_tools_factory=_claude_code_tools,
    configured_mcps_factory=tuple,
    custom_mcps_factory=tuple,
    icon_name="code-xml",
    icon_color="#4C1D95",
    icon_background="#EDE9FE",
    restrictions=_CLAUDE_CODE_RESTRICTIONS,
    default_change_description="Instalação inicial do agente Claude Code CLI",
    is_default=False,
    extra_metadata_factory=_claude_extra_metadata,
)

CENTRAL_AGENT_DEFINITIONS = {
    SUNA_CENTRAL_AGENT.metadata_flag: SUNA_CENTRAL_AGENT,
    CLAUDE_CODE_CENTRAL_AGENT.metadata_flag: CLAUDE_CODE_CENTRAL_AGENT,
}


def get_central_agent_definition(metadata: Optional[Dict[str, Any]]) -> Optional[CentrallyManagedAgentDefinition]:
    if not metadata:
        return None

    for flag, definition in CENTRAL_AGENT_DEFINITIONS.items():
        if metadata.get(flag):
            return definition
    return None


def get_default_restrictions(metadata: Optional[Dict[str, Any]]) -> Dict[str, bool]:
    definition = get_central_agent_definition(metadata)
    if definition:
        return copy.deepcopy(definition.restrictions)
    return {}
