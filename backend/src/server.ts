import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { Server as SocketIOServer } from 'socket.io';
import { config } from './config';
import { setupSocketIO } from './socket';
import { healthRoutes } from './routes/health';
import { sessionRoutes } from './routes/sessions';
import { sessionStore } from './session/SessionStore';
import { rateLimiter } from './utils/rateLimiter';

export interface AppInstance {
  fastify: FastifyInstance;
  io: SocketIOServer;
  start: () => Promise<void>;
  close: () => Promise<void>;
}

export function buildApp(): AppInstance {
  const fastify = Fastify({
    logger: {
      level: config.nodeEnv === 'production' ? 'info' : 'debug',
      redact: ['req.headers.authorization', 'req.headers.cookie'],
    },
    trustProxy: true,
  });

  // Setup Socket.IO on the underlying HTTP server
  const io = setupSocketIO(fastify.server);
  fastify.decorate('io', io);

  // Register CORS
  fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin) {
        return cb(null, true);
      }
      const cleanOrigin = origin.replace(/\/+$/, '');
      if (
        config.allowedFrontendUrls.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.vercel.app') ||
        (config.nodeEnv === 'development' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin))
      ) {
        return cb(null, true);
      }
      cb(new Error(`Not allowed by CORS: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Register Rate Limiting for Fastify routes
  fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    allowList: ['127.0.0.1'],
  });

  // Root endpoint
  fastify.get('/', async (_request, reply) => {
    return reply.status(200).send({
      name: 'DropCode Signaling & Session Server',
      version: '1.0.0',
      status: 'active',
      docs: '/api/health',
    });
  });

  // Register API Routes
  fastify.register(healthRoutes, { prefix: '/api' });
  fastify.register(sessionRoutes, { prefix: '/api', io });

  // Lifecycle management
  const start = async () => {
    try {
      await fastify.listen({ port: config.port, host: '0.0.0.0' });
      fastify.log.info(
        `DropCode backend server running at http://localhost:${config.port}`
      );
      fastify.log.info(`Allowed frontend URL: ${config.frontendUrl}`);
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  };

  const close = async () => {
    sessionStore.stop();
    rateLimiter.stop();
    io.close();
    await fastify.close();
  };

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    fastify.log.info(`Received ${signal}. Shutting down gracefully...`);
    try {
      await close();
      process.exit(0);
    } catch (err) {
      fastify.log.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));

  return { fastify, io, start, close };
}

// Start server if executed directly
if (require.main === module) {
  const app = buildApp();
  app.start();
}
