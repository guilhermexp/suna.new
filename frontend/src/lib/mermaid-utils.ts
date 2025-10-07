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

    // Primary Mermaid diagram types that MUST be declared at the start
    const mermaidDiagramTypes = [
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
      'c4dynamic'
    ];

    // Only treat as Mermaid if the first line starts with a diagram type declaration
    // Do NOT treat git commands (commit, branch, etc.) as Mermaid starters
    // as they cause false positives when used in regular text
    return mermaidDiagramTypes.some(starter => firstLine.startsWith(starter));
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
        code: code.trim(),
        language: language || 'mermaid',
        index
      });
    }
    index++;
  }

  return diagrams;
}
