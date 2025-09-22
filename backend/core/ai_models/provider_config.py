"""
Provider configuration based on available API keys.
This module automatically enables/disables providers based on environment variables.
"""

import os
from typing import Dict, Set
from core.utils.logger import logger

class ProviderConfig:
    """Manages which LLM providers are enabled based on available API keys."""

    # Map of provider names to their required environment variables
    PROVIDER_ENV_VARS = {
        "openai": ["OPENAI_API_KEY"],
        "anthropic": ["ANTHROPIC_API_KEY"],
        "google": ["GEMINI_API_KEY", "GOOGLE_API_KEY"],  # Either one
        "xai": ["XAI_API_KEY"],
        "openrouter": ["OPENROUTER_API_KEY"],
        "moonshotai": ["OPENROUTER_API_KEY"],  # Uses OpenRouter
        "groq": ["GROQ_API_KEY"],
    }

    # Models that should be recommended by default for each provider
    DEFAULT_RECOMMENDED = {
        "openai": "GPT-5 Mini",  # Free tier model
        "google": "Gemini 2.5 Pro",
        "xai": "Grok 4 Fast",
        "moonshotai": "Kimi K2",
    }

    def __init__(self):
        """Initialize provider configuration."""
        self.enabled_providers = self._detect_enabled_providers()
        self.recommended_model = self._get_recommended_model()
        self._log_configuration()

    def _detect_enabled_providers(self) -> Set[str]:
        """Detect which providers have valid API keys configured."""
        enabled = set()

        for provider, env_vars in self.PROVIDER_ENV_VARS.items():
            # Check if any of the required env vars are set and non-empty
            has_key = any(
                os.getenv(var) and os.getenv(var).strip()
                for var in env_vars
            )

            if has_key:
                enabled.add(provider)

        return enabled

    def _get_recommended_model(self) -> str:
        """Get the recommended model based on available providers."""
        # Priority order for recommendations
        priority_order = ["openai", "google", "xai", "anthropic", "moonshotai"]

        for provider in priority_order:
            if provider in self.enabled_providers and provider in self.DEFAULT_RECOMMENDED:
                return self.DEFAULT_RECOMMENDED[provider]

        # Fallback to first available provider's model
        if self.enabled_providers:
            first_provider = next(iter(self.enabled_providers))
            return self.DEFAULT_RECOMMENDED.get(first_provider, "")

        return ""

    def is_provider_enabled(self, provider: str) -> bool:
        """Check if a specific provider is enabled."""
        return provider.lower() in self.enabled_providers

    def get_enabled_providers(self) -> Set[str]:
        """Get the set of enabled providers."""
        return self.enabled_providers.copy()

    def _log_configuration(self):
        """Log the current provider configuration."""
        logger.info(f"LLM Provider Configuration:")
        logger.info(f"  Enabled providers: {', '.join(sorted(self.enabled_providers))}")
        logger.info(f"  Recommended model: {self.recommended_model}")

        # Log warnings for missing providers
        all_providers = set(self.PROVIDER_ENV_VARS.keys())
        disabled_providers = all_providers - self.enabled_providers
        if disabled_providers:
            logger.debug(f"  Disabled providers (no API key): {', '.join(sorted(disabled_providers))}")

# Singleton instance
provider_config = ProviderConfig()