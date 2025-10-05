from typing import Dict, Type, Any, List, Optional, Callable
from core.agentpress.tool import Tool, SchemaType
from core.utils.logger import logger
import json


class ToolRegistry:
    """Registry for managing and accessing tools.
    
    Maintains a collection of tool instances and their schemas, allowing for
    selective registration of tool functions and easy access to tool capabilities.
    
    Attributes:
        tools (Dict[str, Dict[str, Any]]): OpenAPI-style tools and schemas
        
    Methods:
        register_tool: Register a tool with optional function filtering
        get_tool: Get a specific tool by name
        get_openapi_schemas: Get OpenAPI schemas for function calling
    """
    
    def __init__(self):
        """Initialize a new ToolRegistry instance."""
        self.tools = {}
        logger.debug("Initialized new ToolRegistry instance")
    
    def register_tool(self, tool_class: Type[Tool], function_names: Optional[List[str]] = None, **kwargs):
        """Register a tool with optional function filtering.
        
        Args:
            tool_class: The tool class to register
            function_names: Optional list of specific functions to register
            **kwargs: Additional arguments passed to tool initialization
            
        Notes:
            - If function_names is None, all functions are registered
            - Handles OpenAPI schema registration
        """
        # logger.debug(f"Registering tool class: {tool_class.__name__}")
        tool_instance = tool_class(**kwargs)
        schemas = tool_instance.get_schemas()
        
        # logger.debug(f"Available schemas for {tool_class.__name__}: {list(schemas.keys())}")
        
        registered_openapi = 0
        
        for func_name, schema_list in schemas.items():
            if function_names is None or func_name in function_names:
                for schema in schema_list:
                    if schema.schema_type == SchemaType.OPENAPI:
                        self.tools[func_name] = {
                            "instance": tool_instance,
                            "schema": schema
                        }
                        registered_openapi += 1
                        # logger.debug(f"Registered OpenAPI function {func_name} from {tool_class.__name__}")
        
        # logger.debug(f"Tool registration complete for {tool_class.__name__}: {registered_openapi} OpenAPI functions")

    def get_available_functions(self) -> Dict[str, Callable]:
        """Get all available tool functions.
        
        Returns:
            Dict mapping function names to their implementations
        """
        available_functions = {}
        
        # Get OpenAPI tool functions
        for tool_name, tool_info in self.tools.items():
            tool_instance = tool_info['instance']
            function_name = tool_name
            function = getattr(tool_instance, function_name)
            available_functions[function_name] = function
            
        # logger.debug(f"Retrieved {len(available_functions)} available functions")
        return available_functions

    def get_tool(self, tool_name: str) -> Dict[str, Any]:
        """Get a specific tool by name.
        
        Args:
            tool_name: Name of the tool function
            
        Returns:
            Dict containing tool instance and schema, or empty dict if not found
        """
        tool = self.tools.get(tool_name, {})
        if not tool:
            logger.warning(f"Tool not found: {tool_name}")
        return tool

    def get_openapi_schemas(self) -> List[Dict[str, Any]]:
        """Get OpenAPI schemas for function calling.
        
        Returns:
            List of OpenAPI-compatible schema definitions
        """
        schemas = [
            tool_info['schema'].schema 
            for tool_info in self.tools.values()
            if tool_info['schema'].schema_type == SchemaType.OPENAPI
        ]
        # logger.debug(f"Retrieved {len(schemas)} OpenAPI schemas")
        return schemas

    def get_usage_examples(self) -> Dict[str, str]:
        """Generate example XML invocations for registered tools.

        Returns:
            Dict mapping function names to formatted usage examples.
        """
        examples: Dict[str, str] = {}

        for tool_name, tool_info in self.tools.items():
            schema = tool_info.get('schema')
            if not schema or schema.schema_type != SchemaType.OPENAPI:
                continue

            function_schema = (schema.schema or {}).get('function', {})
            function_name = function_schema.get('name', tool_name)
            parameters_schema = function_schema.get('parameters', {})
            properties = parameters_schema.get('properties', {}) or {}
            required_params = parameters_schema.get('required', []) or list(properties.keys())

            param_lines: List[str] = []
            for param_name in required_params:
                param_schema = properties.get(param_name, {})
                example_value = self._build_example_value(param_schema)
                if isinstance(example_value, (dict, list)):
                    example_str = json.dumps(example_value, ensure_ascii=False)
                else:
                    example_str = str(example_value)

                param_lines.append(f"  <parameter name=\"{param_name}\">{example_str}</parameter>")

            example_lines = [
                "<function_calls>",
                f"<invoke name=\"{function_name}\">"
            ]
            example_lines.extend(param_lines)
            example_lines.append("</invoke>")
            example_lines.append("</function_calls>")

            examples[function_name] = "\n".join(example_lines)

        return examples

    def _build_example_value(self, schema: Dict[str, Any], depth: int = 0) -> Any:
        """Create an example value for a parameter schema."""
        if not schema:
            return "example"

        if 'example' in schema and schema['example'] is not None:
            return schema['example']

        if 'enum' in schema and schema['enum']:
            return schema['enum'][0]

        schema_type = schema.get('type')

        if schema_type == 'string':
            return schema.get('default') or "example"

        if schema_type == 'integer':
            return schema.get('default', 1)

        if schema_type == 'number':
            return schema.get('default', 1.0)

        if schema_type == 'boolean':
            return schema.get('default', True)

        if schema_type == 'array':
            items_schema = schema.get('items', {"type": "string"})
            return [self._build_example_value(items_schema, depth + 1)]

        if schema_type == 'object':
            if depth > 3:
                return {}

            properties = schema.get('properties', {}) or {}
            required = schema.get('required', []) or list(properties.keys())

            if not properties:
                return {}

            example_obj = {}
            for key in required:
                example_obj[key] = self._build_example_value(properties.get(key, {}), depth + 1)
            return example_obj

        if 'anyOf' in schema and schema['anyOf']:
            return self._build_example_value(schema['anyOf'][0], depth + 1)

        if 'oneOf' in schema and schema['oneOf']:
            return self._build_example_value(schema['oneOf'][0], depth + 1)

        return "example"
