/**
 * Utility functions for Mermaid diagram detection and processing
 */

/**
 * Detects if a code block contains Mermaid syntax
 */
export function isMermaidCode(language: string, code: string): boolean {
  if (!code?.trim()) return false;

  // Check if language is explicitly mermaid
  if (language === 'mermaid') return true;

  // For unknown languages, only check if content STARTS with a mermaid diagram
  // This prevents false positives from content that happens to contain mermaid keywords
  if (!language || language === 'text' || language === 'plain') {
    const trimmed = code.trim();
    const firstLine = trimmed.split('\n')[0]?.toLowerCase().trim();

    const mermaidStarters = [
      'graph',
      'flowchart',
      'sequencediagram',
      'classdiagram',
      'statediagram',
      'erdiagram',
      'journey',
      'gantt',
      'pie',
      'gitgraph',
      'mindmap',
      'timeline',
      'sankey',
      'block',
      'quadrant',
      'requirement',
      'c4context',
      'c4container',
      'c4component',
      'c4dynamic',
      // Git graph specific patterns (gitgraph starts with these commands)
      'commit',
      'branch',
      'checkout',
      'merge'
    ];

    // Only treat as Mermaid if the first line starts with a diagram declaration
    return mermaidStarters.some(starter => firstLine.startsWith(starter.toLowerCase()));
  }

  return false;
}

/**
 * Validates Mermaid syntax (basic validation)
 */
export function validateMermaidSyntax(code: string): { valid: boolean; error?: string } {
  if (!code?.trim()) {
    return { valid: false, error: 'Empty diagram' };
  }

  try {
    // Basic syntax checks
    const lines = code.split('\n').map(line => line.trim()).filter(Boolean);
    
    if (lines.length === 0) {
      return { valid: false, error: 'Empty diagram' };
    }

    // Check for basic mermaid structure
    const firstLine = lines[0].toLowerCase();
    const validStarters = [
      'graph', 'flowchart', 'sequencediagram', 'classdiagram', 
      'statediagram', 'erdiagram', 'journey', 'gantt', 'pie',
      'gitgraph', 'mindmap', 'timeline', 'sankey', 'block',
      'quadrant', 'requirement', 'c4context', 'c4container',
      'c4component', 'c4dynamic'
    ];

    const hasValidStarter = validStarters.some(starter => 
      firstLine.startsWith(starter) || 
      firstLine.includes(starter)
    );

    if (!hasValidStarter) {
      return { 
        valid: false, 
        error: 'Diagram must start with a valid Mermaid diagram type (e.g., graph, flowchart, sequenceDiagram, etc.)' 
      };
    }

    return { valid: true };
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Invalid syntax' 
    };
  }
}

/**
 * Sanitizes Mermaid syntax by fixing common errors
 */
export function sanitizeMermaidSyntax(code: string): string {
  if (!code?.trim()) return code;

  let sanitized = code;

  // Split into lines for processing
  const lines = sanitized.split('\n');
  const processedLines = lines.map((line, index) => {
    // Skip empty lines and diagram type declarations
    if (!line.trim() || /^(graph|flowchart|sequenceDiagram|classDiagram|stateDiagram|erDiagram)/i.test(line.trim())) {
      return line;
    }

    // Fix unclosed node labels with quotes: NodeID[" ... (missing "])
    // This handles cases like: ChatPanel[" or Text Component["
    let processedLine = line.replace(/(\w+)\["([^"\]]*?)$/g, (match, nodeId, text) => {
      const cleanText = text.trim();
      return `${nodeId}["${cleanText}"]`;
    });

    // Fix unclosed node labels without quotes: NodeID[ ... (missing ])
    processedLine = processedLine.replace(/(\w+)\[([^\]"]*?)$/g, (match, nodeId, text) => {
      // Don't fix if it's part of an arrow or special syntax
      if (text.match(/^(--|->|=>|==>|\||<|>)/)) {
        return match;
      }
      const cleanText = text.trim();
      // Only fix if there's actual content
      if (cleanText) {
        return `${nodeId}[${cleanText}]`;
      }
      return match;
    });

    // Fix node labels that have opening quote but no closing quote
    // Pattern: NodeID["text but no closing "
    processedLine = processedLine.replace(/(\w+)\["([^"]*?)(?:\]|$)/g, (match, nodeId, text) => {
      // If already properly closed, skip
      if (match.endsWith('"]')) {
        return match;
      }
      const cleanText = text.trim();
      return `${nodeId}["${cleanText}"]`;
    });

    return processedLine;
  });

  sanitized = processedLines.join('\n');

  // Final cleanup: remove duplicate markers
  sanitized = sanitized.replace(/\]\s*\]\s*$/gm, ']');
  sanitized = sanitized.replace(/"\s*"\s*\]/g, '"]');

  // Fix lines that have [" at the end with nothing after
  sanitized = sanitized.replace(/\["\s*$/gm, '');

  return sanitized;
}

/**
 * Extracts and processes Mermaid diagrams from markdown content
 */
export function extractMermaidDiagrams(content: string): Array<{
  original: string;
  code: string;
  language: string;
  index: number;
}> {
  const diagrams: Array<{
    original: string;
    code: string;
    language: string;
    index: number;
  }> = [];

  // Regex to match code blocks
  const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
  let match;
  let index = 0;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const [original, language = '', code] = match;

    if (isMermaidCode(language, code)) {
      diagrams.push({
        original,
        code: sanitizeMermaidSyntax(code.trim()),
        language: language || 'mermaid',
        index
      });
    }
    index++;
  }

  return diagrams;
}
