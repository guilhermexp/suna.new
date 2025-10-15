'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useCounterWebSocket } from '@/hooks/use-counter-websocket';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, WifiOff } from 'lucide-react';
import type { CounterUpdateData } from '@/lib/websocket-service';

export interface ContextUsageRealtimeProps {
  sessionId: string;
  initialUsedTokens?: number;
  contextWindow: number;
  className?: string;
  enableWebSocket?: boolean;
}

// Mirror backend reserve logic in ContextManager.compress_messages
function effectivePromptLimit(contextWindow: number): number {
  if (contextWindow >= 1_000_000) return Math.max(1, contextWindow - 300_000);
  if (contextWindow >= 400_000) return Math.max(1, contextWindow - 64_000);
  if (contextWindow >= 200_000) return Math.max(1, contextWindow - 32_000);
  if (contextWindow >= 100_000) return Math.max(1, contextWindow - 16_000);
  return Math.max(1, contextWindow - 8_000);
}

function formatTokensShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

export const ContextUsageRealtime: React.FC<ContextUsageRealtimeProps> = ({
  sessionId,
  initialUsedTokens = 0,
  contextWindow,
  className,
  enableWebSocket = true,
}) => {
  const [usedTokens, setUsedTokens] = useState(initialUsedTokens);
  const [isAnimating, setIsAnimating] = useState(false);

  // WebSocket connection for real-time updates
  const { isConnected, isConnecting, error } = useCounterWebSocket({
    sessionId,
    onContextUpdate: useCallback((data: CounterUpdateData) => {
      setUsedTokens(data.used);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 300);
    }, []),
    autoConnect: enableWebSocket,
  });

  const limit = effectivePromptLimit(contextWindow);
  const pct = Math.max(0, Math.min(100, (usedTokens / limit) * 100));
  const pctText = `${pct.toFixed(1)}%`;

  // Determine ring color based on usage
  const getRingColor = () => {
    if (pct >= 90) return 'hsl(0 84% 60%)'; // Red
    if (pct >= 80) return 'hsl(38 92% 50%)'; // Orange
    return 'hsl(221 83% 53%)'; // Blue
  };

  // CSS ring using conic-gradient with smooth transition
  const ringStyle: React.CSSProperties = {
    background: `conic-gradient(${getRingColor()} ${pct}%, hsl(0 0% 92% / 40%) 0)`,
    transition: 'background 0.3s ease-in-out',
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.div
            className={cn(
              'relative h-6 px-2 rounded-lg bg-muted/40 border border-border/60 flex items-center gap-2 select-none',
              isAnimating && 'ring-2 ring-primary/50',
              className
            )}
            role="meter"
            aria-valuemin={0}
            aria-valuemax={limit}
            aria-valuenow={usedTokens}
            aria-label="Context usage"
            animate={isAnimating ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.3 }}
          >
            <div className="relative w-4 h-4" aria-hidden>
              <div className="absolute inset-0 rounded-full" style={ringStyle} />
              <div className="absolute inset-[2px] rounded-full bg-background" />

              {/* Loading indicator when connecting */}
              <AnimatePresence>
                {isConnecting && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error indicator */}
              <AnimatePresence>
                {error && !isConnecting && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute -top-1 -right-1"
                  >
                    <WifiOff className="h-2 w-2 text-destructive" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.span
              className="text-[11px] leading-none tabular-nums"
              key={pctText}
              initial={{ opacity: 0.7, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              {pctText}
            </motion.span>
          </motion.div>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <span>{pctText} • {formatTokensShort(usedTokens)} / {formatTokensShort(limit)} context used</span>
            </div>
            {enableWebSocket && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                {isConnecting && '⟳ Connecting...'}
                {isConnected && !error && '● Live updates'}
                {error && '⚠ Connection failed'}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
