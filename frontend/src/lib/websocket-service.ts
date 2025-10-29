/**
 * WebSocket service for real-time counter updates
 */

type MessageCallback = (data: any) => void;
type ErrorCallback = (error: Event) => void;

export interface CounterUpdateData {
  used: number;
  total: number;
  percentage: number;
}

export interface TokenCountData {
  count: number;
  max: number;
  percentage: number;
  warning: boolean;
}

export interface WebSocketMessage {
  type: "context_update" | "token_count" | "pong";
  session_id: string;
  data: CounterUpdateData | TokenCountData;
  timestamp: number;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageCallbacks: Map<string, Set<MessageCallback>> = new Map();
  private errorCallbacks: Set<ErrorCallback> = new Set();
  private isConnecting = false;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(sessionId: string) {
    this.sessionId = sessionId;

    // Determine WebSocket URL based on environment
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/^https?:\/\//, "")
      : window.location.host.replace("3000", "8000");

    this.url = `${protocol}//${host}/api/ws/counters/${sessionId}`;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return Promise.resolve();
    }

    this.isConnecting = true;

    return new Promise((resolve, reject) => {
      try {
        console.log(`[WebSocket] Connecting to ${this.url}`);
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log(`[WebSocket] Connected to session ${this.sessionId}`);
          this.reconnectAttempts = 0;
          this.isConnecting = false;
          this.startPing();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error("[WebSocket] Error parsing message:", error);
          }
        };

        this.ws.onerror = (error) => {
          console.error("[WebSocket] Error:", error);
          this.isConnecting = false;
          this.errorCallbacks.forEach((callback) => callback(error));
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("[WebSocket] Connection closed");
          this.isConnecting = false;
          this.stopPing();
          this.attemptReconnect();
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Subscribe to messages of a specific type
   */
  subscribe(type: string, callback: MessageCallback): () => void {
    if (!this.messageCallbacks.has(type)) {
      this.messageCallbacks.set(type, new Set());
    }
    this.messageCallbacks.get(type)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.messageCallbacks.get(type);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.messageCallbacks.delete(type);
        }
      }
    };
  }

  /**
   * Subscribe to error events
   */
  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(message: WebSocketMessage): void {
    const callbacks = this.messageCallbacks.get(message.type);
    if (callbacks) {
      callbacks.forEach((callback) => callback(message.data));
    }
  }

  /**
   * Start periodic ping to keep connection alive
   */
  private startPing(): void {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send("ping");
      }
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Stop ping interval
   */
  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[WebSocket] Max reconnection attempts reached");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(
      `[WebSocket] Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
    );

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error("[WebSocket] Reconnection failed:", error);
      });
    }, delay);
  }
}

// Singleton instance manager
const instances = new Map<string, WebSocketService>();

/**
 * Get or create WebSocket service for a session
 */
export function getWebSocketService(sessionId: string): WebSocketService {
  if (!instances.has(sessionId)) {
    instances.set(sessionId, new WebSocketService(sessionId));
  }
  return instances.get(sessionId)!;
}

/**
 * Cleanup WebSocket service for a session
 */
export function cleanupWebSocketService(sessionId: string): void {
  const service = instances.get(sessionId);
  if (service) {
    service.disconnect();
    instances.delete(sessionId);
  }
}
