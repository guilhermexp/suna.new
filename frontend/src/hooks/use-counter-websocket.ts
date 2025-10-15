/**
 * React hook for WebSocket counter updates
 */

import { useEffect, useState, useCallback, useRef } from "react";
import {
  getWebSocketService,
  cleanupWebSocketService,
  CounterUpdateData,
  TokenCountData,
} from "@/lib/websocket-service";

export interface UseCounterWebSocketOptions {
  sessionId: string;
  onContextUpdate?: (data: CounterUpdateData) => void;
  onTokenCount?: (data: TokenCountData) => void;
  onError?: (error: Event) => void;
  autoConnect?: boolean;
}

export function useCounterWebSocket({
  sessionId,
  onContextUpdate,
  onTokenCount,
  onError,
  autoConnect = true,
}: UseCounterWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const serviceRef = useRef(getWebSocketService(sessionId));

  // Connect to WebSocket
  const connect = useCallback(async () => {
    if (serviceRef.current.isConnected() || isConnecting) {
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      await serviceRef.current.connect();
      setIsConnected(true);
    } catch (err) {
      console.error("Failed to connect to WebSocket:", err);
      setError(err as Event);
    } finally {
      setIsConnecting(false);
    }
  }, [isConnecting]);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    serviceRef.current.disconnect();
    setIsConnected(false);
  }, []);

  // Setup subscriptions
  useEffect(() => {
    const service = serviceRef.current;
    const unsubscribers: (() => void)[] = [];

    // Subscribe to context updates
    if (onContextUpdate) {
      const unsubContext = service.subscribe("context_update", (data) => {
        onContextUpdate(data as CounterUpdateData);
      });
      unsubscribers.push(unsubContext);
    }

    // Subscribe to token count updates
    if (onTokenCount) {
      const unsubToken = service.subscribe("token_count", (data) => {
        onTokenCount(data as TokenCountData);
      });
      unsubscribers.push(unsubToken);
    }

    // Subscribe to errors
    if (onError) {
      const unsubError = service.onError((err) => {
        setError(err);
        onError(err);
      });
      unsubscribers.push(unsubError);
    }

    // Cleanup subscriptions
    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [onContextUpdate, onTokenCount, onError]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      cleanupWebSocketService(sessionId);
    };
  }, [sessionId, autoConnect, connect]);

  return {
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
  };
}
