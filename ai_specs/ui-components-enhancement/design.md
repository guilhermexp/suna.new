# UI Components Enhancement - Design Document

## Architecture Overview

Este documento descreve a arquitetura e design técnico para implementar as três melhorias de UI: editabilidade de MDs, padronização de code blocks, e atualização automática de contadores.

## System Architecture

### Component Hierarchy

```
App
├── WorkspaceFileViewer
│   ├── MarkdownRenderer
│   ├── MarkdownEditor (NEW)
│   └── FileActions
├── CodeBlock (ENHANCED)
│   ├── SyntaxHighlighter
│   ├── CopyButton
│   └── LiquidGlassContainer (NEW)
├── ContextCounter (ENHANCED)
│   ├── CircularProgress
│   └── RealtimeUpdater (NEW)
└── ChatInput (ENHANCED)
    ├── TokenCounter (NEW)
    └── RealtimeTokenTracker (NEW)
```

## Design Specifications

### 1. Markdown Editor Component (REQ-001)

#### Component Structure
```typescript
interface MarkdownEditorProps {
  content: string;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
  readOnly?: boolean;
}

interface MarkdownEditorState {
  isEditing: boolean;
  content: string;
  isValid: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
}
```

#### Technical Implementation
- **Editor Library**: Utilizar `@uiw/react-md-editor` ou `react-markdown-editor-lite`
- **Validation**: Implementar parser markdown com `marked` para validação em tempo real
- **Auto-save**: Debounce de 2 segundos para salvar automaticamente durante edição
- **Version Control**: Manter histórico local com `localStorage` para undo/redo

#### State Management
```typescript
// Redux slice para edição de documentos
interface DocumentState {
  documents: Record<string, {
    content: string;
    isEditing: boolean;
    lastModified: Date;
    version: number;
  }>;
  activeDocument: string | null;
}
```

#### UI/UX Design
- **Edit Mode**: Transição suave com fade-in do editor
- **Toolbar**: Botões Save/Cancel com ícones claros e tooltips
- **Validation Feedback**: Indicador visual de markdown válido/inválido
- **Auto-save Indicator**: Status "Saving..." e "Saved" com timestamps

### 2. Code Block Styling System (REQ-002)

#### Design System Integration
```css
.liquid-glass-code-block {
  /* Base styling */
  background: #121212;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  /* Liquid glass effect */
  backdrop-filter: blur(10px);
  background: linear-gradient(135deg, 
    rgba(18, 18, 18, 0.9) 0%, 
    rgba(18, 18, 18, 0.95) 100%);
  
  /* Typography */
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 14px;
  line-height: 1.6;
  
  /* Animation */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.liquid-glass-code-block:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 12px -1px rgba(0, 0, 0, 0.4);
}
```

#### Syntax Highlighting Theme
```typescript
const liquidGlassTheme = {
  'keyword': '#c792ea',      // Purple
  'function': '#82aaff',     // Blue  
  'string': '#c3e88d',       // Green
  'variable': '#f78c6c',     // Orange
  'comment': '#546e7a',      // Gray
  'number': '#f78c6c',       // Orange
  'operator': '#89ddff',     // Cyan
  'class': '#ffcb6b',        // Yellow
  'background': '#121212',
  'text': '#ffffff'
};
```

#### Component Architecture
```typescript
interface CodeBlockProps {
  code: string;
  language: string;
  showCopyButton?: boolean;
  className?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language,
  showCopyButton = true,
  className = ''
}) => {
  return (
    <div className={`liquid-glass-code-block ${className}`}>
      <div className="code-block-header">
        <span className="language-label">{language}</span>
        {showCopyButton && <CopyButton content={code} />}
      </div>
      <SyntaxHighlighter 
        language={language}
        style={liquidGlassTheme}
        customStyle={{
          background: 'transparent',
          margin: 0,
          padding: '16px'
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
};
```

### 3. Real-time Counter System (REQ-003)

#### Architecture Pattern
- **Event-driven**: Utilizar WebSocket ou Server-Sent Events para atualizações
- **Optimistic Updates**: Atualizar UI imediatamente, sincronizar com backend depois
- **Debouncing**: Token counter com debounce de 300ms durante digitação

#### WebSocket Integration
```typescript
interface CounterUpdateEvent {
  type: 'context_update' | 'token_update';
  value: number;
  timestamp: number;
  sessionId: string;
}

class CounterService {
  private ws: WebSocket | null = null;
  private subscribers: Map<string, Set<(value: number) => void>> = new Map();
  
  subscribe(type: string, callback: (value: number) => void) {
    if (!this.subscribers.has(type)) {
      this.subscribers.set(type, new Set());
    }
    this.subscribers.get(type)!.add(callback);
  }
  
  private notify(type: string, value: number) {
    this.subscribers.get(type)?.forEach(callback => callback(value));
  }
}
```

#### Context Counter Component
```typescript
const ContextCounter: React.FC = () => {
  const [percentage, setPercentage] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  
  useEffect(() => {
    const counterService = new CounterService();
    
    counterService.subscribe('context_update', (value) => {
      setIsUpdating(true);
      setPercentage(value);
      setTimeout(() => setIsUpdating(false), 300);
    });
    
    return () => counterService.disconnect();
  }, []);
  
  return (
    <div className="context-counter">
      <CircularProgress 
        value={percentage} 
        isAnimating={isUpdating}
      />
      <span className="percentage-text">
        {percentage.toFixed(1)}%
      </span>
    </div>
  );
};
```

#### Token Counter Component
```typescript
const TokenCounter: React.FC<{ text: string }> = ({ text }) => {
  const [tokenCount, setTokenCount] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const calculateTokens = useCallback(
    debounce((input: string) => {
      setIsCalculating(true);
      const count = estimateTokens(input); // Implementar lógica de tokenização
      setTokenCount(count);
      setIsCalculating(false);
    }, 300),
    []
  );
  
  useEffect(() => {
    calculateTokens(text);
  }, [text, calculateTokens]);
  
  return (
    <div className="token-counter">
      <span className="token-count">{tokenCount}</span>
      <span className="token-label">tokens</span>
      {isCalculating && <LoadingSpinner size="sm" />}
    </div>
  );
};
```

## Data Models

### Document Model
```typescript
interface Document {
  id: string;
  name: string;
  content: string;
  type: 'markdown' | 'text' | 'code';
  isEditable: boolean;
  lastModified: Date;
  version: number;
  metadata: {
    author?: string;
    tags?: string[];
    isAgentGenerated: boolean;
  };
}
```

### Counter Model
```typescript
interface CounterState {
  context: {
    used: number;
    total: number;
    percentage: number;
    lastUpdated: Date;
  };
  tokens: {
    current: number;
    limit: number;
    isCalculating: boolean;
  };
}
```

## API Design

### Document Management API
```typescript
// PUT /api/documents/:id
interface UpdateDocumentRequest {
  content: string;
  version: number;
}

interface UpdateDocumentResponse {
  success: boolean;
  document: Document;
  conflicts?: {
    currentVersion: number;
    serverContent: string;
  };
}
```

### Counter Events API
```typescript
// WebSocket: /ws/counters
interface CounterMessage {
  event: 'context_used' | 'context_freed' | 'token_calculated';
  data: {
    value: number;
    timestamp: number;
    sessionId: string;
  };
}
```

## Security Considerations

### Markdown Editor Security
- **Input Sanitization**: Utilizar `DOMPurify` para limpar conteúdo malicioso
- **XSS Prevention**: Renderizar markdown com `react-markdown` e plugins seguros
- **Permission Validation**: Verificar permissões do usuário antes de permitir edição

### Real-time Updates Security
- **Session Validation**: Validar sessionId em todas as mensagens WebSocket
- **Rate Limiting**: Limitar frequência de atualizações para prevenir DoS
- **Data Validation**: Validar todos os valores recebidos via WebSocket

## Performance Optimization

### Code Block Rendering
- **Virtualization**: Para documentos com muitos code blocks, usar `react-window`
- **Syntax Highlighting Lazy Load**: Carregar syntax highlighting apenas quando visível
- **Memoization**: Memoizar code blocks renderizados para evitar re-renders

### Real-time Updates
- **Batch Updates**: Agrupar múltiplas atualizações em um único request
- **Connection Pooling**: Reutilizar conexões WebSocket
- **Local Caching**: Cache local para valores frequentemente acessados

## Testing Strategy

### Unit Tests
- Markdown Editor: validação, auto-save, rendering
- Code Block: styling, syntax highlighting, copy functionality
- Counters: cálculo de tokens, atualizações em tempo real

### Integration Tests
- Fluxo completo de edição de documento
- Sincronização de múltiplos contadores
- WebSocket connection lifecycle

### E2E Tests
- Cenários completos de usuário
- Performance testing com dados grandes
- Cross-browser compatibility

## Deployment Considerations

### Feature Flags
- `ENABLE_MARKDOWN_EDITING`: Ativar/desativar edição de MDs
- `ENABLE_LIQUID_GLASS_STYLE`: Ativar novo estilo de code blocks
- `ENABLE_REALTIME_COUNTERS`: Ativar atualizações em tempo real

### Migration Strategy
- **Phase 1**: Implementar code blocks styling (backward compatible)
- **Phase 2**: Adicionar edição de MDs (feature flag)
- **Phase 3**: Implementar contadores em tempo real (feature flag)

### Rollback Plan
- Manter componentes antigos como fallback
- Database migrations reversíveis
- Feature flags para desativação rápida

## Monitoring & Analytics

### Performance Metrics
- Tempo de renderização de code blocks
- Latência de atualizações de contadores
- Taxa de sucesso de salvamento de documentos

### User Analytics
- Taxa de utilização do editor markdown
- Frequência de atualizações de contadores
- Interação com code blocks (copy clicks)

### Error Tracking
- Falhas no WebSocket de contadores
- Erros de salvamento de documentos
- Problemas de rendering de syntax highlighting

## Future Enhancements

### Markdown Editor
- Suporte a colaboração em tempo real
- Templates e snippets personalizados
- Integração com Git para versionamento

### Code Blocks
- Suporte a múltiplos temas
- Exportação de código formatado
- Integração com playgrounds online

### Counters
- Histórico de uso de contexto
- Previsões de consumo baseadas em padrões
- Alertas personalizados para limites