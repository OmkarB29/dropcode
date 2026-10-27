import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { FastifyInstance } from 'fastify';
import { registerSenderHandlers } from './senderHandlers';
import { registerReceiverHandlers } from './receiverHandlers';
import { sessionManager } from '../session/SessionManager';
import { sessionStore } from '../session/SessionStore';
import { config } from '../config';

export function setupSocketIO(server: HttpServer | FastifyInstance['server']): SocketIOServer {
  const allowedOrigins = [config.frontendUrl];

  const io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, same-origin)
        if (!origin) {
          return callback(null, true);
        }

        const cleanOrigin = origin.replace(/\/+$/, '');
        if (
          config.allowedFrontendUrls.includes(cleanOrigin) ||
          cleanOrigin.endsWith('.vercel.app') ||
          (config.nodeEnv === 'development' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(cleanOrigin))
        ) {
          return callback(null, true);
        }

        callback(new Error(`CORS origin not allowed by DropCode backend: ${origin}`));
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 25000,
    maxHttpBufferSize: 1e8, // 100 MB buffer for binary file chunks
  });

  // Wire up session store lifecycle events to emit socket notifications
  sessionStore.on('expired', (session) => {
    const payload = { sessionId: session.id };
    if (session.senderSocketId) {
      io.to(session.senderSocketId).emit('session:expired', payload);
    }
    if (session.receivers) {
      for (const receiverId of Object.keys(session.receivers)) {
        io.to(receiverId).emit('session:expired', payload);
      }
    } else if (session.receiverSocketId) {
      io.to(session.receiverSocketId).emit('session:expired', payload);
    }
  });

  sessionStore.on('expiringSoon', (session, secondsRemaining) => {
    const payload = { sessionId: session.id, secondsRemaining };
    if (session.senderSocketId) {
      io.to(session.senderSocketId).emit('session:expiring-soon', payload);
    }
    if (session.receivers) {
      for (const receiverId of Object.keys(session.receivers)) {
        io.to(receiverId).emit('session:expiring-soon', payload);
      }
    } else if (session.receiverSocketId) {
      io.to(session.receiverSocketId).emit('session:expiring-soon', payload);
    }
  });

  io.on('connection', (socket: Socket) => {
    // Register event handlers
    registerSenderHandlers(io, socket);
    registerReceiverHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      // Check if disconnected socket was sender
      const senderResult = sessionManager.handleSenderDisconnect(socket.id);
      if (senderResult) {
        const { session, receiverIds } = senderResult;
        for (const rId of receiverIds) {
          io.to(rId).emit('session:sender-disconnected', {
            sessionId: session.id,
          });
        }
      }

      // Check if disconnected socket was receiver
      const receiverResult = sessionManager.handleReceiverDisconnect(socket.id);
      if (receiverResult) {
        const { session, receiverId } = receiverResult;
        if (session.senderSocketId) {
          io.to(session.senderSocketId).emit('session:receiver-disconnected', {
            sessionId: session.id,
            receiverId,
          });
        }
      }
    });
  });

  return io;
}
