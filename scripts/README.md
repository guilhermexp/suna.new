# 🛠️ Scripts - Suna Project

Este diretório contém todos os scripts utilitários do projeto organizados por categoria.

## 📁 Estrutura

```
scripts/
├── dev/                 # Scripts de desenvolvimento
│   ├── dev.sh          # Script principal de desenvolvimento local
│   └── ...
│
├── migrations/         # Scripts de migração e database
│   ├── add_column.sh   # Adiciona colunas ao database
│   ├── apply_migration.py  # Aplica migrações SQL
│   └── ...
│
├── tests/              # Scripts de teste e validação
│   ├── test_glm_anthropic.py
│   ├── test_model_integration.py
│   └── ...
│
├── setup.py           # Script de setup inicial do projeto
└── start.py           # Script para iniciar a aplicação

```

## 🚀 Scripts Principais

### Desenvolvimento

**`dev/dev.sh`**
```bash
./scripts/dev/dev.sh
```
Inicia o ambiente de desenvolvimento local com hot-reload.

### Setup

**`setup.py`**
```bash
python scripts/setup.py
```
Configura o ambiente inicial do projeto (dependências, env vars, etc).

**`start.py`**
```bash
python scripts/start.py
```
Inicia a aplicação em modo produção.

### Migrações

**`migrations/add_column.sh`**
```bash
./scripts/migrations/add_column.sh <table_name> <column_name> <column_type>
```
Adiciona uma nova coluna ao database.

**`migrations/apply_migration.py`**
```bash
python scripts/migrations/apply_migration.py <migration_file>
```
Aplica um arquivo de migração SQL ao database.

### Testes

**`tests/test_glm_anthropic.py`**
```bash
python scripts/tests/test_glm_anthropic.py
```
Testa integração com API Anthropic.

**`tests/test_model_integration.py`**
```bash
python scripts/tests/test_model_integration.py
```
Testa integração entre modelos.

---

## 📝 Como Adicionar Novos Scripts

1. **Identifique a categoria:**
   - `dev/` - Scripts de desenvolvimento
   - `migrations/` - Scripts de database/migração
   - `tests/` - Scripts de teste
   - Root - Scripts gerais de setup/start

2. **Crie o script no diretório apropriado**

3. **Torne executável (se for shell script):**
   ```bash
   chmod +x scripts/<categoria>/<seu-script>.sh
   ```

4. **Documente neste README**

---

## 🔗 Scripts Relacionados

Scripts relacionados a deploy e troubleshooting estão em:
- **`deploy-errors/scripts/`** - Scripts de validação de deploy
  - `pre-pr-check.sh` - Validações antes de PR
  - `smoke-test.sh` - Testes pós-deploy

---

**Última atualização:** 30 de Outubro de 2025
