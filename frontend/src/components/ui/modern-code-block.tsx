'use client';

import React from 'react';
import { CodeBlock } from '@/components/CodeBlock';

interface ModernCodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  className?: string;
  showHeader?: boolean;
}

/**
 * ModernCodeBlock - Wrapper component for backward compatibility
 * Now uses the new Liquid Glass CodeBlock component
 */
export const ModernCodeBlock: React.FC<ModernCodeBlockProps> = ({
  code,
  language = 'plaintext',
  filename,
  className,
  showHeader = true,
}) => {
  return (
    <CodeBlock
      code={code}
      language={language}
      filename={filename}
      className={className}
      showHeader={showHeader}
    />
  );
};
