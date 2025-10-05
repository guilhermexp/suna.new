# Documentação de Análise

Esta pasta contém documentos de análise e debug do projeto Suna.

## Arquivos de Análise

### 📊 Análises de Sistema

- **[ANALISE_TOOLS_AGENTE.md](./ANALISE_TOOLS_AGENTE.md)**
  - Análise detalhada do sistema de tools/agentes
  - Identificação de problemas e oportunidades de melhoria
  - Arquitetura e fluxos de dados

- **[UPGRADE_PAGES_ANALYSIS.md](./UPGRADE_PAGES_ANALYSIS.md)**
  - Análise completa das páginas de upgrade/billing
  - Avaliação de riscos para remoção em self-hosting
  - Plano de implementação faseado para remoções seguras

### 🐛 Relatórios de Debug

- **[AUTHENTICATION_DEBUG_REPORT.md](./AUTHENTICATION_DEBUG_REPORT.md)**
  - Relatório detalhado de problemas de autenticação
  - Análise de fluxos e falhas encontradas
  - Recomendações para correção

### 📚 Documentação Principal

- **[SELF-HOSTING.md](./SELF-HOSTING.md)**
  - Guia completo para self-hosting do Suna
  - Configuração e implantação local

## Organização

```
docs/
├── README.md                          # Este arquivo
├── ANALISE_TOOLS_AGENTE.md            # Análise de sistema de agentes
├── UPGRADE_PAGES_ANALYSIS.md         # Análise de páginas de upgrade
├── AUTHENTICATION_DEBUG_REPORT.md    # Relatório de debug de autenticação
├── SELF-HOSTING.md                   # Guia de self-hosting
└── images/                           # Imagens e diagramas
```

## Como Contribuir

1. Para novas análises, siga o padrão de nomenclatura:
   - `ANALISE_[sistema].md` para análises de componentes
   - `DEBUG_[problema].md` para relatórios de debug
   - `[FEATURE]_ANALYSIS.md` para análises em inglês

2. Inclua data da análise no documento
3. Use marcações claras para indicar risco e complexidade
4. Forneça recomendações acionáveis

## Legado

Estes documentos representam análises realizadas durante o desenvolvimento do projeto e servem como referência para futuras melhorias e manutenção.

---

**Atualizado**: 4 de Outubro de 2024  
**Versão**: v1.0.0
