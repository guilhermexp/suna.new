'use client';

import React from 'react';
import { Activity } from 'lucide-react';

interface TokenUsageDisplayProps {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  estimatedCost?: number | string;
  model?: string;
  className?: string;
}

export const TokenUsageDisplay: React.FC<TokenUsageDisplayProps> = ({
  promptTokens,
  completionTokens,
  totalTokens,
  estimatedCost,
  model,
  className = '',
}) => {
  if (!promptTokens && !completionTokens && !totalTokens) return null;

  const total = totalTokens || (promptTokens || 0) + (completionTokens || 0);
  const cost = typeof estimatedCost === 'number' ? estimatedCost.toFixed(4) : estimatedCost;

  return (
    <div className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}>
      <Activity className="h-3 w-3" />
      <div className="flex items-center gap-3">
        {promptTokens !== undefined && (
          <span className="flex items-center gap-1">
            <span className="text-muted-foreground/70">In:</span>
            <span className="font-mono">{promptTokens.toLocaleString()}</span>
          </span>
        )}
        {completionTokens !== undefined && (
          <span className="flex items-center gap-1">
            <span className="text-muted-foreground/70">Out:</span>
            <span className="font-mono">{completionTokens.toLocaleString()}</span>
          </span>
        )}
        {total > 0 && (
          <span className="flex items-center gap-1">
            <span className="text-muted-foreground/70">Total:</span>
            <span className="font-mono font-medium">{total.toLocaleString()}</span>
          </span>
        )}
        {cost && (
          <span className="flex items-center gap-1">
            <span className="text-muted-foreground/70">~$</span>
            <span className="font-mono text-green-600 dark:text-green-400">{cost}</span>
          </span>
        )}
      </div>
    </div>
  );
};
