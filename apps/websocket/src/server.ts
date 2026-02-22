import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Server, Socket } from 'socket.io';
import { Redis } from 'ioredis';
import { createAdapter } from '@socket.io/redis-adapter';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NotificationPayload {
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

interface SocketData {
  userId: string | null;
}

// ─── Redis Adapter ────────────────────────────────────────────────────────────

let adapterReady = false;

async function setupRedisAdapter(io: Server) {
  if (adapterReady) return;
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.warn('[WS] REDIS_URL not set — running without Redis adapter (single-instance)');
    return;
  }
  try {
    const pubClient = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 3 });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    io.adapter(createAdapter(pubClient, subClient) as any);
    adapterReady = true;
    console.log('[WS] Redis adapter connected');
  } catch (err) {
    console.error('[WS] Redis adapter failed, falling back to in-memory:', err);
  }
}

// ─── HTTP + Socket.io Server ──────────────────────────────────────────────────

const httpServer = createServer();

const allowedOrigins = [
  'http://localhost:9002',
  process.env.NEXT_PUBLIC_APP_URL,
].filter(Boolean) as string[];

export const io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, health checks)
      if (!origin) return callback(null, true);
      const allowed =
        allowedOrigins.includes(origin) ||
        /^https:\/\/.*\.vercel\.app$/.test(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin);
      callback(allowed ? null : new Error(`Origin ${origin} not allowed by CORS`), allowed);
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Polling first ensures Vercel serverless compatibility; upgrades to WS if persistent
  transports: ['polling', 'websocket'],
  pingTimeout: 60_000,
  pingInterval: 25_000,
  // Recover connection state for up to 2 minutes after a disconnect
  connectionStateRecovery: { maxDisconnectionDuration: 2 * 60 * 1000 },
});

// ─── Auth Middleware ──────────────────────────────────────────────────────────

io.use((socket, next) => {
  const raw =
    socket.handshake.auth?.token ||
    (socket.handshake.headers.authorization || '').replace('Bearer ', '');

  if (!raw) {
    socket.data.userId = null;
    return next();
  }

  try {
    // JWT payload is base64url — extract sub/userId without full verification
    // Full verification happens in the main Next.js app
    const parts = raw.split('.');
    if (parts.length < 2) throw new Error('Invalid token format');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    socket.data.userId = payload.sub || payload.userId || null;
    next();
  } catch {
    socket.data.userId = null;
    next(); // Allow connection even with bad token (feature gates happen per-event)
  }
});

// ─── Event Handlers ───────────────────────────────────────────────────────────

io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>) => {
  const userId = socket.data.userId;
  console.log(`[WS] Connected  sid=${socket.id} userId=${userId ?? 'guest'} transport=${socket.conn.transport.name}`);

  // Each user has a private notification room
  if (userId) {
    socket.join(`user:${userId}`);
  }

  // Allow joining a specific interview session room for real-time Q&A
  socket.on('interview:join', (sessionId: string) => {
    socket.join(`interview:${sessionId}`);
    console.log(`[WS] ${socket.id} joined interview:${sessionId}`);
  });

  socket.on('interview:leave', (sessionId: string) => {
    socket.leave(`interview:${sessionId}`);
  });

  // Connectivity test — emits back a notification
  socket.on('ping', () => {
    socket.emit('notification', {
      id: `pong-${Date.now()}`,
      type: 'info',
      title: 'WebSocket Connected',
      message: `Connection healthy · transport=${socket.conn.transport.name}`,
      timestamp: Date.now(),
    });
  });

  socket.on('disconnect', (reason) => {
    console.log(`[WS] Disconnected sid=${socket.id} reason=${reason}`);
  });

  socket.on('error', (err) => {
    console.error(`[WS] Socket error sid=${socket.id}:`, err);
  });
});

// ─── Health / Metrics endpoints ───────────────────────────────────────────────

httpServer.on('request', (req: IncomingMessage, res: ServerResponse) => {
  if (req.url === '/healthz' || req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, connections: io.engine.clientsCount, ts: Date.now() }));
    return;
  }
  if (req.url === '/metrics') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      connections: io.engine.clientsCount,
      adapter: adapterReady ? 'redis' : 'memory',
      uptime: process.uptime(),
    }));
    return;
  }
  // All Socket.io traffic is handled by the Socket.io engine listener
});

// ─── Startup ──────────────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '3001', 10);

async function start() {
  await setupRedisAdapter(io);
  httpServer.listen(PORT, () => {
    console.log(`[WS] Server listening on port ${PORT}`);
  });
}

// Local dev: run directly
if (process.env.VERCEL !== '1') {
  start().catch(console.error);
}

// Vercel serverless: export a request handler
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  await setupRedisAdapter(io);
  httpServer.emit('request', req, res);
}

