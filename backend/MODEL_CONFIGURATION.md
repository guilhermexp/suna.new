# LLM Model Configuration

## Overview

The Suna platform automatically configures available LLM models based on which API keys are present in your environment variables. This ensures that only models with valid credentials are enabled, preventing runtime errors.

## How It Works

1. **Automatic Detection**: On startup, the system checks for API keys in environment variables
2. **Dynamic Enabling**: Only models from providers with valid API keys are enabled
3. **Smart Recommendations**: The system automatically selects the best available model as "recommended"

## Supported Providers

| Provider | Environment Variable | Models |
|----------|---------------------|---------|
| OpenAI | `OPENAI_API_KEY` | GPT-5 Codex, GPT-5 Mini, GPT-5 Nano |
| Anthropic | `ANTHROPIC_API_KEY` | Claude Sonnet 4, Claude 3.7 Sonnet |
| Google | `GEMINI_API_KEY` or `GOOGLE_API_KEY` | Gemini 2.5 Pro |
| xAI | `XAI_API_KEY` | Grok 4 Fast, Grok Code Fast 1 |
| OpenRouter | `OPENROUTER_API_KEY` | Various models including Kimi K2 |
| Groq | `GROQ_API_KEY` | Fast inference models |

## Configuration Priority

The system follows this priority order when selecting the default recommended model:

1. OpenAI (GPT-5 Mini - free tier)
2. Google (Gemini 2.5 Pro)
3. xAI (Grok 4 Fast)
4. Anthropic (Claude Sonnet 4)
5. MoonshotAI (Kimi K2 via OpenRouter)

## Adding API Keys

### Option 1: Environment File (Recommended for Development)

Add your API keys to `backend/.env`:

```bash
# OpenAI
OPENAI_API_KEY=sk-...

# Google
GEMINI_API_KEY=AIza...

# xAI
XAI_API_KEY=xai-...

# OpenRouter
OPENROUTER_API_KEY=sk-or-v1-...

# Groq
GROQ_API_KEY=gsk_...

# Anthropic (if you have access)
ANTHROPIC_API_KEY=sk-ant-...
```

### Option 2: System Environment Variables

Export the variables in your shell:

```bash
export OPENAI_API_KEY="sk-..."
export GEMINI_API_KEY="AIza..."
```

## Troubleshooting

### Models Not Appearing

If expected models aren't showing up:

1. **Check API Keys**: Ensure the environment variables are set correctly
2. **Rebuild Docker**: If using Docker, rebuild to pick up new env vars:
   ```bash
   docker-compose build --no-cache backend worker
   docker-compose up -d
   ```
3. **Check Logs**: The backend logs will show which providers are enabled:
   ```bash
   docker logs suna-backend-1 | grep "LLM Provider Configuration"
   ```

### Wrong Default Model

The system automatically selects the best available model. To override:

1. Ensure your preferred provider's API key is set
2. The system prioritizes free-tier models for better accessibility

### After Adding New API Keys

When you add new API keys:

1. Restart the backend services
2. Clear browser cache if models don't appear immediately
3. The new models will be automatically detected and enabled

## Security Notes

- Never commit API keys to version control
- Keep your `.env` file in `.gitignore`
- Use environment-specific keys for production deployments
- Rotate API keys regularly for security

## For Production Deployment

In production, set API keys through your hosting platform's environment variable management:

- **Docker**: Use `docker-compose.yml` environment section or `.env` file
- **Kubernetes**: Use Secrets or ConfigMaps
- **Cloud Platforms**: Use their respective secret management services (AWS Secrets Manager, GCP Secret Manager, etc.)