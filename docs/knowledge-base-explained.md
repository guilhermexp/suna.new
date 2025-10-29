# Knowledge Base - Documentação Completa

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Estrutura de Banco de Dados](#estrutura-de-banco-de-dados)
4. [Backend - API e Processamento](#backend---api-e-processamento)
5. [Frontend - Interface do Usuário](#frontend---interface-do-usuário)
6. [Fluxo de Dados Completo](#fluxo-de-dados-completo)
7. [Funcionalidades Principais](#funcionalidades-principais)
8. [Validação e Segurança](#validação-e-segurança)
9. [Integração com Agentes](#integração-com-agentes)

---

## Visão Geral

A **Knowledge Base** é um sistema de gerenciamento de documentos e arquivos que permite aos usuários organizar informações em pastas, fazer upload de diversos tipos de arquivos, e atribuir esse conhecimento a agentes de IA específicos. O sistema processa automaticamente os arquivos, gera resumos usando LLMs, e disponibiliza o conteúdo como contexto para os agentes.

### Características Principais:

- **Organização hierárquica**: Pastas e arquivos
- **Upload de múltiplos formatos**: TXT, PDF, DOCX, JSON, XML, CSV, Markdown, etc.
- **Processamento automático com LLM**: Geração de resumos inteligentes
- **Limite de armazenamento**: 50MB por usuário
- **Atribuição a agentes**: Controle granular de acesso por arquivo
- **Drag & Drop**: Interface moderna com suporte a arrastar e soltar
- **Preview de arquivos**: Visualização de conteúdo e metadados
- **Validação robusta**: Nomes de arquivo cross-platform seguros

---

## Arquitetura do Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │  Knowledge Base  │  │   Tree Manager   │  │    Modals    │ │
│  │      Page        │──│   (Drag & Drop)  │──│  & Dialogs   │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│           │                     │                     │         │
│           └─────────────────────┴─────────────────────┘         │
│                              │                                  │
│                    ┌─────────▼─────────┐                       │
│                    │   React Query     │                       │
│                    │   Hooks Layer     │                       │
│                    └─────────┬─────────┘                       │
└──────────────────────────────┼─────────────────────────────────┘
                               │
                      ┌────────▼────────┐
                      │   FastAPI REST  │
                      │   API Endpoints │
                      └────────┬────────┘
                               │
┌──────────────────────────────┼─────────────────────────────────┐
│                     BACKEND (Python)                            │
├──────────────────────────────┼─────────────────────────────────┤
│                              │                                  │
│  ┌───────────────┐  ┌────────▼─────────┐  ┌────────────────┐ │
│  │   Validation  │  │  Knowledge Base  │  │     File       │ │
│  │    Module     │◄─┤      API         │─►│  Processor     │ │
│  └───────────────┘  └──────────────────┘  └────────┬───────┘ │
│                              │                      │          │
│                              │                      │          │
│                    ┌─────────▼─────────┐   ┌────────▼──────┐ │
│                    │    Supabase       │   │  LLM Service  │ │
│                    │    Client         │   │   (Summary)   │ │
│                    └─────────┬─────────┘   └───────────────┘ │
└──────────────────────────────┼─────────────────────────────────┘
                               │
┌──────────────────────────────▼─────────────────────────────────┐
│                      STORAGE & DATABASE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐              ┌──────────────────────┐   │
│  │  PostgreSQL DB   │              │   Supabase Storage   │   │
│  │                  │              │   (S3-compatible)    │   │
│  │  - Folders       │              │                      │   │
│  │  - Entries       │              │  /knowledge-base/    │   │
│  │  - Assignments   │              │    /{folder}/        │   │
│  └──────────────────┘              │      /{entry}/       │   │
│                                    │        file.ext      │   │
│                                    └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estrutura de Banco de Dados

### 1. `knowledge_base_folders`

Armazena as pastas criadas pelos usuários.

```sql
CREATE TABLE knowledge_base_folders (
    folder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT kb_folders_name_not_empty CHECK (LENGTH(TRIM(name)) > 0)
);
```

**Campos:**
- `folder_id`: Identificador único da pasta
- `account_id`: Referência ao usuário/conta proprietária
- `name`: Nome da pasta (validado, máx 255 caracteres)
- `description`: Descrição opcional da pasta
- `created_at/updated_at`: Timestamps de auditoria

**Índices:**
- `idx_kb_folders_account_id` - Busca rápida por conta

---

### 2. `knowledge_base_entries`

Armazena os arquivos individuais dentro das pastas.

```sql
CREATE TABLE knowledge_base_entries (
    entry_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL REFERENCES knowledge_base_folders(folder_id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,  -- S3: knowledge-base/{folder_id}/{entry_id}/{filename}
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(255),
    
    summary TEXT NOT NULL,  -- Gerado por LLM
    usage_context VARCHAR(100) DEFAULT 'always',  -- 'always', 'on_request', 'contextual'
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT kb_entries_filename_not_empty CHECK (LENGTH(TRIM(filename)) > 0),
    CONSTRAINT kb_entries_summary_not_empty CHECK (LENGTH(TRIM(summary)) > 0),
    CONSTRAINT kb_entries_file_size_positive CHECK (file_size > 0)
);
```

**Campos principais:**
- `entry_id`: Identificador único do arquivo
- `folder_id`: Pasta onde está armazenado
- `filename`: Nome original do arquivo
- `file_path`: Caminho no storage S3
- `file_size`: Tamanho em bytes (usado para controle de quota)
- `mime_type`: Tipo MIME do arquivo
- `summary`: Resumo gerado automaticamente por LLM (200-300 palavras)
- `usage_context`: Quando usar este arquivo (sempre, sob demanda, contextual)
- `is_active`: Soft delete flag

**Índices:**
- `idx_kb_entries_folder_id` - Busca por pasta
- `idx_kb_entries_account_id` - Busca por conta

---

### 3. `agent_knowledge_entry_assignments`

Relacionamento entre agentes e arquivos da knowledge base.

```sql
CREATE TABLE agent_knowledge_entry_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agent_id UUID NOT NULL REFERENCES agents(agent_id) ON DELETE CASCADE,
    entry_id UUID NOT NULL REFERENCES knowledge_base_entries(entry_id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES basejump.accounts(id) ON DELETE CASCADE,
    
    enabled BOOLEAN DEFAULT TRUE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(agent_id, entry_id)
);
```

**Campos:**
- `assignment_id`: ID da atribuição
- `agent_id`: Agente que tem acesso
- `entry_id`: Arquivo acessível
- `enabled`: Flag para ativar/desativar acesso sem deletar
- Constraint `UNIQUE(agent_id, entry_id)` previne duplicatas

**Índices:**
- `idx_kb_entry_assignments_agent_id` - Busca rápida por agente
- `idx_kb_entry_assignments_entry_id` - Busca rápida por arquivo

---

### 4. Função: `get_agent_knowledge_base_context()`

Função PostgreSQL que retorna o contexto formatado para um agente.

```sql
CREATE OR REPLACE FUNCTION get_agent_knowledge_base_context(
    p_agent_id UUID,
    p_max_tokens INTEGER DEFAULT 4000
)
RETURNS TEXT
```

**Funcionamento:**
1. Busca todos os arquivos atribuídos ao agente (`agent_id`)
2. Filtra por `enabled = TRUE` e `is_active = TRUE`
3. Considera apenas `usage_context IN ('always', 'contextual')`
4. Estima tokens (≈4 caracteres por token)
5. Retorna texto formatado até o limite de tokens
6. Formato de saída:
   ```markdown
   # KNOWLEDGE BASE
   
   The following files are available in your knowledge base:
   
   ## {folder_name}/{filename}
   {summary}
   
   ## {folder_name}/{filename}
   {summary}
   ```

**Uso:** Injetado automaticamente no contexto de conversação dos agentes.

---

## Backend - API e Processamento

### Estrutura de Módulos

```
backend/core/knowledge_base/
├── __init__.py              # Module initialization
├── api.py                   # FastAPI endpoints (602 linhas)
├── file_processor.py        # File processing & LLM summary (365 linhas)
└── validation.py            # Name validation & sanitization (177 linhas)
```

---

### API Endpoints (`api.py`)

#### Constantes
```python
MAX_TOTAL_FILE_SIZE = 50 * 1024 * 1024  # 50MB total per user
```

#### Endpoints de Pastas

**GET `/knowledge-base/folders`**
- Retorna todas as pastas do usuário
- Inclui contagem de arquivos em cada pasta
- Response: `List[FolderResponse]`

**POST `/knowledge-base/folders`**
- Cria nova pasta
- Valida nome (caracteres ilegais, nomes reservados)
- Gera nome único se houver conflito (ex: "Docs" → "Docs 2")
- Body: `FolderRequest { name, description? }`

**PUT `/knowledge-base/folders/{folder_id}`**
- Atualiza nome e/ou descrição da pasta
- Verifica ownership
- Valida nome se fornecido
- Body: `UpdateFolderRequest { name?, description? }`

**DELETE `/knowledge-base/folders/{folder_id}`**
- Deleta pasta e todos os arquivos dentro
- Remove arquivos físicos do S3
- Cascade delete para entries e assignments
- Verifica ownership antes de deletar

---

#### Endpoints de Arquivos

**POST `/knowledge-base/folders/{folder_id}/upload`**
- Upload de arquivo para uma pasta
- Valida:
  - Ownership da pasta
  - Tamanho do arquivo individual
  - Limite total de 50MB por usuário
  - Tipo de arquivo suportado
- Gera nome único se houver conflito
- Processa arquivo e gera resumo LLM
- Armazena no S3: `knowledge-base/{folder_id}/{entry_id}/{filename}`
- Response: `EntryResponse`

**GET `/knowledge-base/folders/{folder_id}/entries`**
- Lista todos os arquivos de uma pasta
- Ordenado por `created_at DESC`
- Apenas arquivos ativos (`is_active = TRUE`)
- Response: `List[EntryResponse]`

**PUT `/knowledge-base/entries/{entry_id}`**
- Atualiza resumo de um arquivo
- Body: `UpdateEntryRequest { summary }`
- Verifica ownership
- Mantém histórico via `updated_at`

**DELETE `/knowledge-base/entries/{entry_id}`**
- Remove arquivo
- Deleta do S3
- Remove do banco de dados
- Remove assignments automaticamente (cascade)

**POST `/knowledge-base/files/{file_id}/move`**
- Move arquivo entre pastas (drag & drop)
- Valida ownership de ambas as pastas
- Atualiza `folder_id`
- Body: `FolderMoveRequest { target_folder_id }`

---

#### Endpoints de Atribuições (Agent Assignments)

**GET `/knowledge-base/agents/{agent_id}/assignments`**
- Retorna lista de `entry_ids` atribuídos ao agente
- Usado para sincronizar checkboxes na UI

**POST `/knowledge-base/agents/{agent_id}/assignments`**
- Atualiza atribuições do agente
- Recebe lista completa de `entry_ids`
- Implementa diff: adiciona novos, remove antigos
- Body: `AgentAssignmentRequest { entry_ids: List[str] }`
- Transação atômica para consistência

---

### File Processor (`file_processor.py`)

#### Classe `FileProcessor`

**Constantes:**
```python
SUPPORTED_EXTENSIONS = {'.txt', '.pdf', '.docx'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
```

**Nota:** O sistema também aceita arquivos text-based (JSON, XML, CSV, Markdown, etc.) mesmo que não estejam nas extensões suportadas, usando detecção de encoding.

---

#### Método: `process_file()`

Fluxo completo de processamento:

```python
async def process_file(
    account_id: str,
    folder_id: str,
    file_content: bytes,
    filename: str,
    mime_type: str
) -> Dict[str, Any]
```

**Etapas:**

1. **Validação de tamanho**
   ```python
   if len(file_content) > self.MAX_FILE_SIZE:
       raise ValueError(f"File too large: {len(file_content)} bytes")
   ```

2. **Detecção de tipo de arquivo**
   - Verifica `mime_type` (text/*, application/json, etc.)
   - Usa `chardet` para detectar encoding
   - Analisa ratio de caracteres imprimíveis
   - Determina se é texto ou binário

3. **Sanitização do nome**
   ```python
   sanitized_filename = self.sanitize_filename(filename)
   # Remove emojis, caracteres especiais, normaliza espaços
   ```

4. **Upload para S3**
   ```python
   s3_path = f"knowledge-base/{folder_id}/{entry_id}/{sanitized_filename}"
   await client.storage.from_('file-uploads').upload(s3_path, file_content)
   ```

5. **Extração de conteúdo**
   - `.txt`, `.json`, `.xml`, `.csv`, `.md`: Decodifica com charset detection
   - `.pdf`: Usa `PyPDF2` para extrair texto de todas as páginas
   - `.docx`: Usa `python-docx` para extrair parágrafos
   - Outros: Tenta decodificar como texto, fallback para placeholder

6. **Geração de resumo LLM**
   ```python
   summary = await self._generate_summary(content, filename)
   ```

7. **Salvar no banco de dados**
   ```python
   entry_data = {
       'entry_id': entry_id,
       'folder_id': folder_id,
       'account_id': account_id,
       'filename': filename,
       'file_path': s3_path,
       'file_size': len(file_content),
       'mime_type': mime_type,
       'summary': summary,
       'is_active': True
   }
   await client.table('knowledge_base_entries').insert(entry_data).execute()
   ```

---

#### Método: `_generate_summary()`

Sistema de geração de resumo com fallback inteligente:

**Modelos em ordem de prioridade:**
1. `google/gemini-2.5-flash-lite` (1M tokens context)
2. `openrouter/google/gemini-2.5-flash-lite` (1M tokens - fallback)
3. `gpt-5-mini` (400K tokens - fallback final)

**Estratégia de Chunking Inteligente:**

Se o conteúdo exceder o limite de tokens:

```python
def _smart_chunk_content(self, content: str, max_chars: int) -> str:
    quarter = max_chars // 4
    
    # Sempre inclui início (mais importante)
    beginning = content[:quarter * 2]
    
    # Inclui final (conclusão/resumo)
    ending = content[-quarter:]
    
    # Busca seções importantes no meio:
    # - Headers (texto em maiúsculas)
    # - Listas (•, -, *, 1., 2.)
    # - Palavras-chave (summary, conclusion, important, key, main)
    # - Linhas curtas (< 100 chars, geralmente importantes)
    
    return f"{beginning}\n\n[KEY SECTIONS]\n{middle_section}\n\n[ENDING]\n{ending}"
```

**Prompt para LLM:**
```
Analyze this file and create a concise, actionable summary for an AI agent's knowledge base.

File: {filename}
Content: {processed_content}

Generate a 2-3 sentence summary that captures:
1. What this file contains
2. Key information or purpose  
3. When this knowledge would be useful

Keep it under 200 words and make it actionable for context injection.
```

**Fallback Inteligente:**

Se todos os LLMs falharem, gera resumo baseado em análise de conteúdo:

```python
def _create_fallback_summary(self, content: str, filename: str) -> str:
    # Detecta tipo de conteúdo pela extensão
    # Analisa primeiras 2000 caracteres
    # Conta linhas não vazias
    # Retorna: "This {content_type} '{filename}' contains X characters 
    #           across Y lines. Preview: {first_200_chars}..."
```

---

### Validation Module (`validation.py`)

#### Classe `FileNameValidator`

Sistema robusto de validação cross-platform.

**Caracteres Ilegais:**
```python
ILLEGAL_CHARS = r'[<>:"/\\|?*\x00-\x1f]'
# Windows + caracteres de controle
```

**Nomes Reservados (Windows):**
```python
RESERVED_NAMES = {
    'CON', 'PRN', 'AUX', 'NUL',
    'COM1', 'COM2', ..., 'COM9',
    'LPT1', 'LPT2', ..., 'LPT9'
}
```

---

#### Método: `validate_name()`

```python
@classmethod
def validate_name(cls, name: str, item_type: str = "file") -> Tuple[bool, Optional[str]]:
```

**Validações realizadas:**

1. **Nome vazio ou apenas espaços**
   ```python
   if not name or not name.strip():
       return False, f"{item_type} name cannot be empty"
   ```

2. **Comprimento máximo**
   - 255 caracteres Unicode
   - 200 bytes quando codificado em UTF-8

3. **Caracteres ilegais**
   - Detecta `< > : " / \ | ? *` e caracteres de controle
   - Retorna lista de caracteres problemáticos

4. **Pontos e espaços nas extremidades**
   ```python
   if name.startswith('.') or name.endswith('.'):
       return False, "Cannot start or end with dots"
   ```

5. **Nomes reservados**
   - Verifica se o base name (antes da extensão) está em `RESERVED_NAMES`
   - Case-insensitive

6. **Nomes apenas com pontos**
   ```python
   if all(c == '.' for c in name):
       return False, "Cannot consist only of dots"
   ```

---

#### Método: `sanitize_name()`

Limpa o nome automaticamente:

```python
@classmethod
def sanitize_name(cls, name: str) -> str:
    # 1. Remove espaços nas extremidades
    name = name.strip()
    
    # 2. Remove caracteres ilegais
    name = re.sub(cls.ILLEGAL_CHARS, '', name)
    
    # 3. Remove pontos/espaços nas extremidades
    name = name.strip('. ')
    
    # 4. Normaliza Unicode (NFKC)
    name = unicodedata.normalize('NFKC', name)
    
    # 5. Adiciona underscore se for nome reservado
    if base_name in cls.RESERVED_NAMES:
        name = f"_{name}"
    
    # 6. Limita a 200 bytes UTF-8
    if len(name.encode('utf-8')) > 200:
        name = name[:200]
    
    # 7. Fallback para "Untitled"
    return name or "Untitled"
```

---

#### Método: `generate_unique_name()`

Gera nomes únicos estilo macOS:

```python
@classmethod
def generate_unique_name(cls, base_name: str, existing_names: list, item_type: str) -> str:
```

**Exemplos:**
- `"document.txt"` → já existe → `"document 2.txt"`
- `"document 2.txt"` → já existe → `"document 3.txt"`
- `"My Folder"` → já existe → `"My Folder 2"`

**Algoritmo:**
1. Sanitiza o nome base
2. Se único, retorna imediatamente
3. Separa nome e extensão (para arquivos)
4. Incrementa contador (2, 3, 4, ...)
5. Testa cada variação até encontrar nome único
6. Safety break em 1000 iterações (adiciona UUID)

**Comparação case-insensitive:**
```python
if base_name.lower() not in [name.lower() for name in existing_names]:
```

---

## Frontend - Interface do Usuário

### Estrutura de Componentes

```
frontend/src/components/knowledge-base/
├── knowledge-base-page.tsx           # Page wrapper
├── knowledge-base-header.tsx         # Header component
├── knowledge-base-manager.tsx        # Main manager (1169 linhas)
├── shared-kb-tree.tsx                # Tree item & drag overlay
├── unified-kb-entry-modal.tsx        # Create/upload modal
├── kb-file-preview-modal.tsx         # File preview
├── edit-summary-modal.tsx            # Edit summary
└── kb-delete-confirm-dialog.tsx      # Delete confirmation
```

---

### Component: `KnowledgeBasePage`

Componente raiz da página.

```tsx
export function KnowledgeBasePage() {
    return (
        <div className="min-h-screen">
            <div className="container mx-auto max-w-7xl px-4 py-8">
                <KnowledgeBasePageHeader />
            </div>
            <div className="container mx-auto max-w-7xl px-4 py-2">
                <KnowledgeBaseManager
                    showHeader={true}
                    showRecentFiles={true}
                    enableAssignments={false}  // Modo standalone
                />
            </div>
        </div>
    );
}
```

---

### Component: `KnowledgeBaseManager`

Componente principal com 1169 linhas.

#### Props Interface

```typescript
interface KnowledgeBaseManagerProps {
    // Agent context (opcional)
    agentId?: string;
    agentName?: string;
    
    // UI customization
    showHeader?: boolean;
    headerTitle?: string;
    headerDescription?: string;
    showRecentFiles?: boolean;
    emptyStateMessage?: string;
    emptyStateContent?: React.ReactNode;
    maxHeight?: string;
    
    // Modo de atribuição
    enableAssignments?: boolean;  // true quando usado na página de agente
}
```

**Modos de operação:**

1. **Standalone Mode** (`enableAssignments: false`)
   - Página `/knowledge` principal
   - CRUD completo de pastas e arquivos
   - Sem checkboxes de seleção

2. **Assignment Mode** (`enableAssignments: true`)
   - Usada dentro da configuração do agente
   - Checkboxes para selecionar arquivos
   - Auto-expande todas as pastas
   - Auto-carrega todos os entries
   - Salva assignments automaticamente

---

#### State Management

```typescript
// Tree data structure
const [treeData, setTreeData] = useState<TreeItem[]>([]);

interface TreeItem {
    id: string;
    type: 'folder' | 'file';
    name: string;
    parentId?: string;
    data?: Folder | Entry;
    children?: TreeItem[];
    expanded?: boolean;
}

// Folder entries cache
const [folderEntries, setFolderEntries] = useState<{ [folderId: string]: Entry[] }>({});

// Loading states
const [loadingFolders, setLoadingFolders] = useState<{ [folderId: string]: boolean }>({});
const [movingFiles, setMovingFiles] = useState<{ [fileId: string]: boolean }>({});

// Edit mode
const [editingFolder, setEditingFolder] = useState<string | null>(null);
const [editingName, setEditingName] = useState('');
const [validationError, setValidationError] = useState<string | null>(null);

// Drag & Drop
const [activeId, setActiveId] = useState<string | null>(null);

// Assignment mode (quando enableAssignments: true)
const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
const [assignmentsLoading, setAssignmentsLoading] = useState(false);

// Upload progress tracking
const [uploadStatus, setUploadStatus] = useState<{
    [folderId: string]: {
        isUploading: boolean;
        progress: number;
        currentFile?: string;
        totalFiles?: number;
        completedFiles?: number;
    };
}>({});
```

---

#### React Query Hooks

```typescript
import { useKnowledgeFolders } from '@/hooks/react-query/knowledge-base/use-folders';

const { 
    folders,           // List<Folder>
    recentFiles,       // List<Entry> (últimos 10)
    loading,           // boolean
    refetch            // function
} = useKnowledgeFolders();
```

---

#### Tree Building Effect

```typescript
React.useEffect(() => {
    const buildTree = () => {
        const tree: TreeItem[] = folders.map(folder => {
            const existingFolder = treeData.find(item => item.id === folder.folder_id);
            
            // Auto-expand em modo assignment
            const isExpanded = enableAssignments 
                ? true 
                : (existingFolder?.expanded || false);

            return {
                id: folder.folder_id,
                type: 'folder',
                name: folder.name,
                data: folder,
                children: folderEntries[folder.folder_id]?.map(entry => ({
                    id: entry.entry_id,
                    type: 'file',
                    name: entry.filename,
                    parentId: folder.folder_id,
                    data: entry,
                })) || [],
                expanded: isExpanded,
            };
        });
        setTreeData(tree);
    };

    buildTree();
}, [folders, folderEntries, enableAssignments]);
```

---

#### Assignment Mode Effects

```typescript
// Auto-load assignments quando em modo assignment
React.useEffect(() => {
    if (enableAssignments && agentId) {
        loadAssignments();
        
        // Auto-fetch todos os folder entries
        if (!foldersLoading && folders.length > 0) {
            folders.forEach(folder => {
                if (!folderEntries[folder.folder_id]) {
                    fetchFolderEntries(folder.folder_id);
                }
            });
        }
    }
}, [enableAssignments, agentId, folders, foldersLoading]);

// Load assignments from API
const loadAssignments = async () => {
    const response = await fetch(
        `${API_URL}/knowledge-base/agents/${agentId}/assignments`,
        { headers: { 'Authorization': `Bearer ${token}` } }
    );
    const data = await response.json();
    setSelectedEntries(new Set(data.entry_ids));
};
```

---

#### Drag & Drop System

Usa `@dnd-kit` para implementar arrastar e soltar.

**Sensors:**
```typescript
const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
    })
);
```

**Drag Start:**
```typescript
const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
};
```

**Drag End:**
```typescript
const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
        setActiveId(null);
        return;
    }
    
    // Encontra item sendo arrastado
    const draggedItem = findItemById(active.id as string);
    const targetItem = findItemById(over.id as string);
    
    // Só permite arrastar arquivos para pastas
    if (draggedItem?.type === 'file' && targetItem?.type === 'folder') {
        await moveFile(draggedItem.id, targetItem.id);
    }
    
    setActiveId(null);
};
```

**Move File API:**
```typescript
const moveFile = async (fileId: string, targetFolderId: string) => {
    setMovingFiles(prev => ({ ...prev, [fileId]: true }));
    
    try {
        const response = await fetch(
            `${API_URL}/knowledge-base/files/${fileId}/move`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ target_folder_id: targetFolderId })
            }
        );
        
        if (response.ok) {
            toast.success('File moved successfully');
            await refetchFolders();
            await fetchFolderEntries(targetFolderId);
        }
    } finally {
        setMovingFiles(prev => ({ ...prev, [fileId]: false }));
    }
};
```

---

#### Edit Folder Name (Inline)

**Start Edit:**
```typescript
const handleStartEdit = (folderId: string, currentName: string) => {
    setEditingFolder(folderId);
    setEditingName(currentName);
    setValidationError(null);
    
    // Focus e select text
    setTimeout(() => {
        editInputRef.current?.focus();
        editInputRef.current?.select();
    }, 0);
};
```

**Validate on Change:**
```typescript
const handleEditChange = (newName: string) => {
    setEditingName(newName);
    
    // Nomes existentes (exceto o atual)
    const existingNames = folders
        .map(f => f.name)
        .filter(name => name !== currentFolder.name);
    
    // Validação
    const nameValidation = FileNameValidator.validateName(newName, 'folder');
    const hasConflict = nameValidation.isValid && 
        FileNameValidator.checkNameConflict(newName, existingNames);
    
    const errorMessage = hasConflict
        ? 'A folder with this name already exists'
        : FileNameValidator.getFriendlyErrorMessage(newName, 'folder');
    
    setValidationError(isValid ? null : errorMessage);
};
```

**Finish Edit:**
```typescript
const handleFinishEdit = async () => {
    if (!editingFolder || !editingName.trim()) return;
    
    const trimmedName = editingName.trim();
    
    // Validação final
    if (!isValid) {
        toast.error(errorMessage);
        return;
    }
    
    // Update via Supabase direct
    const { error } = await supabase
        .from('knowledge_base_folders')
        .update({ name: trimmedName })
        .eq('folder_id', editingFolder);
    
    if (error) {
        toast.error('Failed to rename folder');
    } else {
        toast.success('Folder renamed successfully');
        refetchFolders();
    }
    
    // Clear edit state
    setEditingFolder(null);
    setEditingName('');
    setValidationError(null);
};
```

**Keyboard Support:**
```typescript
const handleEditKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        handleFinishEdit();
    } else if (e.key === 'Escape') {
        // Cancel edit
        setEditingFolder(null);
        setEditingName('');
        setValidationError(null);
    }
};
```

---

#### File Upload with Progress

**Upload Handler:**
```typescript
const handleUpload = async (folderId: string, files: FileList) => {
    const fileArray = Array.from(files);
    
    setUploadStatus(prev => ({
        ...prev,
        [folderId]: {
            isUploading: true,
            progress: 0,
            totalFiles: fileArray.length,
            completedFiles: 0
        }
    }));
    
    for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        
        setUploadStatus(prev => ({
            ...prev,
            [folderId]: {
                ...prev[folderId],
                currentFile: file.name,
                progress: Math.round(((i + 1) / fileArray.length) * 100)
            }
        }));
        
        const formData = new FormData();
        formData.append('file', file);
        
        await fetch(
            `${API_URL}/knowledge-base/folders/${folderId}/upload`,
            {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            }
        );
        
        setUploadStatus(prev => ({
            ...prev,
            [folderId]: {
                ...prev[folderId],
                completedFiles: i + 1
            }
        }));
    }
    
    // Cleanup
    setUploadStatus(prev => ({
        ...prev,
        [folderId]: {
            isUploading: false,
            progress: 100
        }
    }));
    
    toast.success(`${fileArray.length} file(s) uploaded successfully`);
    await fetchFolderEntries(folderId);
};
```

---

#### Assignment Functions (Checkbox Selection)

**Get Folder Selection State:**
```typescript
const getFolderSelectionState = (folderId: string) => {
    const folder = treeData.find(f => f.id === folderId);
    if (!folder?.children || folder.children.length === 0) {
        return { selected: false, indeterminate: false };
    }
    
    const folderEntryIds = folder.children.map(child => child.id);
    const selectedCount = folderEntryIds.filter(id => selectedEntries.has(id)).length;
    
    if (selectedCount === 0) {
        return { selected: false, indeterminate: false };
    } else if (selectedCount === folderEntryIds.length) {
        return { selected: true, indeterminate: false };
    } else {
        return { selected: false, indeterminate: true };  // Partial selection
    }
};
```

**Toggle Entry:**
```typescript
const toggleEntrySelection = async (entryId: string) => {
    const newSelection = new Set(selectedEntries);
    
    if (newSelection.has(entryId)) {
        newSelection.delete(entryId);
    } else {
        newSelection.add(entryId);
    }
    
    setSelectedEntries(newSelection);
    await saveAssignments(newSelection);
};
```

**Toggle Folder (Select/Deselect All):**
```typescript
const toggleFolderSelection = async (folderId: string) => {
    const folder = treeData.find(f => f.id === folderId);
    if (!folder?.children) return;
    
    const folderEntryIds = folder.children.map(child => child.id);
    const allSelected = folderEntryIds.every(id => selectedEntries.has(id));
    
    const newSelection = new Set(selectedEntries);
    
    if (allSelected) {
        // Deselect all
        folderEntryIds.forEach(id => newSelection.delete(id));
    } else {
        // Select all
        folderEntryIds.forEach(id => newSelection.add(id));
    }
    
    setSelectedEntries(newSelection);
    await saveAssignments(newSelection);
};
```

**Save Assignments:**
```typescript
const saveAssignments = async (selectedSet: Set<string>) => {
    if (!agentId) return;
    
    try {
        await fetch(
            `${API_URL}/knowledge-base/agents/${agentId}/assignments`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ entry_ids: Array.from(selectedSet) })
            }
        );
        
        toast.success('Knowledge base access updated');
    } catch (error) {
        toast.error('Failed to save assignments');
    }
};
```

---

#### Render Tree

```tsx
<DndContext
    sensors={sensors}
    collisionDetection={closestCenter}
    onDragStart={handleDragStart}
    onDragEnd={handleDragEnd}
>
    <SortableContext
        items={treeData.map(item => item.id)}
        strategy={verticalListSortingStrategy}
    >
        {treeData.map(folder => (
            <div key={folder.id}>
                {/* Folder Row */}
                <div className="flex items-center gap-2">
                    {/* Expand/Collapse Icon */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExpand(folder.id)}
                    >
                        {folder.expanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                    </Button>
                    
                    {/* Checkbox (assignment mode) */}
                    {enableAssignments && (
                        <Checkbox
                            checked={getFolderSelectionState(folder.id).selected}
                            indeterminate={getFolderSelectionState(folder.id).indeterminate}
                            onCheckedChange={() => toggleFolderSelection(folder.id)}
                        />
                    )}
                    
                    <FolderIcon />
                    
                    {/* Folder Name (editable) */}
                    {editingFolder === folder.id ? (
                        <Input
                            ref={editInputRef}
                            value={editingName}
                            onChange={(e) => handleEditChange(e.target.value)}
                            onBlur={handleFinishEdit}
                            onKeyDown={handleEditKeyPress}
                        />
                    ) : (
                        <span onClick={() => handleStartEdit(folder.id, folder.name)}>
                            {folder.name}
                        </span>
                    )}
                    
                    {/* Actions Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <MoreVerticalIcon />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleRename(folder.id)}>
                                Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(folder.id)}>
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
                
                {/* Children (Files) */}
                {folder.expanded && (
                    <div className="ml-6">
                        {loadingFolders[folder.id] ? (
                            <Skeleton className="h-8 w-full" />
                        ) : (
                            folder.children?.map(file => (
                                <div key={file.id} className="flex items-center gap-2">
                                    {/* Checkbox (assignment mode) */}
                                    {enableAssignments && (
                                        <Checkbox
                                            checked={selectedEntries.has(file.id)}
                                            onCheckedChange={() => toggleEntrySelection(file.id)}
                                        />
                                    )}
                                    
                                    <FileIcon />
                                    <span onClick={() => handleFileSelect(file)}>
                                        {file.name}
                                    </span>
                                    
                                    {/* File Actions */}
                                    <DropdownMenu>
                                        <DropdownMenuItem onClick={() => handlePreview(file)}>
                                            Preview
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleEditSummary(file)}>
                                            Edit Summary
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDownload(file)}>
                                            Download
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleDelete(file)}>
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenu>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        ))}
    </SortableContext>
    
    {/* Drag Overlay */}
    <DragOverlay>
        {activeId ? <FileDragOverlay name={activeItem?.name} /> : null}
    </DragOverlay>
</DndContext>
```

---

## Fluxo de Dados Completo

### 1. Upload de Arquivo - Fluxo Detalhado

```
┌──────────────────────────────────────────────────────────────────┐
│                    USER UPLOADS FILE                             │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND: knowledge-base-manager.tsx                            │
│  - User selects folder                                           │
│  - Clicks upload button                                          │
│  - Selects file(s) from file picker                             │
│  - handleUpload() called                                         │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND: Create FormData                                       │
│  - formData.append('file', file)                                 │
│  - Track upload progress in state                                │
│  - Show progress indicator                                       │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼ POST /knowledge-base/folders/{id}/upload
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND: api.py - upload_file()                                 │
│  ✓ Verify JWT token                                             │
│  ✓ Check folder ownership                                       │
│  ✓ Check file size limit (individual)                           │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND: api.py - check_total_file_size_limit()                 │
│  - Query total size of user's files                             │
│  - Calculate: current_total + new_file_size                     │
│  - If > 50MB: raise HTTPException 413                           │
│  - Else: continue                                                │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND: validation.py - validate_file_name_unique()            │
│  - Get existing filenames in folder                             │
│  - If conflict: generate unique name                            │
│    Example: "doc.txt" → "doc 2.txt"                             │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND: file_processor.py - process_file()                     │
│  1. Validate file size again                                    │
│  2. Detect file type (mime + content analysis)                  │
│  3. Sanitize filename (remove emojis, special chars)            │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND: Upload to Supabase Storage (S3)                        │
│  - Generate entry_id (UUID)                                     │
│  - Path: knowledge-base/{folder_id}/{entry_id}/{filename}       │
│  - await client.storage.from_('file-uploads').upload()          │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND: file_processor.py - _extract_content()                 │
│  - .txt/.json/.xml/.csv: decode with chardet                    │
│  - .pdf: PyPDF2.PdfReader → extract_text()                      │
│  - .docx: docx.Document → paragraphs                            │
│  - Other: try decode as text, fallback to placeholder           │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND: file_processor.py - _generate_summary()                │
│  1. Estimate tokens (length / 4)                                │
│  2. Try models in order:                                        │
│     a) google/gemini-2.5-flash-lite (1M context)                │
│     b) openrouter/google/gemini-2.5-flash-lite                  │
│     c) gpt-5-mini (400K context)                                │
│  3. If content > context limit:                                 │
│     - Use _smart_chunk_content()                                │
│     - Include: beginning + key sections + ending                │
│  4. Call make_llm_api_call() with prompt                        │
│  5. If all fail: _create_fallback_summary()                     │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND: Save to Database                                       │
│  - Insert into knowledge_base_entries                           │
│  - Fields: entry_id, folder_id, account_id,                     │
│           filename, file_path, file_size,                       │
│           mime_type, summary, is_active                         │
│  - Timestamps: created_at, updated_at                           │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND: Return Response                                        │
│  - EntryResponse with entry_id, filename, summary, etc.         │
│  - HTTP 200 OK                                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND: Update UI                                             │
│  - Clear upload progress                                        │
│  - Show success toast                                           │
│  - Refresh folder entries                                       │
│  - File appears in tree view                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

### 2. Agent Assignment - Fluxo Detalhado

```
┌──────────────────────────────────────────────────────────────────┐
│  USER OPENS AGENT CONFIGURATION                                  │
│  - Navigates to /agents/{agent_id}                              │
│  - Clicks "Knowledge Base" tab                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND: Render KnowledgeBaseManager                           │
│  - Props: agentId, agentName                                    │
│  - enableAssignments: true                                      │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND: useEffect - Load Assignments                          │
│  - Detect: enableAssignments && agentId                         │
│  - Call: loadAssignments()                                      │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼ GET /knowledge-base/agents/{id}/assignments
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND: api.py - get_agent_assignments()                       │
│  - Verify JWT                                                   │
│  - Query agent_knowledge_entry_assignments                      │
│  - Filter: agent_id = {id} AND enabled = true                  │
│  - Return: { entry_ids: [uuid1, uuid2, ...] }                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND: setSelectedEntries(new Set(entry_ids))                │
│  - Update state with current assignments                        │
│  - Checkboxes reflect assigned files                            │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND: useEffect - Auto-Expand & Fetch                       │
│  - Auto-expand all folders (assignment mode)                    │
│  - For each folder: fetchFolderEntries(folder_id)               │
│  - Loads all files to show complete selection state             │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  USER TOGGLES CHECKBOX                                           │
│  - Can click file checkbox (individual)                         │
│  - Or folder checkbox (select/deselect all)                     │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND: toggleEntrySelection() or toggleFolderSelection()     │
│  - Update selectedEntries Set                                   │
│  - Add or remove entry_id                                       │
│  - Call: saveAssignments(newSelection)                          │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼ POST /knowledge-base/agents/{id}/assignments
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND: api.py - update_agent_assignments()                    │
│  - Receive: { entry_ids: [uuid1, uuid2, ...] }                 │
│  - Verify JWT and agent ownership                               │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND: Calculate Diff                                         │
│  - Get current assignments from DB                              │
│  - to_add = new_ids - current_ids                              │
│  - to_remove = current_ids - new_ids                           │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND: Apply Changes (Transaction)                            │
│  - DELETE FROM agent_knowledge_entry_assignments                │
│    WHERE entry_id IN to_remove                                  │
│  - INSERT INTO agent_knowledge_entry_assignments                │
│    VALUES (agent_id, entry_id, account_id, enabled=true)       │
│    FOR EACH entry_id IN to_add                                  │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND: Return Success                                         │
│  - { success: true, assigned_count: X }                         │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND: Show Toast                                            │
│  - toast.success('Knowledge base access updated')               │
│  - UI reflects new assignment state                             │
└──────────────────────────────────────────────────────────────────┘
```

---

### 3. Agent Conversation - Context Injection

```
┌──────────────────────────────────────────────────────────────────┐
│  USER SENDS MESSAGE TO AGENT                                     │
│  - Chat interface                                               │
│  - Message: "What's in our Q4 report?"                          │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND: Chat Handler                                           │
│  - Receive message                                              │
│  - Get agent_id from conversation                               │
│  - Build conversation context                                   │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND: Call get_agent_knowledge_base_context()                │
│  - PostgreSQL function                                          │
│  - Params: agent_id, max_tokens=4000                            │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  DATABASE: Execute Function                                      │
│  1. Query:                                                      │
│     SELECT filename, summary, folder_name                       │
│     FROM knowledge_base_entries kbe                             │
│     JOIN knowledge_base_folders kbf ON kbe.folder_id = ...     │
│     JOIN agent_knowledge_entry_assignments akea ON ...          │
│     WHERE akea.agent_id = {agent_id}                            │
│       AND akea.enabled = true                                   │
│       AND kbe.is_active = true                                  │
│       AND kbe.usage_context IN ('always', 'contextual')         │
│     ORDER BY kbe.created_at DESC                                │
│                                                                 │
│  2. Loop through entries:                                       │
│     - Estimate tokens (length / 4)                              │
│     - Stop if exceeds max_tokens                                │
│     - Append formatted entry to context                         │
│                                                                 │
│  3. Return formatted text:                                      │
│     # KNOWLEDGE BASE                                            │
│                                                                 │
│     The following files are available in your knowledge base:   │
│                                                                 │
│     ## Reports/Q4_Financial_Report.pdf                          │
│     This quarterly financial report contains revenue analysis,  │
│     expense breakdowns, and profit projections for Q4 2024...   │
│                                                                 │
│     ## Policies/HR_Handbook.docx                                │
│     Employee handbook covering company policies, benefits...    │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND: Build LLM Messages                                     │
│  [                                                              │
│    {                                                            │
│      "role": "system",                                          │
│      "content": "You are {agent_name}. {system_prompt}\n\n" +   │
│                 "{knowledge_base_context}"                      │
│    },                                                           │
│    {                                                            │
│      "role": "user",                                            │
│      "content": "What's in our Q4 report?"                      │
│    }                                                            │
│  ]                                                              │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  BACKEND: Call LLM API                                           │
│  - OpenAI / Anthropic / etc.                                    │
│  - Model has access to knowledge base summaries                 │
│  - Can reference file contents in response                      │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  LLM RESPONSE                                                    │
│  "Based on the Q4 Financial Report in the knowledge base,       │
│   our revenue for Q4 2024 shows a 15% increase compared to      │
│   Q3. The report indicates strong performance in product        │
│   sales and mentions upcoming expense projections..."           │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│  FRONTEND: Display Response                                      │
│  - Stream response to chat UI                                   │
│  - User sees agent referencing knowledge base                   │
└──────────────────────────────────────────────────────────────────┘
```

---

## Funcionalidades Principais

### 1. Gerenciamento de Pastas

**Criar Pasta:**
- Nome obrigatório (1-255 caracteres)
- Descrição opcional
- Validação cross-platform (remove caracteres ilegais)
- Nomes únicos (auto-incrementa se conflito: "Docs" → "Docs 2")

**Editar Pasta:**
- Inline editing (click no nome)
- Validação em tempo real
- Feedback visual de erros
- Suporte a teclado (Enter para salvar, Esc para cancelar)

**Deletar Pasta:**
- Confirmação obrigatória
- Remove todos os arquivos (cascade)
- Deleta arquivos físicos do S3
- Remove assignments de agentes

**Expandir/Recolher:**
- Click no chevron icon
- Lazy loading de entries (só carrega ao expandir)
- Estado persistido durante sessão
- Auto-expand em modo assignment

---

### 2. Gerenciamento de Arquivos

**Upload:**
- Single ou multiple files
- Progress tracking por pasta
- Limite: 50MB por arquivo
- Limite total: 50MB por usuário
- Formatos suportados:
  - Texto: .txt, .md, .log, .json, .xml, .csv, .yml, .yaml
  - Documentos: .pdf, .docx
  - Code files: detecta automaticamente files text-based
- Geração automática de resumo via LLM

**Preview:**
- Modal com informações:
  - Nome do arquivo
  - Tamanho
  - Tipo (MIME)
  - Data de upload
  - Resumo completo gerado
  - Botão de download
  - Botão de editar resumo

**Editar Resumo:**
- Modal dedicado
- Textarea para edição livre
- Validação: 1-1000 caracteres
- Salva via API
- Atualiza `updated_at`

**Download:**
- Gera URL assinada do S3
- Download direto do arquivo original
- Preserva nome original

**Mover (Drag & Drop):**
- Arrasta arquivo para outra pasta
- Visual feedback durante drag
- Drag overlay com nome do arquivo
- Atualiza `folder_id` no banco
- Refresh automático das pastas envolvidas

**Deletar:**
- Confirmação obrigatória
- Remove do S3
- Soft delete (ou hard delete conforme configuração)
- Remove assignments automaticamente

---

### 3. Sistema de Atribuições (Assignments)

**Interface de Seleção:**
- Checkboxes em cada arquivo
- Checkbox na pasta (select/deselect all)
- Estado indeterminado (alguns selecionados)
- Feedback visual de estado

**Sincronização:**
- Auto-save em cada mudança
- Optimistic UI updates
- Rollback em caso de erro
- Toast notifications

**Lógica de Atribuição:**
- Muitos-para-muitos: múltiplos agentes podem acessar mesmo arquivo
- Granular: por arquivo, não por pasta
- Ativação: flag `enabled` permite desativar sem deletar
- Auditoria: timestamp `assigned_at`

**Contexto do Agente:**
- Função `get_agent_knowledge_base_context()` retorna texto formatado
- Limite de tokens configurável (padrão 4000)
- Ordenação por `created_at DESC` (mais recentes primeiro)
- Filtragem por `usage_context` ('always', 'contextual')

---

### 4. Validação e Sanitização

**Caracteres Proibidos:**
- Windows: `< > : " / \ | ? *`
- Caracteres de controle: `\x00-\x1f`

**Nomes Reservados:**
- Windows: CON, PRN, AUX, NUL, COM1-9, LPT1-9

**Sanitização Automática:**
- Remove emojis
- Substitui espaços por underscores (em file paths S3)
- Remove caracteres ilegais
- Normaliza Unicode (NFKC)
- Limita comprimento (255 chars, 200 bytes UTF-8)

**Validação Frontend:**
- Validação em tempo real durante digitação
- Feedback visual inline
- Mensagens de erro descritivas
- Previne submissão de nomes inválidos

**Validação Backend:**
- Double-check de todas as validações
- Proteção contra bypass de validação client-side
- Geração automática de nomes únicos
- Sanitização forçada antes de salvar

---

### 5. Processamento de Arquivos com LLM

**Extração de Conteúdo:**
- **TXT/JSON/XML/CSV/etc**: Detecção de encoding com `chardet`, decode com fallback
- **PDF**: `PyPDF2.PdfReader` → extrai texto de todas as páginas
- **DOCX**: `python-docx` → extrai todos os parágrafos
- **Binários**: Placeholder descritivo

**Geração de Resumo:**

1. **Estimativa de Tokens**
   - Rough: 1 token ≈ 4 caracteres
   - Calcula se conteúdo cabe no contexto

2. **Estratégia de Modelos**
   - Tenta em ordem de prioridade
   - Fallback automático em caso de falha
   - Cada modelo tem limite de contexto conhecido

3. **Chunking Inteligente**
   - Se conteúdo > contexto: usa `_smart_chunk_content()`
   - Prioriza: início + seções-chave + final
   - Detecta: headers, listas, keywords importantes
   - Preserva estrutura semântica

4. **Prompt Otimizado**
   ```
   Analyze this file and create a concise, actionable summary 
   for an AI agent's knowledge base.
   
   File: {filename}
   Content: {content}
   
   Generate a 2-3 sentence summary that captures:
   1. What this file contains
   2. Key information or purpose  
   3. When this knowledge would be useful
   
   Keep it under 200 words and make it actionable for context injection.
   ```

5. **Fallback Inteligente**
   - Se todos os LLMs falharem
   - Analisa conteúdo (tipo, tamanho, linhas)
   - Gera resumo descritivo básico
   - Inclui preview (primeiros 200 chars)

**Resultado:**
- Summary de 200-300 palavras
- Acionável para agentes
- Otimizado para injection em contexto
- Armazenado em `knowledge_base_entries.summary`

---

## Validação e Segurança

### Row Level Security (RLS)

Todas as tabelas têm RLS habilitado:

```sql
ALTER TABLE knowledge_base_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_knowledge_entry_assignments ENABLE ROW LEVEL SECURITY;
```

**Políticas:**

```sql
CREATE POLICY kb_folders_account_access ON knowledge_base_folders
    FOR ALL USING (basejump.has_role_on_account(account_id) = true);

CREATE POLICY kb_entries_account_access ON knowledge_base_entries
    FOR ALL USING (basejump.has_role_on_account(account_id) = true);

CREATE POLICY kb_entry_assignments_account_access ON agent_knowledge_entry_assignments
    FOR ALL USING (basejump.has_role_on_account(account_id) = true);
```

**Efeito:**
- Usuários só veem/modificam seus próprios dados
- Isolamento por conta (multi-tenant)
- Aplicado no nível do banco de dados
- Impossível bypass via API

---

### Autenticação JWT

**Dependência FastAPI:**
```python
user_id: str = Depends(verify_and_get_user_id_from_jwt)
```

**Fluxo:**
1. Frontend obtém token JWT do Supabase Auth
2. Inclui em header: `Authorization: Bearer {token}`
3. Backend valida token
4. Extrai `user_id` (= `account_id`)
5. Usa para queries com RLS

---

### Validação de Ownership

Antes de modificar qualquer recurso:

```python
# Exemplo: deletar pasta
folder_result = await client.table('knowledge_base_folders').select(
    'folder_id'
).eq('folder_id', folder_id).eq('account_id', account_id).execute()

if not folder_result.data:
    raise HTTPException(status_code=404, detail="Folder not found")
```

**Proteção contra:**
- Modificar recursos de outros usuários
- Cross-tenant data access
- UUID guessing attacks

---

### Limites e Quotas

**Arquivo Individual:**
- Máximo: 50MB
- Validado no upload
- Rejeita com HTTP 413

**Total por Usuário:**
- Máximo: 50MB (soma de todos os arquivos)
- Verificado antes de aceitar novo upload
- Retorna erro descritivo com tamanhos atuais

**Implementação:**
```python
async def check_total_file_size_limit(account_id: str, new_file_size: int):
    result = await client.table('knowledge_base_entries').select(
        'file_size'
    ).eq('account_id', account_id).eq('is_active', True).execute()
    
    current_total = sum(entry['file_size'] for entry in result.data)
    new_total = current_total + new_file_size
    
    if new_total > MAX_TOTAL_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File size limit exceeded")
```

---

### Storage Security

**S3 Paths:**
- Estruturados: `knowledge-base/{folder_id}/{entry_id}/{filename}`
- UUIDs previnem enumeração
- Nomes sanitizados previnem path traversal

**Supabase Storage:**
- Signed URLs para download
- Controle de acesso via RLS
- Encryption at rest
- Automatic backup

---

### Validação de Input

**Nomes de Pasta/Arquivo:**
- Sanitização automática
- Rejeição de caracteres ilegais
- Prevenção de nomes reservados
- Limit de comprimento

**Conteúdo de Arquivo:**
- Validação de MIME type
- Verificação de tamanho
- Detecção de encoding
- Scan de conteúdo malicioso (via content analysis)

**Resumos:**
- Comprimento mínimo/máximo
- Validação de Unicode
- Escape de caracteres especiais

---

## Integração com Agentes

### Quando o Contexto é Injetado

**Cenários:**

1. **Início de Conversa**
   - Primeira mensagem do usuário
   - Context inclui knowledge base

2. **A Cada Mensagem (opcional)**
   - Configurável por agente
   - Útil para conversas longas

3. **Sob Demanda**
   - Uso de `usage_context = 'on_request'`
   - Agente solicita explicitamente

---

### Formato do Contexto

```markdown
# KNOWLEDGE BASE

The following files are available in your knowledge base:

## Policies/Employee_Handbook.pdf
This employee handbook outlines company policies including time-off procedures, 
expense reimbursement guidelines, and professional conduct expectations. Use 
this when employees ask about company policies or HR-related questions.

## Reports/Q4_2024_Financial_Summary.xlsx
Financial summary for Q4 2024 showing revenue growth of 15%, expense breakdown 
by department, and profit projections for Q1 2025. Reference this for questions 
about company financial performance or budget planning.

## Tech_Docs/API_Integration_Guide.md
Technical documentation for integrating with our REST API, including 
authentication flows, endpoint descriptions, and code examples in Python 
and JavaScript. Use when developers ask about API integration.
```

---

### Token Management

**Limite Padrão: 4000 tokens**

Razão:
- GPT-4: 8K context → reservar ~4K para conversa
- Claude: 100K context → pode aumentar limite
- Deixa espaço para system prompt + histórico

**Estimativa de Tokens:**
```python
estimated_tokens = (current_length + entry_length) / 4
if estimated_tokens > p_max_tokens:
    EXIT LOOP  # Para de adicionar entries
```

**Ordenação:**
- `ORDER BY created_at DESC`
- Arquivos mais recentes têm prioridade
- Assume que conteúdo novo é mais relevante

---

### Usage Context

Três modos:

**1. `always`** (padrão)
- Sempre incluído no contexto
- Usado para informação fundamental
- Exemplo: políticas da empresa, FAQs

**2. `on_request`**
- Incluído apenas quando solicitado
- Agente decide quando buscar
- Exemplo: documentação técnica detalhada

**3. `contextual`**
- Incluído baseado em análise de contexto
- Futuro: embeddings + semantic search
- Exemplo: caso específico relevante à conversa

**Implementação Atual:**
```sql
WHERE kbe.usage_context IN ('always', 'contextual')
```

---

### Exemplo de Uso pelo Agente

**Conversa:**

```
User: Qual é nossa política de férias?

Agent: (recebe contexto com Employee_Handbook.pdf)
        
        Baseado no Employee Handbook, nossa política de férias 
        oferece 15 dias por ano para funcionários em tempo integral, 
        acumulados mensalmente. Você precisa solicitar férias com 
        pelo menos 2 semanas de antecedência através do portal RH.
        
User: E se eu quiser férias não remuneradas?

Agent: O handbook menciona que férias não remuneradas podem ser 
        solicitadas em casos especiais, mas requerem aprovação do 
        gerente e RH. Você quer que eu te ajude a iniciar esse 
        processo?
```

**Resultado:**
- Agente responde com informação precisa
- Referencia documentos da knowledge base
- Não inventa políticas
- Pode citar fonte específica

---

## Considerações de Performance

### Lazy Loading

**Problema:** Carregar todos os arquivos de todas as pastas é lento.

**Solução:**
- Pastas começam recolhidas
- Entries só são carregados ao expandir
- Cache em `folderEntries` state
- Evita re-fetch desnecessário

**Exceção:** Assignment mode auto-expande e carrega tudo (necessário para checkboxes).

---

### React Query Caching

```typescript
const { folders, loading, refetch } = useKnowledgeFolders();
```

**Benefícios:**
- Cache automático de `folders` e `recentFiles`
- Invalidação inteligente após mutations
- Background refetch
- Deduplica requests simultâneos

**Invalidação:**
```typescript
queryClient.invalidateQueries({ queryKey: knowledgeBaseKeys.all });
```

---

### Database Indexes

Todos criados para performance:

```sql
CREATE INDEX idx_kb_folders_account_id ON knowledge_base_folders(account_id);
CREATE INDEX idx_kb_entries_folder_id ON knowledge_base_entries(folder_id);
CREATE INDEX idx_kb_entries_account_id ON knowledge_base_entries(account_id);
CREATE INDEX idx_kb_entry_assignments_agent_id ON agent_knowledge_entry_assignments(agent_id);
CREATE INDEX idx_kb_entry_assignments_entry_id ON agent_knowledge_entry_assignments(entry_id);
```

**Queries Otimizadas:**
- Busca por conta: O(log n)
- Busca por pasta: O(log n)
- Busca por agente: O(log n)
- Joins são eficientes

---

### S3 Storage Performance

**Vantagens:**
- Storage separado do banco de dados
- Escalável infinitamente
- CDN-ready (Supabase Storage usa CDN)
- Download direto (não passa pelo backend)

**Paths Estruturados:**
```
knowledge-base/
  ├── {folder_id_1}/
  │   ├── {entry_id_1}/
  │   │   └── document.pdf
  │   └── {entry_id_2}/
  │       └── spreadsheet.xlsx
  └── {folder_id_2}/
      └── {entry_id_3}/
          └── report.docx
```

**Benefício:** Fácil listar, mover, deletar por pasta.

---

### LLM Summary Caching

**Observação:** Resumos são gerados uma vez no upload e armazenados no banco.

**Vantagens:**
- Não re-processa arquivo a cada contexto injection
- Resposta instantânea ao carregar contexto
- Reduz custos de API LLM

**Trade-off:**
- Resumos não atualizam se arquivo mudar
- Solução: Re-upload ou edição manual de resumo

---

## Melhorias Futuras

### 1. Semantic Search

**Problema Atual:** Context injection é limitado por tokens e ordem cronológica.

**Solução:**
- Gerar embeddings dos resumos
- Armazenar em `pgvector` (PostgreSQL extension)
- Semantic search baseado na query do usuário
- Ranking por relevância

**Implementação:**
```sql
-- Adicionar coluna
ALTER TABLE knowledge_base_entries 
ADD COLUMN summary_embedding vector(1536);

-- Semantic search
SELECT * FROM knowledge_base_entries
WHERE agent_id = {id}
ORDER BY summary_embedding <=> query_embedding
LIMIT 5;
```

---

### 2. Versioning de Arquivos

**Feature:**
- Manter histórico de versões
- Comparar mudanças
- Rollback para versão anterior

**Schema:**
```sql
CREATE TABLE knowledge_base_entry_versions (
    version_id UUID PRIMARY KEY,
    entry_id UUID REFERENCES knowledge_base_entries(entry_id),
    version_number INTEGER,
    file_path TEXT,
    summary TEXT,
    created_at TIMESTAMPTZ,
    created_by UUID
);
```

---

### 3. Collaborative Editing

**Feature:**
- Múltiplos usuários podem editar resumos
- Real-time sync via Supabase Realtime
- Conflict resolution

---

### 4. Advanced File Types

**Suportar:**
- Imagens: OCR + image description via Vision API
- Vídeos: Transcrição + key frames analysis
- Audio: Speech-to-text
- Code: AST parsing + docstring extraction
- Planilhas: Schema extraction + data summary

---

### 5. Hierarchical Folders

**Problema Atual:** Apenas um nível (pastas → arquivos).

**Solução:**
- Pastas dentro de pastas
- Tree structure ilimitado
- Breadcrumb navigation

**Schema:**
```sql
ALTER TABLE knowledge_base_folders
ADD COLUMN parent_folder_id UUID REFERENCES knowledge_base_folders(folder_id);
```

---

### 6. Shared Knowledge Bases

**Feature:**
- Compartilhar pasta com outros usuários
- Permissions: read-only vs. read-write
- Team collaboration

**Schema:**
```sql
CREATE TABLE knowledge_base_shares (
    share_id UUID PRIMARY KEY,
    folder_id UUID REFERENCES knowledge_base_folders(folder_id),
    shared_with_account_id UUID REFERENCES basejump.accounts(id),
    permission_level VARCHAR(50) CHECK (permission_level IN ('read', 'write')),
    created_at TIMESTAMPTZ
);
```

---

### 7. Auto-Tagging

**Feature:**
- LLM extrai tags do conteúdo
- Tags facilitam busca e organização
- Auto-complete ao digitar

**Schema:**
```sql
CREATE TABLE knowledge_base_tags (
    tag_id UUID PRIMARY KEY,
    entry_id UUID REFERENCES knowledge_base_entries(entry_id),
    tag_name VARCHAR(100),
    confidence FLOAT
);
```

---

### 8. Usage Analytics

**Métricas:**
- Quais arquivos são mais referenciados por agentes
- Frequência de uso por arquivo
- Effectiveness scoring (conversas bem-sucedidas)

**Schema:**
```sql
CREATE TABLE knowledge_base_usage_log (
    log_id UUID PRIMARY KEY,
    entry_id UUID REFERENCES knowledge_base_entries(entry_id),
    agent_id UUID REFERENCES agents(agent_id),
    conversation_id UUID,
    used_at TIMESTAMPTZ,
    effectiveness_score FLOAT
);
```

---

## Troubleshooting

### Problema: Upload falha com erro 413

**Causa:** Arquivo ou total excede limite de 50MB.

**Solução:**
1. Verificar tamanho do arquivo individual
2. Verificar total de arquivos do usuário:
   ```sql
   SELECT SUM(file_size) FROM knowledge_base_entries 
   WHERE account_id = '{user_id}' AND is_active = true;
   ```
3. Deletar arquivos antigos ou desnecessários
4. Considerar aumentar limite (requer mudança de código)

---

### Problema: LLM summary está vazio ou genérico

**Causa:** 
- Todos os modelos LLM falharam
- Conteúdo muito grande (chunking inadequado)
- Arquivo binário sem conteúdo extraível

**Solução:**
1. Verificar logs do backend:
   ```
   ERROR: Model google/gemini-2.5-flash-lite failed: {error}
   ERROR: All LLM models failed, using fallback
   ```
2. Re-upload arquivo (retry pode ter sucesso)
3. Editar resumo manualmente via UI
4. Verificar se arquivo é tipo suportado

---

### Problema: Arquivo não aparece no contexto do agente

**Checklist:**
1. Arquivo está atribuído ao agente?
   - Verificar checkboxes em Assignment mode
2. Arquivo está ativo?
   ```sql
   SELECT is_active FROM knowledge_base_entries WHERE entry_id = '{id}';
   ```
3. `usage_context` está correto?
   - Deve ser 'always' ou 'contextual'
4. Token limit não foi excedido?
   - Verificar se outros arquivos consomem todo o limite
5. RLS está permitindo acesso?
   - Testar query manualmente no DB

---

### Problema: Drag & drop não funciona

**Possíveis causas:**
1. Item não é arrastável (tenta arrastar pasta?)
   - Solução: Só arquivos são arrastáveis
2. Target não é válido (tenta soltar em arquivo?)
   - Solução: Só pode soltar em pastas
3. JavaScript error no console
   - Solução: Verificar console do browser, reportar bug

---

### Problema: Validação de nome não aceita nome válido

**Debug:**
1. Ver mensagem de erro específica
2. Testar com `FileNameValidator.validateName()`:
   ```python
   is_valid, error = FileNameValidator.validate_name("My Folder", "folder")
   print(is_valid, error)
   ```
3. Verificar se há caracteres invisíveis (copy/paste issues)
4. Tentar sanitizar primeiro:
   ```python
   sanitized = FileNameValidator.sanitize_name("My Folder")
   ```

---

## Conclusão

O sistema de Knowledge Base do Suna é uma solução completa e robusta para gerenciamento de documentos com integração profunda em agentes de IA. 

**Principais características:**

✅ **Organização hierárquica** com pastas e arquivos  
✅ **Upload e processamento** automático com LLM  
✅ **Validação cross-platform** e sanitização de nomes  
✅ **Drag & drop** moderno e intuitivo  
✅ **Atribuição granular** a agentes específicos  
✅ **Injection automática** de contexto em conversas  
✅ **Segurança** via RLS, JWT, e ownership validation  
✅ **Performance** otimizada com lazy loading e caching  

O sistema está pronto para produção e preparado para escalar com melhorias futuras como semantic search, versioning, e collaborative editing.