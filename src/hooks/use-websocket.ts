'use client';

/**
 * useWebSocket — singleton Socket.io client hook
 *
 * Connects to the WebSocket service (NEXT_PUBLIC_WEBSOCKET_URL).
 * Provides typed event emitters/listeners and auto-reconnects.
 * Safe to call from multiple components — returns the same socket instance.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import type { Socket } from 'socket.io-client';

// ─── Event type map (mirrors server.ts) ──────────────────────────────────────

export interface NotificationPayload {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
}

interface ServerToClientEvents {
  notification: (data: NotificationPayload) => void;
  'interview:question': (data: { questionIndex: number; content: string }) => void;
  'interview:evaluation': (data: { answerId: string; score: number; feedback: string }) => void;
  'usage:updated': (data: { feature: string; remaining: number }) => void;
  error: (data: { message: string; code: string }) => void;
}

interface ClientToServerEvents {
  'interview:join': (sessionId: string) => void;
  'interview:leave': (sessionId: string) => void;
  ping: () => void;
}

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// ─── Singleton socket (module-level, survives re-renders) ─────────────────────

let _socket: AppSocket | null = null;

async function getSocket(token?: string | null): Promise<AppSocket> {
  if (_socket?.connected) return _socket;

  // Dynamic import avoids SSR bundle issues
  const { io } = await import('socket.io-client');

  const wsUrl =
    process.env.NEXT_PUBLIC_WEBSOCKET_URL ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:3001'
      : '');

  if (!wsUrl) {
    throw new Error('[WebSocket] NEXT_PUBLIC_WEBSOCKET_URL is not set');
  }

  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }

  _socket = io(wsUrl, {
    // Polling first for Vercel serverless compatibility; upgrades to WS if available
    transports: ['polling', 'websocket'],
    auth: token ? { token } : {},
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: 6,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 10_000,
    timeout: 20_000,
  }) as AppSocket;

  return _socket;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseWebSocketOptions {
  /** JWT access token for authenticated connections */
  token?: string | null;
  /** Don't connect automatically — call `connect()` manually */
  lazy?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { token, lazy = false } = options;
  const socketRef = useRef<AppSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [transport, setTransport] = useState<string>('polling');

  const connect = useCallback(async () => {
    try {
      const socket = await getSocket(token);
      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        setTransport(socket.io.engine.transport.name);
        // Update transport name when it upgrades (polling → websocket)
        socket.io.engine.on('upgrade', () => {
          setTransport(socket.io.engine.transport.name);
        });
        console.log('[WebSocket] Connected, transport:', socket.io.engine.transport.name);
      });

      socket.on('disconnect', (reason) => {
        setConnected(false);
        console.log('[WebSocket] Disconnected:', reason);
      });

      socket.on('connect_error', (err) => {
        setConnected(false);
        console.error('[WebSocket] Connection error:', err.message);
      });

      if (!socket.connected) {
        socket.connect();
      }
    } catch (err) {
      console.error('[WebSocket] Failed to initialise socket:', err);
    }
  }, [token]);

  useEffect(() => {
    if (!lazy) {
      connect();
    }
    return () => {
      // Don't disconnect on unmount — socket is shared across components
    };
  }, [connect, lazy]);

  /** Join a named room (e.g. interview session) */
  const joinRoom = useCallback((event: 'interview:join', id: string) => {
    socketRef.current?.emit(event, id);
  }, []);

  /** Leave a named room */
  const leaveRoom = useCallback((event: 'interview:leave', id: string) => {
    socketRef.current?.emit(event, id);
  }, []);

  /** Send a ping to test connectivity — server replies with a notification */
  const ping = useCallback(() => {
    socketRef.current?.emit('ping');
  }, []);

  /** Listen to a server event. Returns cleanup fn. */
  const on = useCallback(
    <K extends keyof ServerToClientEvents>(
      event: K,
      handler: ServerToClientEvents[K]
    ) => {
      const socket = socketRef.current;
      if (!socket) return () => {};
      socket.on(event as string, handler as (...args: unknown[]) => void);
      return () => socket.off(event as string, handler as (...args: unknown[]) => void);
    },
    []
  );

  return {
    socket: socketRef.current,
    connected,
    transport,
    connect,
    joinRoom,
    leaveRoom,
    ping,
    on,
  };
}
