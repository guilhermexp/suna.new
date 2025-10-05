# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Suna** is a self-hosted fork of Kortix, an open-source platform for building and managing AI agents. This fork is optimized for Railway deployment with custom features for cost optimization and local billing.

**Important**: This is a **self-hosted fork** with critical customizations that must be preserved. See `docs/workflows/UPSTREAM_SYNC_WORKFLOW.md` for upstream sync procedures.

## Development Commands

### Frontend (Next.js)
```bash
cd frontend
npm install              # Install dependencies
npm run dev              # Start dev server with Turbopack
npm run build            # Production build
npm run lint             # Run ESLint
npm run format           # Format with Prettier
npm run format:check     # Check formatting
```

### Backend (Python/FastAPI)
```bash
cd backend
pip install -e .         # Install in editable mode
pytest                   # Run all tests
pytest path/to/test.py   # Run specific test file
pytest -k test_name      # Run specific test by name
pytest --cov             # Run with coverage
uvicorn core.run:app --reload  # Start dev server
```

### Docker
```bash
# Build and run full stack
docker-compose up --build

# Backend only
docker-compose up backend

# Frontend only
docker-compose up frontend
```

## Architecture

### Core Components

**Backend (`backend/core/`)**:
- `agentpress/` - Core agent execution engine
  - `thread_manager.py` - Conversation thread orchestration
  - `response_processor.py` - LLM response handling with streaming
  - `context_manager.py` - Token counting and message compression
  - `tool_registry.py` - Tool registration and schema management
  - `prompt_caching.py` - Anthropic prompt caching strategies
- `ai_models/` - LLM provider abstraction
  - `registry.py` - Model definitions and configurations (**includes custom 302.AI model**)
  - `ai_models.py` - Model capabilities and pricing
- `tools/` - 34+ built-in agent tools (browser, files, search, etc.)
- `billing/` - Usage tracking and cost calculation (**LOCAL mode preserved**)
- `sandbox/` - Isolated Docker execution environments (Daytona integration)

**Frontend (`frontend/src/`)**:
- `app/` - Next.js App Router pages
- `components/` - React components
  - `thread/` - Chat interface and message handling
  - `agents/` - Agent configuration UI
  - `billing/` - Token usage tracking (**custom components**)
- `hooks/react-query/` - Data fetching with TanStack Query
- `lib/` - Utilities and helpers

### Agent Execution Flow

1. **Thread Creation** - `ThreadManager.create_thread()` creates conversation in Supabase
2. **Message Addition** - User message added via `ThreadManager.add_message()`
3. **LLM Call** - `make_llm_api_call()` via LiteLLM with streaming
4. **Tool Execution** - Tools called via `ToolRegistry` when LLM requests them
5. **Response Processing** - `ResponseProcessor` handles streaming, tool results, errors
6. **Context Management** - `ContextManager` compresses messages when approaching token limits
7. **Billing** - Token usage tracked and billed via `billing_integration`

### Tool System

Tools inherit from `Tool` base class and use `@openapi_schema` decorator:

```python
from core.agentpress.tool import Tool, ToolResult, openapi_schema

class MyTool(Tool):
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "my_tool",
            "description": "Tool description",
            "parameters": { /* OpenAPI schema */ }
        }
    })
    async def my_tool(self, param: str) -> ToolResult:
        # Implementation
        return self.success_response({"result": "data"})
```

**Note**: The `@usage_example` decorator was removed on 2025-10-04. Do not use it.

### Model Registry

Models are registered in `backend/core/ai_models/registry.py`:

```python
self.register(Model(
    id="provider/model-name",
    name="Display Name",
    provider=ModelProvider.ANTHROPIC,
    context_window=200_000,
    capabilities=[ModelCapability.CHAT, ModelCapability.FUNCTION_CALLING],
    pricing=ModelPricing(input_cost_per_million_tokens=3.00, ...),
))
```

## Critical Customizations (DO NOT REMOVE)

This fork has essential modifications for self-hosting that must be preserved:

### 1. **302.AI Custom Model** (`backend/core/ai_models/registry.py`)
Custom discounted Claude endpoint with 70% cost savings:
```python
id="claude-sonnet-4-5-20250929"  # No provider prefix
api_base="https://api.302.ai/cc"
pricing: 0.90 input (vs 3.00 standard)
```

### 2. **Billing LOCAL Mode** (`backend/core/billing/api.py`)
Self-hosted billing without Stripe integration. Contains `if config.ENV_MODE == EnvMode.LOCAL:` blocks.

### 3. **Token Usage Components**
Custom tracking UI that upstream removed:
- `frontend/src/components/billing/token-usage-by-threads.tsx`
- `frontend/src/components/billing/token-usage-history.tsx`
- `frontend/src/components/thread/token-usage-display.tsx`

### 4. **Railway Deployment**
Custom auth/cookie handling for Railway platform:
- Modified Dockerfiles
- Supabase cookie persistence fixes
- SSR-safe auth handling

See `docs/workflows/UPSTREAM_SYNC_WORKFLOW.md` for complete list and sync procedures.

## Common Patterns

### Adding a New Tool

1. Create file in `backend/core/tools/my_tool.py`
2. Inherit from `Tool` or `SandboxToolsBase` (for sandbox execution)
3. Decorate methods with `@openapi_schema`
4. Register in tool registry or agent configuration

### Frontend Data Fetching

Use TanStack Query hooks from `frontend/src/hooks/react-query/`:
```typescript
const { data, isLoading } = useAgents();
const mutation = useCreateAgent();
```

### Type Safety

- Backend: Python type hints throughout
- Frontend: TypeScript strict mode enabled
- Database types: Generated from Supabase schema

### Error Handling

- Backend: Custom `LLMError` exceptions, structured logging
- Frontend: Error boundaries, toast notifications
- Tools: Return `ToolResult` with success/failure

## Testing

Backend tests use pytest with async support:
```python
@pytest.mark.asyncio
async def test_thread_creation():
    manager = ThreadManager()
    thread_id = await manager.create_thread()
    assert thread_id
```

## Environment Modes

System supports three modes (`backend/core/utils/config.py`):
- `LOCAL` - Self-hosted without cloud services
- `STAGING` - Pre-production environment
- `PRODUCTION` - Full cloud deployment

Use `config.ENV_MODE` to check mode. LOCAL mode preserves billing and auth customizations.

## Database

Supabase (PostgreSQL) schema includes:
- `threads` - Conversation threads
- `messages` - Thread messages with metadata
- `agents` - Agent configurations
- `tool_calls` - Tool execution history
- `agent_kb_assignments` - Knowledge base assignments

Access via `DBConnection()` async context.

## Performance Optimizations

- **Prompt Caching**: Anthropic caching applied via `apply_anthropic_caching_strategy()`
- **Context Compression**: Automatic message truncation when approaching limits
- **Token Estimation**: Fallback estimation on LLM failures (`_estimate_token_usage()`)
- **Streaming**: SSE streaming for real-time responses

## Upstream Sync

When syncing with https://github.com/kortix-ai/suna.git:

1. Follow `docs/workflows/UPSTREAM_SYNC_WORKFLOW.md` precisely
2. **Never** auto-merge - always review changes manually
3. Preserve all customizations listed above
4. Test billing, auth, and 302.AI model after sync
5. Update workflow doc with sync date

Last sync: **2025-10-04**

## Key Files to Understand

- `backend/core/agentpress/thread_manager.py` - Orchestrates all agent interactions
- `backend/core/agentpress/response_processor.py` - Handles LLM streaming and tool calls
- `backend/core/ai_models/registry.py` - Model definitions (includes 302.AI)
- `frontend/src/components/thread/chat-input/chat-input.tsx` - Main chat interface
- `docs/workflows/UPSTREAM_SYNC_WORKFLOW.md` - Critical sync procedures
