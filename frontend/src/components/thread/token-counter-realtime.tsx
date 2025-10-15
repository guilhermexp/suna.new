'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Activity, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface TokenCounterRealtimeProps {
  text: string;
  sessionId?: string;
  maxTokens?: number;
  className?: string;
  showProgress?: boolean;
  debounceMs?: number;
}

// Simple token estimation (4 chars per token)
// In production, use a proper tokenizer like tiktoken
function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export const TokenCounterRealtime: React.FC<TokenCounterRealtimeProps> = ({
  text,
  sessionId,
  maxTokens = 8000,
  className,
  showProgress = true,
  debounceMs = 300,
}) => {
  const [isCalculating, setIsCalculating] = useState(false);
  const debouncedText = useDebounce(text, debounceMs);

  // Calculate token count with debounce
  const tokenCount = useMemo(() => {
    return estimateTokens(debouncedText);
  }, [debouncedText]);

  // Show calculating indicator when text is being typed
  useEffect(() => {
    if (text !== debouncedText) {
      setIsCalculating(true);
    } else {
      setIsCalculating(false);
    }
  }, [text, debouncedText]);

  const percentage = Math.min(100, (tokenCount / maxTokens) * 100);
  const isWarning = percentage >= 80;
  const isCritical = percentage >= 95;

  if (tokenCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col gap-2', className)}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Activity className={cn('h-3 w-3', isCalculating && 'animate-pulse')} />
          <span className="font-medium">
            {isCalculating ? 'Calculating...' : 'Tokens'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isWarning && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1"
            >
              <AlertCircle
                className={cn(
                  'h-3 w-3',
                  isCritical ? 'text-destructive' : 'text-orange-500'
                )}
              />
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.span
              key={tokenCount}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'font-mono font-medium tabular-nums',
                isCritical && 'text-destructive',
                isWarning && !isCritical && 'text-orange-500'
              )}
            >
              {tokenCount.toLocaleString()}
            </motion.span>
          </AnimatePresence>

          <span className="text-muted-foreground/70">
            / {maxTokens.toLocaleString()}
          </span>

          <span
            className={cn(
              'text-[10px] font-medium tabular-nums',
              isCritical && 'text-destructive',
              isWarning && !isCritical && 'text-orange-500'
            )}
          >
            ({percentage.toFixed(0)}%)
          </span>
        </div>
      </div>

      {showProgress && (
        <div className="relative">
          <Progress
            value={percentage}
            className={cn(
              'h-1.5',
              isCritical && '[&>div]:bg-destructive',
              isWarning && !isCritical && '[&>div]:bg-orange-500'
            )}
          />

          {/* Animated indicator for real-time updates */}
          <AnimatePresence>
            {isCalculating && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                exit={{ scaleX: 0 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-primary/20 rounded-full origin-left"
              />
            )}
          </AnimatePresence>
        </div>
      )}

      {isWarning && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className={cn(
            'text-[10px]',
            isCritical ? 'text-destructive' : 'text-orange-500'
          )}
        >
          {isCritical
            ? '⚠ Critical: Approaching token limit'
            : '⚠ Warning: High token usage'}
        </motion.p>
      )}
    </motion.div>
  );
};
