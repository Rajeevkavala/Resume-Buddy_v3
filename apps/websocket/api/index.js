const { createServer } = require('node:http');
const { Server } = require('socket.io');
const { Redis } = require('ioredis');
const { createAdapter } = require('@socket.io/redis-adapter');

let io = null;
let adapterReady = false;

function allowedOrigin(origin) {
  if (!origin) return true;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (origin === 'http://localhost:9002') return true;
  if (appUrl && origin === appUrl) return true;
  if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return true;
  if (/^http:\/\/localhost:\d+$/.test(origin)) return true;
  return false;
}

async function setupRedisAdapter(instance) {
  if (adapterReady) return;
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return;
  try {
    const pub = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 3 });
    const sub = pub.duplicate();
    await Promise.all([pub.connect(), sub.connect()]);
    instance.adapter(createAdapter(pub, sub));
    adapterReady = true;
    console.log('[WS] Redis adapter connected');
  } catch (error) {
    console.error('[WS] Redis adapter disabled:', error);
  }
}

async function getIo(req, res) {
  if (io) return io;

  const server = createServer();
  io = new Server(server, {
    cors: {
      origin: (origin, callback) => callback(allowedOrigin(origin) ? null : new Error('CORS blocked'), allowedOrigin(origin)),
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['polling', 'websocket'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  await setupRedisAdapter(io);

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || (socket.handshake.headers.authorization || '').replace('Bearer ', '');
    if (!token) {
      socket.data.userId = null;
      return next();
    }
    try {
      const parts = token.split('.');
      const payload = parts.length >= 2 ? JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8')) : null;
      socket.data.userId = payload?.sub || payload?.userId || null;
    } catch {
      socket.data.userId = null;
    }
    next();
  });

  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    if (userId) socket.join(`user:${userId}`);

    socket.on('interview:join', (sessionId) => socket.join(`interview:${sessionId}`));
    socket.on('interview:leave', (sessionId) => socket.leave(`interview:${sessionId}`));
    socket.on('ping', () => {
      socket.emit('notification', {
        id: `pong-${Date.now()}`,
        type: 'info',
        title: 'WebSocket Connected',
        message: `Connection healthy · transport=${socket.conn.transport.name}`,
        timestamp: Date.now(),
      });
    });
  });

  return io;
}

module.exports = async (req, res) => {
  if (req.url === '/healthz' || req.url === '/health') {
    return res.status(200).json({ ok: true, adapter: adapterReady ? 'redis' : 'memory', ts: Date.now() });
  }

  if (req.url === '/metrics') {
    return res.status(200).json({
      adapter: adapterReady ? 'redis' : 'memory',
      connections: io ? io.engine.clientsCount : 0,
      uptime: process.uptime(),
    });
  }

  if (!req.url.startsWith('/socket.io/')) {
    return res.status(200).json({ ok: true, service: 'websocket', hint: 'Use /socket.io/' });
  }

  const instance = await getIo(req, res);
  instance.engine.handleRequest(req, res);
};
