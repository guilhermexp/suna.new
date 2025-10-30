# 📁 Estrutura do Projeto Suna

Documentação da estrutura de diretórios e organização do projeto.

## 🌳 Estrutura Geral

```
suna.new/
│
├── 📱 apps/                    # Aplicações relacionadas
│   └── mobile/                # App mobile (React Native)
│
├── ⚙️ backend/                 # Backend API (FastAPI + Python)
│   ├── agent/                 # Lógica de agentes
│   ├── api/                   # Rotas da API
│   ├── core/                  # Funcionalidades core
│   ├── mcp_service/           # Model Context Protocol
│   └── supabase/              # Migrations e config DB
│
├── 🎨 frontend/                # Frontend (Next.js 15 + React)
│   ├── public/                # Assets estáticos
│   ├── src/
│   │   ├── app/              # App Router do Next.js
│   │   ├── components/       # Componentes React
│   │   ├── hooks/            # Custom hooks
│   │   ├── lib/              # Utilidades e helpers
│   │   └── types/            # TypeScript types
│   └── package.json
│
├── 🛠️ scripts/                # Scripts utilitários
│   ├── dev/                  # Scripts de desenvolvimento
│   │   └── dev.sh
│   ├── migrations/           # Scripts de migração DB
│   │   ├── add_column.sh
│   │   └── apply_migration.py
│   ├── tests/                # Scripts de teste
│   │   ├── test_glm_anthropic.py
│   │   └── test_model_integration.py
│   ├── setup.py              # Setup inicial
│   └── start.py              # Start da aplicação
│
├── 🚀 deploy-errors/          # Documentação de deploy e troubleshooting
│   ├── scripts/
│   │   ├── pre-pr-check.sh   # Validação pré-PR
│   │   └── smoke-test.sh     # Testes pós-deploy
│   ├── INDEX.md              # Índice de navegação
│   ├── README.md             # Overview geral
│   ├── QUICK_TROUBLESHOOTING.md
│   ├── PR_CHECKLIST.md
│   ├── RAILWAY_API_PREFIX_FIX_2025_10_30.md
│   ├── RAILWAY_AUTH_FIX_REPORT.md
│   ├── RAILWAY_LOGIN_FIX.md
│   ├── RAILWAY_WORKER_FIX.md
│   ├── RAILWAY_DEPLOYMENT.md
│   ├── DEPLOYMENT_FIXES_REPORT.md
│   └── FRESH_DEPLOY_CONFIG.md
│
├── 📚 docs/                   # Documentação geral do projeto
│   ├── DOCKER_DEV.md
│   ├── DOCUMENT_MANAGEMENT_API.md
│   ├── SUNA_PROMPT_OPTIMIZED.md
│   ├── SUNA_PROMPT_REDUX.md
│   ├── PLANO_PAGINA_CONTROLE_FINANCEIRO.md
│   ├── PRD_GEMINI_IMAGE_MIGRATION.md
│   ├── REPLICACAO_CALENDAR_PROJECTS.md
│   ├── claude_bridge_guia_pt.md
│   └── knowledge-base-explained.md
│
├── 🤖 ai_specs/               # Especificações de features/AI
│   ├── calendar-page-implementation/
│   ├── finance-control-page/
│   ├── fix-projects-500/
│   ├── kb-document-preview/
│   ├── projects-kanban-board/
│   └── ui-components-enhancement/
│
├── 📦 sdk/                    # SDKs e bibliotecas
│
├── 🐳 Docker files
│   ├── Dockerfile.dev
│   ├── docker-compose.yaml
│   └── docker-compose.dev.yaml
│
├── ⚙️ Configuração
│   ├── .env.example
│   ├── .gitignore
│   ├── .mcp.json             # MCP config
│   ├── mise.toml
│   └── package-lock.json
│
└── 📄 Documentos raiz
    ├── README.md             # README principal
    ├── CONTRIBUTING.md       # Guia de contribuição
    ├── LICENSE               # Licença Apache 2.0
    └── PROJECT_STRUCTURE.md  # Este arquivo
```

---

## 📖 Guia de Navegação

### 🔧 Para Desenvolvedores

**Começar desenvolvimento:**
1. Ler: `README.md` - Overview do projeto
2. Setup: `scripts/setup.py` - Configurar ambiente
3. Dev: `scripts/dev/dev.sh` - Iniciar desenvolvimento local

**Antes de criar PR:**
```bash
./deploy-errors/scripts/pre-pr-check.sh
```

**Após deploy:**
```bash
./deploy-errors/scripts/smoke-test.sh
```

### 🚨 Troubleshooting

Problemas de deploy? Consulte:
1. `deploy-errors/INDEX.md` - Índice rápido
2. `deploy-errors/QUICK_TROUBLESHOOTING.md` - Diagnóstico rápido
3. `deploy-errors/README.md` - Overview completo

### 📚 Documentação

**Backend:**
- `backend/README.md` - Documentação do backend
- `docs/DOCUMENT_MANAGEMENT_API.md` - API de documentos

**Frontend:**
- `frontend/README.md` - Documentação do frontend
- `docs/REPLICACAO_CALENDAR_PROJECTS.md` - Arquitetura de features

**Specs de Features:**
- `ai_specs/<feature-name>/requirements.md` - Requisitos
- `ai_specs/<feature-name>/design.md` - Design
- `ai_specs/<feature-name>/tasks.md` - Tasks

### 🐳 Docker & Deploy

**Local:**
```bash
docker-compose -f docker-compose.dev.yaml up
```

**Produção (Railway):**
- Configuração: `deploy-errors/RAILWAY_DEPLOYMENT.md`
- Troubleshooting: `deploy-errors/QUICK_TROUBLESHOOTING.md`

---

## 📝 Convenções

### Nomenclatura de Branches

```
feat/<nome-feature>       # Nova funcionalidade
fix/<nome-bug>           # Correção de bug
refactor/<nome>          # Refatoração
docs/<nome>              # Documentação
chore/<nome>             # Tarefas de manutenção
```

### Estrutura de Commits

```
<tipo>: <descrição curta>

<descrição detalhada opcional>

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

### Organização de Arquivos

**Scripts:**
- Desenvolvimento → `scripts/dev/`
- Migrações → `scripts/migrations/`
- Testes → `scripts/tests/`
- Gerais → `scripts/` (root)

**Documentação:**
- Deploy/troubleshooting → `deploy-errors/`
- Geral → `docs/`
- Features/specs → `ai_specs/`

---

## 🔗 Links Úteis

- [Railway Dashboard](https://railway.app/project/ac7acd0f-9af5-4a0a-a7a3-093936e37e50)
- [Supabase Dashboard](https://supabase.com/dashboard/project/qupamuozvmiewijkvxws)
- [Frontend Production](https://frontend-production-410a.up.railway.app)
- [Backend Production](https://backend-production-bda1.up.railway.app)

---

**Última atualização:** 30 de Outubro de 2025
**Versão:** 2.0 - Estrutura reorganizada
