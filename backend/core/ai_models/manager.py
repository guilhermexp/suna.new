from typing import Optional, List, Dict, Any, Tuple
from .registry import registry
from .ai_models import Model, ModelCapability
from core.utils.logger import logger
from .registry import PREMIUM_MODEL_ID, FREE_MODEL_ID

class ModelManager:
    def __init__(self):
        self.registry = registry
    
    def get_model(self, model_id: str) -> Optional[Model]:
        return self.registry.get(model_id)
    
    def resolve_model_id(self, model_id: str) -> str:
        # logger.debug(f"resolve_model_id called with: '{model_id}' (type: {type(model_id)})")
        
        resolved = self.registry.resolve_model_id(model_id)
        if resolved:
            return resolved
            
        return model_id
    
    def validate_model(self, model_id: str) -> Tuple[bool, str]:
        model = self.get_model(model_id)
        
        if not model:
            return False, f"Model '{model_id}' not found"
        
        if not model.enabled:
            return False, f"Model '{model.name}' is currently disabled"
        
        return True, ""
    
    def calculate_cost(
        self,
        model_id: str,
        input_tokens: int,
        output_tokens: int
    ) -> Optional[float]:
        model = self.get_model(model_id)
        if not model or not model.pricing:
            logger.warning(f"No pricing available for model: {model_id}")
            return None
        
        input_cost = input_tokens * model.pricing.input_cost_per_token
        output_cost = output_tokens * model.pricing.output_cost_per_token
        total_cost = input_cost + output_cost
        
        # logger.debug(
        #     f"Cost calculation for {model.name}: "
        #     f"{input_tokens} input tokens (${input_cost:.6f}) + "
        #     f"{output_tokens} output tokens (${output_cost:.6f}) = "
        #     f"${total_cost:.6f}"
        # )
        
        return total_cost

    def get_litellm_params(self, model_id: str, **override_params) -> Dict[str, Any]:
        """Get complete LiteLLM parameters for a model from the registry."""
        model = self.get_model(model_id)
        if not model:
            logger.warning(f"Model '{model_id}' not found in registry, using basic params")
            return {
                "model": model_id,
                "num_retries": 3,
                **override_params
            }
        
        # Get the complete configuration from the model
        params = model.get_litellm_params(**override_params)
        # logger.debug(f"Generated LiteLLM params for {model.name}: {list(params.keys())}")
        
        return params
    
    def get_models_with_capability(self, capability: ModelCapability) -> List[Model]:
        return self.registry.get_by_capability(capability, enabled_only=True)

    def select_best_model(
        self,
        required_capabilities: Optional[List[ModelCapability]] = None,
        min_context_window: Optional[int] = None,
        prefer_cheaper: bool = False
    ) -> Optional[Model]:
        models = self.registry.get_all(enabled_only=True)

        if required_capabilities:
            models = [
                m for m in models
                if all(cap in m.capabilities for cap in required_capabilities)
            ]

        if min_context_window:
            models = [m for m in models if m.context_window >= min_context_window]

        if not models:
            return None

        if prefer_cheaper and any(m.pricing for m in models):
            models_with_pricing = [m for m in models if m.pricing]
            if models_with_pricing:
                models = sorted(
                    models_with_pricing,
                    key=lambda m: m.pricing.input_cost_per_million_tokens
                )
        else:
            models = sorted(
                models,
                key=lambda m: (-m.priority, not m.recommended)
            )

        return models[0] if models else None

    def get_default_model(self) -> Optional[Model]:
        models = self.registry.get_all(enabled_only=True)
        
        recommended = [m for m in models if m.recommended]
        if recommended:
            recommended = sorted(recommended, key=lambda m: -m.priority)
            return recommended[0]
        
        if models:
            models = sorted(models, key=lambda m: -m.priority)
            return models[0]
        
        return None
    
    def get_context_window(self, model_id: str, default: int = 31_000) -> int:
        return self.registry.get_context_window(model_id, default)
    
    def check_token_limit(
        self,
        model_id: str,
        token_count: int,
        is_input: bool = True
    ) -> Tuple[bool, int]:
        model = self.get_model(model_id)
        if not model:
            return False, 0
        
        if is_input:
            max_allowed = model.context_window
        else:
            max_allowed = model.max_output_tokens or model.context_window
        
        return token_count <= max_allowed, max_allowed
    
    def format_model_info(self, model_id: str) -> Dict[str, Any]:
        model = self.get_model(model_id)
        if not model:
            return {"error": f"Model '{model_id}' not found"}
        
        return {
            "id": model.id,
            "name": model.name,
            "provider": model.provider.value,
            "context_window": model.context_window,
            "max_output_tokens": model.max_output_tokens,
            "capabilities": [cap.value for cap in model.capabilities],
            "pricing": {
                "input_per_million": model.pricing.input_cost_per_million_tokens,
                "output_per_million": model.pricing.output_cost_per_million_tokens,
            } if model.pricing else None,
            "enabled": model.enabled,
            "beta": model.beta,
            "priority": model.priority,
            "recommended": model.recommended,
        }

    def list_available_models(
        self,
        include_disabled: bool = False
    ) -> List[Dict[str, Any]]:
        # logger.debug(f"list_available_models called with include_disabled={include_disabled}")

        models = self.registry.get_all(enabled_only=not include_disabled)
        # logger.debug(f"Found {len(models)} total models")

        if models:
            model_names = [m.name for m in models]
            # logger.debug(f"Models: {model_names}")
        else:
            logger.warning("No models found - this might indicate a configuration issue")

        models = sorted(
            models,
            key=lambda m: (-m.priority, m.name)
        )
        
        return [self.format_model_info(m.id) for m in models]
    
    def get_legacy_constants(self) -> Dict:
        return self.registry.to_legacy_format()

    def get_default_model_for_user(self, client=None, user_id: str = None) -> str:
        """Get the default model for any user (always returns premium model since billing is removed)."""
        return PREMIUM_MODEL_ID


model_manager = ModelManager() 