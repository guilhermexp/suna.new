'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { codeToHtml } from 'shiki';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  liquidGlassTheme,
  getLanguageInfo,
  type SupportedLanguage,
} from '@/themes/syntax-highlighting';
import '@/styles/code-blocks.css';

/**
 * Props for the CodeBlock component
 */
export interface CodeBlockProps {
  /** The code string to display */
  code: string;
  /** Programming language for syntax highlighting */
  language?: string;
  /** Optional filename to display in header */
  filename?: string;
  /** Additional CSS classes */
  className?: string;
  /** Show/hide the header (default: true) */
  showHeader?: boolean;
  /** Show/hide copy button (default: true) */
  showCopyButton?: boolean;
  /** Compact variant with reduced padding */
  compact?: boolean;
  /** Maximum height before scrolling (default: 600px) */
  maxHeight?: number;
  /** Callback when copy is successful */
  onCopy?: () => void;
}

/**
 * Liquid Glass Code Block Component
 *
 * A modern code block component with:
 * - Liquid glass morphism design
 * - Syntax highlighting via Shiki
 * - Copy to clipboard functionality
 * - Responsive design
 * - Accessibility features
 *
 * @example
 * ```tsx
 * <CodeBlock
 *   code="const hello = 'world';"
 *   language="typescript"
 *   filename="example.ts"
 * />
 * ```
 */
export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'plaintext',
  filename,
  className,
  showHeader = true,
  showCopyButton = true,
  compact = false,
  maxHeight = 600,
  onCopy,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Get language information for display
  const languageInfo = getLanguageInfo(language);

  /**
   * Highlight code using Shiki
   */
  useEffect(() => {
    let isMounted = true;

    const highlightCode = async () => {
      if (!code || typeof code !== 'string') {
        setHighlightedHtml('');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        const html = await codeToHtml(code, {
          lang: language,
          theme: liquidGlassTheme as any,
          transformers: [
            {
              pre(node) {
                // Remove background color from pre tag (handled by CSS)
                if (node.properties.style) {
                  node.properties.style = (node.properties.style as string)
                    .replace(/background-color:[^;]+;?/g, '');
                }
              },
            },
          ],
        });

        if (isMounted) {
          setHighlightedHtml(html);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to highlight code:', error);

        // Fallback to plain text
        if (isMounted) {
          setHighlightedHtml(`<pre><code>${escapeHtml(code)}</code></pre>`);
          setIsLoading(false);
        }
      }
    };

    highlightCode();

    return () => {
      isMounted = false;
    };
  }, [code, language]);

  /**
   * Copy code to clipboard
   */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      onCopy?.();

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  }, [code, onCopy]);

  /**
   * Handle keyboard shortcuts
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      // Cmd/Ctrl + C on code block to copy
      if ((event.metaKey || event.ctrlKey) && event.key === 'c' && showCopyButton) {
        const selection = window.getSelection();
        // Only trigger if no text is selected (to allow normal copy)
        if (!selection || selection.toString().length === 0) {
          event.preventDefault();
          handleCopy();
        }
      }
    },
    [handleCopy, showCopyButton]
  );

  const blockClasses = cn(
    'liquid-glass-code-block',
    {
      'liquid-glass-code-block--compact': compact,
      'liquid-glass-code-block--loading': isLoading,
    },
    className
  );

  const contentStyle = maxHeight
    ? { maxHeight: `${maxHeight}px` }
    : undefined;

  return (
    <div className={blockClasses} onKeyDown={handleKeyDown} tabIndex={0}>
      {showHeader && (
        <header className="liquid-glass-code-block__header">
          <div className="flex items-center gap-2">
            {languageInfo.icon && (
              <span className="text-base" role="img" aria-label={languageInfo.displayName}>
                {languageInfo.icon}
              </span>
            )}
            {filename ? (
              <span className="liquid-glass-code-block__filename">{filename}</span>
            ) : (
              <span className="liquid-glass-code-block__language">
                {languageInfo.displayName}
              </span>
            )}
          </div>

          {showCopyButton && (
            <button
              type="button"
              className={cn('liquid-glass-code-block__copy-button', {
                'liquid-glass-code-block__copy-button--copied': isCopied,
              })}
              onClick={handleCopy}
              aria-label={isCopied ? 'Copied to clipboard' : 'Copy code to clipboard'}
              title={isCopied ? 'Copied!' : 'Copy code'}
            >
              {isCopied ? (
                <>
                  <Check className="liquid-glass-code-block__copy-icon" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="liquid-glass-code-block__copy-icon" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}
        </header>
      )}

      <div className="liquid-glass-code-block__content" style={contentStyle}>
        {isLoading ? (
          <pre className="!bg-transparent">
            <code>{code}</code>
          </pre>
        ) : highlightedHtml ? (
          <div
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            aria-label="Code snippet"
          />
        ) : (
          <pre className="!bg-transparent">
            <code>{code}</code>
          </pre>
        )}
      </div>

      {/* Screen reader announcements */}
      <div className="liquid-glass-code-block__sr-only" role="status" aria-live="polite">
        {isCopied && 'Code copied to clipboard'}
      </div>
    </div>
  );
};

/**
 * Inline code component with liquid glass styling
 */
export interface InlineCodeProps {
  /** Code content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export const InlineCode: React.FC<InlineCodeProps> = ({ children, className }) => {
  return (
    <code className={cn('liquid-glass-inline-code', className)}>
      {children}
    </code>
  );
};

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

// Export default
export default CodeBlock;
