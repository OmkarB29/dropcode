import { FastifyPluginAsync } from 'fastify';
import { sessionManager } from '../session/SessionManager';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (_request, reply) => {
    return reply.status(200).send({
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      sessions: sessionManager.getActiveCount(),
      timestamp: new Date().toISOString(),
    });
  });
};
