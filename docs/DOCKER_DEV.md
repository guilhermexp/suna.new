# Docker Development with Hot Reload

Este guia mostra como rodar o Suna em Docker com **hot reload** habilitado para desenvolvimento.

## 🚀 Quick Start

```bash
# Iniciar todos os serviços com hot reload
./dev.sh up

# Ou usando docker compose diretamente
docker compose -f docker-compose.dev.yaml up --build
```

Acesse:
- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **Redis**: localhost:6379

## 📁 Arquivos de Configuração

### Desenvolvimento (Hot Reload)
- `docker-compose.dev.yaml` - Compose para desenvolvimento
- `backend/Dockerfile.dev` - Backend com uvicorn --reload
- `frontend/Dockerfile.dev` - Frontend com npm run dev

### Produção
- `docker-compose.yaml` - Compose para produção
- `backend/Dockerfile` - Backend com gunicorn
- `frontend/Dockerfile` - Frontend com build otimizado

## 🔥 Hot Reload

### Como Funciona

**Backend:**
- Usa `uvicorn --reload` em vez de gunicorn
- Volume mount: `./backend:/app`
- Mudanças em `.py` são detectadas automaticamente
- Worker Dramatiq também tem hot reload

**Frontend:**
- Usa `npm run dev` com Turbopack
- Volume mount: `./frontend:/app`
- Exclui `node_modules` e `.next` (usa do container)
- Mudanças em componentes React são refletidas instantaneamente

## 📝 Comandos Úteis

### Usando o script helper

```bash
# Iniciar tudo
./dev.sh up

# Parar tudo
./dev.sh down

# Logs de todos os serviços
./dev.sh logs

# Logs de um serviço específico
./dev.sh logs backend
./dev.sh logs frontend
./dev.sh logs worker

# Apenas backend (API + Worker + Redis)
./dev.sh backend

# Apenas frontend
./dev.sh frontend

# Rebuild completo (sem cache)
./dev.sh rebuild

# Limpar tudo (containers, volumes, orphans)
./dev.sh clean

# Shell no container
./dev.sh shell-backend
./dev.sh shell-frontend

# Restart
./dev.sh restart
```

### Usando docker compose diretamente

```bash
# Iniciar
docker compose -f docker-compose.dev.yaml up --build

# Parar
docker compose -f docker-compose.dev.yaml down

# Logs
docker compose -f docker-compose.dev.yaml logs -f

# Rebuild
docker compose -f docker-compose.dev.yaml build --no-cache

# Serviços específicos
docker compose -f docker-compose.dev.yaml up backend redis worker
docker compose -f docker-compose.dev.yaml up frontend
```

## ⚙️ Variáveis de Ambiente

Certifique-se de ter os arquivos `.env` configurados:

```bash
# Backend
cp backend/.env.example backend/.env
# Edite backend/.env com suas configurações

# Frontend
cp frontend/.env.local.example frontend/.env.local
# Edite frontend/.env.local com suas configurações
```

### Configurações importantes para desenvolvimento

**Backend (.env):**
```env
ENV_MODE=local
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_SSL=False

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Outras configurações...
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 🐛 Troubleshooting

### Hot reload não funciona no frontend

Se as mudanças não são detectadas, pode ser um problema de file watching no Docker. A configuração já inclui `WATCHPACK_POLLING=true`, mas se ainda não funcionar:

1. Rebuild o container:
   ```bash
   ./dev.sh rebuild
   ```

2. Ou use polling mode mais agressivo editando `docker-compose.dev.yaml`:
   ```yaml
   environment:
     - WATCHPACK_POLLING=true
     - CHOKIDAR_USEPOLLING=true
   ```

### Backend não recarrega

Verifique se o volume está montado corretamente:
```bash
docker compose -f docker-compose.dev.yaml exec backend ls -la /app
```

Se não ver seus arquivos Python, rebuild:
```bash
./dev.sh rebuild
```

### Portas já em uso

Se você já está rodando os serviços localmente, pare-os primeiro ou mude as portas em `docker-compose.dev.yaml`:

```yaml
ports:
  - "8001:8000"  # Backend na porta 8001 em vez de 8000
  - "3001:3000"  # Frontend na porta 3001 em vez de 3000
```

### Worker não processa tarefas

Verifique os logs do worker:
```bash
./dev.sh logs worker
```

Certifique-se que o Redis está rodando:
```bash
docker compose -f docker-compose.dev.yaml exec redis redis-cli ping
```

### Permissões no Linux

Se estiver no Linux e tiver problemas de permissões com volumes:

```bash
# Opção 1: Usar seu UID/GID
docker compose -f docker-compose.dev.yaml run --user $(id -u):$(id -g) backend sh

# Opção 2: Ajustar permissões após criar arquivos
sudo chown -R $USER:$USER ./backend ./frontend
```

## 🔄 Diferenças: Dev vs Produção

| Aspecto | Desenvolvimento | Produção |
|---------|----------------|----------|
| Backend Server | uvicorn --reload | gunicorn (multi-worker) |
| Frontend | npm run dev | npm run build + node server.js |
| Volumes | Source code montado | Código copiado para image |
| Build Time | Rápido (usa cache) | Otimizado (multi-stage) |
| Image Size | Maior | Menor (standalone) |
| Hot Reload | ✅ Sim | ❌ Não |
| Workers | 2 processes, 2 threads | 7 workers optimizados |

## 💡 Dicas

1. **Use o script helper**: `./dev.sh` torna comandos mais simples
2. **Logs filtrados**: Use `./dev.sh logs backend` para focar em um serviço
3. **Rebuild seletivo**: Se mudar dependências, rebuild apenas aquele serviço:
   ```bash
   docker compose -f docker-compose.dev.yaml build backend
   ```
4. **Debug no container**:
   ```bash
   ./dev.sh shell-backend
   # Agora você está dentro do container
   uv run python
   >>> from core.utils import *
   ```

## 📚 Mais Informações

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Development Mode](https://nextjs.org/docs/api-reference/cli#development)
- [Uvicorn Reload](https://www.uvicorn.org/#command-line-options)
