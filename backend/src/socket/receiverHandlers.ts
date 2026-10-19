import { Server, Socket } from 'socket.io';
import { sessionManager } from '../session/SessionManager';
import { sessionStore } from '../session/SessionStore';
import { rateLimiter } from '../utils/rateLimiter';
import { config } from '../config';
import {
  JoinSessionPayloadSchema,
  SessionIdPayloadSchema,
  WebRTCSignalPayloadSchema,
} from '../session/types';

export function registerReceiverHandlers(io: Server, socket: Socket): void {
  const clientIp = socket.handshake.address || socket.conn.remoteAddress || 'unknown';

  /**
   * receiver:join
   */
  socket.on('receiver:join', (rawPayload: unknown, callback?: (res: any) => void) => {
    // 1. Rate limit join attempts per IP
    const rateCheck = rateLimiter.check(
      clientIp,
      'join-session',
      config.rateLimits.joinPerMinute
    );
    if (!rateCheck.allowed) {
      const err = {
        success: false,
        error: `Too many join attempts. Please try again in ${Math.ceil(
          (rateCheck.resetAt - Date.now()) / 1000
        )} seconds.`,
      };
      if (typeof callback === 'function') callback(err);
      return;
    }

    // 2. Validate payload
    const parsed = JoinSessionPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) {
      const err = {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(', '),
      };
      if (typeof callback === 'function') callback(err);
      return;
    }

    const { code, deviceName } = parsed.data;
    const result = sessionManager.joinSession(code, deviceName, socket.id);

    if (!result.success || !result.session) {
      const err = {
        success: false,
        error: result.error || 'Failed to join session.',
      };
      if (typeof callback === 'function') callback(err);
      return;
    }

    const session = result.session;
    socket.join(`session:${session.id}`);

    // Notify sender that a receiver joined
    if (session.senderSocketId) {
      io.to(session.senderSocketId).emit('session:receiver-joined', {
        receiverDeviceName: session.receiverDeviceName || 'Unknown Device',
        receiverId: socket.id,
      });
    }

    // Acknowledge receiver
    if (typeof callback === 'function') {
      callback({
        success: true,
        sessionId: session.id,
        senderDeviceName: session.senderDeviceName,
        files: session.files,
        expiresAt: session.expiresAt,
      });
    }
  });

  /**
   * receiver:accept
   */
  socket.on('receiver:accept', (rawPayload: unknown, callback?: (res: any) => void) => {
    const parsed = SessionIdPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) {
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Invalid payload: sessionId required.' });
      }
      return;
    }

    const { sessionId } = parsed.data;
    const session = sessionStore.getById(sessionId);
    if (!session) {
      if (typeof callback === 'function') callback({ success: false, error: 'Session not found.' });
      return;
    }

    // Inform sender that receiver accepted and is ready for transfer
    if (session.senderSocketId) {
      io.to(session.senderSocketId).emit('receiver:accepted', {
        sessionId,
      });
    }

    if (typeof callback === 'function') {
      callback({ success: true });
    }
  });

  /**
   * receiver:reject
   */
  socket.on('receiver:reject', (rawPayload: unknown, callback?: (res: any) => void) => {
    const parsed = SessionIdPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) {
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Invalid payload: sessionId required.' });
      }
      return;
    }

    const { sessionId } = parsed.data;
    const session = sessionStore.getById(sessionId);
    if (!session) {
      if (typeof callback === 'function') callback({ success: false, error: 'Session not found.' });
      return;
    }

    sessionManager.rejectReceiver(sessionId);

    // Notify sender of rejection
    if (session.senderSocketId) {
      io.to(session.senderSocketId).emit('transfer:rejected', { sessionId });
    }

    if (typeof callback === 'function') {
      callback({ success: true });
    }
  });

  /**
   * receiver:webrtc-signal
   */
  socket.on('receiver:webrtc-signal', (rawPayload: unknown) => {
    const parsed = WebRTCSignalPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) return;

    const { sessionId, signal } = parsed.data;
    const session = sessionStore.getById(sessionId);
    if (!session || !session.senderSocketId) return;

    // Transition state to TRANSFERRING if connecting
    if (session.state === 'CONNECTING') {
      sessionManager.updateTransferState(sessionId, 'TRANSFERRING');
    }

    // Relay signal to sender
    io.to(session.senderSocketId).emit('receiver:webrtc-signal', {
      sessionId,
      signal,
    });
  });

  /**
   * receiver:transfer-complete
   */
  socket.on('receiver:transfer-complete', (rawPayload: unknown, callback?: (res: any) => void) => {
    const parsed = SessionIdPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) {
      if (typeof callback === 'function') callback({ success: false, error: 'Invalid payload.' });
      return;
    }

    const { sessionId } = parsed.data;
    const result = sessionManager.completeTransfer(sessionId);

    const session = sessionStore.getById(sessionId);
    if (session && session.senderSocketId) {
      io.to(session.senderSocketId).emit('transfer:completed', { sessionId });
    }

    if (typeof callback === 'function') {
      callback({ success: result.success });
    }
  });
}
