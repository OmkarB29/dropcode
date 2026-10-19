import { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { sessionManager } from '../session/SessionManager';
import { sessionStore } from '../session/SessionStore';
import { CreateSessionPayloadSchema } from '../session/types';
import { rateLimiter } from '../utils/rateLimiter';
import { config } from '../config';
import { Server as SocketIOServer } from 'socket.io';

export const sessionRoutes: FastifyPluginAsync<{ io?: SocketIOServer }> = async (
  fastify,
  opts
) => {
  const getIO = (): SocketIOServer | undefined => {
    return opts.io || (fastify as any).io;
  };

  /**
   * POST /api/sessions
   * Creates a new file-sharing session
   */
  fastify.post('/sessions', async (request, reply) => {
    const clientIp = request.ip || 'unknown';

    // Rate limit session creation
    const rateCheck = rateLimiter.check(
      clientIp,
      'create-session',
      config.rateLimits.createPerMinute
    );
    if (!rateCheck.allowed) {
      const retryAfterSeconds = Math.ceil((rateCheck.resetAt - Date.now()) / 1000);
      reply.header('Retry-After', retryAfterSeconds);
      return reply.status(429).send({
        error: 'Too Many Requests',
        message: `Session creation limit exceeded. Please try again in ${retryAfterSeconds} seconds.`,
      });
    }

    // Validate body
    const parseResult = CreateSessionPayloadSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid session payload',
        details: parseResult.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    try {
      const { deviceName, files } = parseResult.data;
      const session = sessionManager.createSession(deviceName, files);

      return reply.status(201).send({
        sessionId: session.id,
        code: session.code,
        expiresAt: session.expiresAt,
      });
    } catch (err: any) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: err.message || 'Failed to create session.',
      });
    }
  });

  /**
   * GET /api/sessions/:code
   * Retrieves public session details by short code
   */
  fastify.get<{ Params: { code: string } }>('/sessions/:code', async (request, reply) => {
    const rawCode = request.params.code;
    const clientIp = request.ip || 'unknown';

    // Rate limit join/lookup attempts
    const rateCheck = rateLimiter.check(
      clientIp,
      'lookup-session',
      config.rateLimits.joinPerMinute
    );
    if (!rateCheck.allowed) {
      const retryAfterSeconds = Math.ceil((rateCheck.resetAt - Date.now()) / 1000);
      reply.header('Retry-After', retryAfterSeconds);
      return reply.status(429).send({
        error: 'Too Many Requests',
        message: `Too many lookup attempts. Please try again in ${retryAfterSeconds} seconds.`,
      });
    }

    if (!rawCode || typeof rawCode !== 'string') {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'A valid session code is required.',
      });
    }

    const session = sessionManager.getSessionByCode(rawCode);
    if (!session) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Session not found or has expired.',
      });
    }

    if (sessionStore.isSessionExpired(session)) {
      sessionStore.delete(session.id);
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Session has expired.',
      });
    }

    // Return sanitized public session details (no socket IDs)
    return reply.status(200).send(sessionStore.toPublicSession(session));
  });

  /**
   * POST /api/sessions/:id/cancel
   * Cancels an active session
   */
  fastify.post<{ Params: { id: string } }>('/sessions/:id/cancel', async (request, reply) => {
    const sessionId = request.params.id;
    const session = sessionManager.getSessionById(sessionId);

    if (!session) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Session not found.',
      });
    }

    sessionManager.cancelSession(sessionId);

    // Notify connected sockets via Socket.IO
    const io = getIO();
    if (io) {
      if (session.receiverSocketId) {
        io.to(session.receiverSocketId).emit('transfer:cancelled', { sessionId });
      }
      if (session.senderSocketId) {
        io.to(session.senderSocketId).emit('transfer:cancelled', { sessionId });
      }
    }

    return reply.status(200).send({
      success: true,
      message: 'Session cancelled successfully.',
    });
  });

  /**
   * POST /api/sessions/:id/relay
   * Server-relayed fallback transfer endpoint when direct WebRTC fails
   */
  const RelayChunkSchema = z.object({
    fileId: z.string().min(1),
    chunkIndex: z.number().int().nonnegative(),
    totalChunks: z.number().int().positive(),
    data: z.string().min(1), // Base64 or string chunk payload
    role: z.enum(['sender', 'receiver']).default('sender'),
  });

  fastify.post<{ Params: { id: string } }>('/sessions/:id/relay', async (request, reply) => {
    const sessionId = request.params.id;
    const session = sessionManager.getSessionById(sessionId);

    if (!session) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Session not found.',
      });
    }

    if (session.state !== 'TRANSFERRING' && session.state !== 'RECEIVER_APPROVED' && session.state !== 'CONNECTING') {
      return reply.status(400).send({
        error: 'Bad Request',
        message: `Cannot relay chunk in session state: ${session.state}`,
      });
    }

    const parseResult = RelayChunkSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Invalid relay chunk payload',
        details: parseResult.error.issues,
      });
    }

    // Mark connectionType as relay
    session.connectionType = 'relay';
    session.state = 'TRANSFERRING';

    const { fileId, chunkIndex, totalChunks, data, role } = parseResult.data;
    const io = getIO();

    if (io) {
      const targetSocketId = role === 'sender' ? session.receiverSocketId : session.senderSocketId;
      if (targetSocketId) {
        io.to(targetSocketId).emit('relay:chunk', {
          sessionId,
          fileId,
          chunkIndex,
          totalChunks,
          data,
          relayed: true,
        });
      }
    }

    return reply.status(200).send({
      success: true,
      relayed: true,
      chunkIndex,
    });
  });
};
