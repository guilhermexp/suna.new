#!/usr/bin/env python3
"""Test GLM-4.6 Anthropic model integration in Suna"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from core.ai_models.registry import registry
from core.ai_models.manager import model_manager

# List all GLM models
print("=== GLM Models in Registry ===")
all_models = registry.get_all()
glm_models = [m for m in all_models if 'glm' in m.id.lower() or 'glm' in m.name.lower()]

for model in glm_models:
    print(f"\nID: {model.id}")
    print(f"Name: {model.name}")
    print(f"Provider: {model.provider.value}")
    print(f"Aliases: {model.aliases}")
    if model.config:
        print(f"Config:")
        print(f"  - api_base: {model.config.api_base}")
        print(f"  - model_name_override: {model.config.model_name_override}")
        print(f"  - custom_llm_provider: {model.config.custom_llm_provider}")

# Test getting LiteLLM params for the Anthropic version
print("\n=== Testing Anthropic GLM-4.6 LiteLLM Params ===")
anthropic_model_id = "zai/glm-4.6-anthropic"
model = model_manager.get_model(anthropic_model_id)

if model:
    print(f"Model found: {model.name}")
    params = model.get_litellm_params()
    print("\nLiteLLM Parameters:")
    for key, value in params.items():
        print(f"  {key}: {value}")
else:
    print(f"Model '{anthropic_model_id}' not found!")

print("\n=== Testing OpenAI GLM-4.6 LiteLLM Params ===")
openai_model_id = "openai/glm-4.6"
model = model_manager.get_model(openai_model_id)

if model:
    print(f"Model found: {model.name}")
    params = model.get_litellm_params()
    print("\nLiteLLM Parameters:")
    for key, value in params.items():
        print(f"  {key}: {value}")
else:
    print(f"Model '{openai_model_id}' not found!")
