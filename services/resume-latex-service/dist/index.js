import Fastify from 'fastify';
import { registerResumeRoutes } from './routes/resume.js';
const port = Number(process.env.PORT ?? '8080');
const host = process.env.HOST ?? '0.0.0.0';
async function buildServer() {
    const app = Fastify({
        logger: true,
        bodyLimit: 1_000_000, // ~1MB
    });
    await registerResumeRoutes(app);
    app.get('/healthz', async () => ({ ok: true }));
    return app;
}
const app = await buildServer();
await app.listen({ port, host });
