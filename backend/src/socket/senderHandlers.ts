import { Server, Socket } from 'socket.io';
import { sessionManager } from '../session/SessionManager';
import { sessionStore } from '../session/SessionStore';
import { rateLimiter } from '../utils/rateLimiter';
import { config } from '../config';
import {
  CreateSessionPayloadSchema,
  SessionIdPayloadSchema,
  ApproveReceiverPayloadSchema,
  RejectReceiverPayloadSchema,
  WebRTCSignalPayloadSchema,
} from '../session/types';

export function registerSenderHandlers(io: Server, socket: Socket): void {
  const clientIp = socket.handshake.address || socket.conn.remoteAddress || 'unknown';

  /**
   * sender:create-session
   */
  socket.on('sender:create-session', (rawPayload: unknown, callback?: (res: any) => void) => {
    // 1. Rate limiting
    const rateCheck = rateLimiter.check(
      clientIp,
      'create-session',
      config.rateLimits.createPerMinute
    );
    if (!rateCheck.allowed) {
      const err = {
        success: false,
        error: `Rate limit exceeded. Try again in ${Math.ceil(
          (rateCheck.resetAt - Date.now()) / 1000
        )} seconds.`,
      };
      if (typeof callback === 'function') callback(err);
      return;
    }

    // 2. Validate payload
    const parsed = CreateSessionPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) {
      const err = {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(', '),
      };
      if (typeof callback === 'function') callback(err);
      return;
    }

    try {
      const { deviceName, files, autoApprove } = parsed.data;
      const session = sessionManager.createSession(deviceName, files, socket.id, autoApprove ?? true);

      socket.join(`session:${session.id}`);

      const response = {
        success: true,
        sessionId: session.id,
        code: session.code,
        expiresAt: session.expiresAt,
        autoApprove: session.autoApprove,
      };

      if (typeof callback === 'function') {
        callback(response);
      }
    } catch (error: any) {
      const err = {
        success: false,
        error: error.message || 'Failed to create session.',
      };
      if (typeof callback === 'function') callback(err);
    }
  });

  /**
   * sender:join / sender:bind
   * Allows a sender who created a session via REST to bind their socket
   */
  socket.on('sender:join', (rawPayload: unknown, callback?: (res: any) => void) => {
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

    sessionStore.update(sessionId, { senderSocketId: socket.id });
    socket.join(`session:${sessionId}`);

    if (typeof callback === 'function') {
      callback({
        success: true,
        sessionId: session.id,
        code: session.code,
        state: session.state,
        autoApprove: session.autoApprove,
        receiverApproved: session.receiverApproved,
      });
    }
  });

  /**
   * sender:approve-receiver
   */
  socket.on('sender:approve-receiver', (rawPayload: unknown, callback?: (res: any) => void) => {
    const parsed = ApproveReceiverPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) {
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Invalid payload: sessionId required.' });
      }
      return;
    }

    const { sessionId, receiverId } = parsed.data;
    const result = sessionManager.approveReceiver(sessionId, receiverId, socket.id);

    if (!result.success || !result.session) {
      if (typeof callback === 'function') {
        callback({ success: false, error: result.error || 'Failed to approve receiver.' });
      }
      return;
    }

    // Notify approved receiver(s)
    if (result.approvedReceiverIds && result.approvedReceiverIds.length > 0) {
      for (const id of result.approvedReceiverIds) {
        io.to(id).emit('transfer:approved', {
          sessionId: result.session.id,
        });
      }
    } else if (result.session.receiverSocketId) {
      io.to(result.session.receiverSocketId).emit('transfer:approved', {
        sessionId: result.session.id,
      });
    }

    if (typeof callback === 'function') {
      callback({ success: true, approvedReceiverIds: result.approvedReceiverIds });
    }
  });

  /**
   * sender:reject-receiver
   */
  socket.on('sender:reject-receiver', (rawPayload: unknown, callback?: (res: any) => void) => {
    const parsed = RejectReceiverPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) {
      if (typeof callback === 'function') {
        callback({ success: false, error: 'Invalid payload: sessionId required.' });
      }
      return;
    }

    const { sessionId, receiverId } = parsed.data;
    const result = sessionManager.rejectReceiver(sessionId, receiverId);

    if (!result.success) {
      if (typeof callback === 'function') callback({ success: false, error: result.error });
      return;
    }

    // Notify receiver(s)
    if (result.rejectedReceiverIds && result.rejectedReceiverIds.length > 0) {
      for (const id of result.rejectedReceiverIds) {
        io.to(id).emit('transfer:rejected', { sessionId });
        io.to(id).emit('receiver:rejected', { sessionId });
      }
    } else if (receiverId) {
      io.to(receiverId).emit('transfer:rejected', { sessionId });
      io.to(receiverId).emit('receiver:rejected', { sessionId });
    }

    if (typeof callback === 'function') {
      callback({ success: true });
    }
  });

  /**
   * sender:cancel
   */
  socket.on('sender:cancel', (rawPayload: unknown, callback?: (res: any) => void) => {
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

    sessionManager.cancelSession(sessionId);

    // Notify all receivers in session
    if (session.receivers) {
      for (const rId of Object.keys(session.receivers)) {
        io.to(rId).emit('transfer:cancelled', { sessionId });
      }
    }
    if (session.receiverSocketId) {
      io.to(session.receiverSocketId).emit('transfer:cancelled', { sessionId });
    }

    if (typeof callback === 'function') {
      callback({ success: true });
    }
  });

  /**
   * sender:webrtc-signal
   */
  socket.on('sender:webrtc-signal', (rawPayload: unknown) => {
    const parsed = WebRTCSignalPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) return;

    const { sessionId, signal, targetReceiverId } = parsed.data;
    const session = sessionStore.getById(sessionId);
    if (!session) return;

    const targetSocket = targetReceiverId || session.receiverSocketId;
    if (!targetSocket) return;

    // Relay signal to specific receiver
    io.to(targetSocket).emit('sender:webrtc-signal', {
      sessionId,
      signal,
    });
  });

  /**
   * sender:transfer-complete
   */
  socket.on('sender:transfer-complete', (rawPayload: unknown, callback?: (res: any) => void) => {
    const parsed = SessionIdPayloadSchema.safeParse(rawPayload);
    if (!parsed.success) {
      if (typeof callback === 'function') callback({ success: false, error: 'Invalid payload.' });
      return;
    }

    const { sessionId } = parsed.data;
    const result = sessionManager.completeTransfer(sessionId);

    if (typeof callback === 'function') {
      callback({ success: result.success });
    }
  });

  /**
   * WebSocket Relay file transfer handlers (supports multi-receiver targeting)
   */
  socket.on('relay:start', (data: { sessionId: string; targetReceiverId?: string; manifest: any }) => {
    if (!data?.sessionId) return;
    const session = sessionStore.getById(data.sessionId);
    if (!session) return;

    const targetSocket = data.targetReceiverId || session.receiverSocketId;
    if (!targetSocket) return;

    sessionManager.updateReceiverState(data.sessionId, targetSocket, 'TRANSFERRING');
    io.to(targetSocket).emit('relay:start', data.manifest);
  });

  socket.on('relay:file-start', (data: { sessionId: string; targetReceiverId?: string; fileInfo: any }) => {
    if (!data?.sessionId) return;
    const session = sessionStore.getById(data.sessionId);
    if (!session) return;

    const targetSocket = data.targetReceiverId || session.receiverSocketId;
    if (!targetSocket) return;

    io.to(targetSocket).emit('relay:file-start', data.fileInfo);
  });

  socket.on('relay:chunk', (data: { sessionId: string; targetReceiverId?: string; chunk: any }, ack?: (res?: any) => void) => {
    if (!data?.sessionId) {
      if (typeof ack === 'function') ack({ success: false, error: 'No sessionId' });
      return;
    }
    const session = sessionStore.getById(data.sessionId);
    if (!session) {
      if (typeof ack === 'function') ack({ success: false, error: 'Session not found' });
      return;
    }

    const targetSocket = data.targetReceiverId || session.receiverSocketId;
    if (!targetSocket) {
      if (typeof ack === 'function') ack({ success: false, error: 'Receiver not connected' });
      return;
    }

    io.to(targetSocket).emit('relay:chunk', data.chunk);
    if (typeof ack === 'function') ack({ success: true });
  });

  socket.on('relay:file-end', (data: { sessionId: string; targetReceiverId?: string; fileId: string }) => {
    if (!data?.sessionId) return;
    const session = sessionStore.getById(data.sessionId);
    if (!session) return;

    const targetSocket = data.targetReceiverId || session.receiverSocketId;
    if (!targetSocket) return;

    io.to(targetSocket).emit('relay:file-end', { fileId: data.fileId });
  });

  socket.on('relay:complete', (data: { sessionId: string; targetReceiverId?: string }) => {
    if (!data?.sessionId) return;
    const session = sessionStore.getById(data.sessionId);
    if (!session) return;

    const targetSocket = data.targetReceiverId || session.receiverSocketId;
    if (!targetSocket) return;

    sessionManager.completeReceiverTransfer(data.sessionId, targetSocket);
    io.to(targetSocket).emit('relay:complete');
  });
}
