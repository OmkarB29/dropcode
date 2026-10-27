import { v4 as uuidv4 } from 'uuid';
import { SessionStore, sessionStore } from './SessionStore';
import { Session, FileManifestEntry, TransferState, ReceiverPeerInfo, ReceiverTransferState } from './types';
import { generateUniqueCode, sanitizeDeviceName } from '../utils/codeGenerator';
import { config } from '../config';

export class SessionManager {
  constructor(private store: SessionStore = sessionStore) {}

  /**
   * Creates a new DropCode file sharing session.
   */
  public createSession(
    deviceName: string,
    files: FileManifestEntry[],
    senderSocketId: string | null = null,
    autoApprove: boolean = true
  ): Session {
    if (!files || files.length === 0) {
      throw new Error('At least one file must be provided to create a session.');
    }

    if (files.length > config.maxFilesPerSession) {
      throw new Error(`Exceeded maximum file limit of ${config.maxFilesPerSession}.`);
    }

    const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);
    if (totalSize > config.maxTotalSizeBytes) {
      throw new Error(`Total file size exceeds limit of ${config.maxTotalSizeBytes} bytes.`);
    }

    const id = uuidv4();
    const code = generateUniqueCode((c) => this.store.isCodeTaken(c));
    const now = Date.now();
    const expiresAt = now + config.sessionTtlMs;

    const session: Session = {
      id,
      code,
      state: 'WAITING_FOR_RECEIVER',
      senderSocketId,
      receiverSocketId: null,
      receiverApproved: false,
      receivers: {},
      autoApprove,
      files,
      createdAt: now,
      expiresAt,
      senderDeviceName: sanitizeDeviceName(deviceName),
      connectionType: 'webrtc',
    };

    return this.store.createSession(session);
  }

  /**
   * Handles receiver attempting to join a session by short code.
   * Multiple receivers can join the same session concurrently.
   */
  public joinSession(
    code: string,
    deviceName: string,
    receiverSocketId: string
  ): { success: boolean; session?: Session; receiverId?: string; autoApproved?: boolean; error?: string } {
    const session = this.store.getByCode(code);
    if (!session) {
      return { success: false, error: 'Session not found or code is invalid.' };
    }

    if (this.store.isSessionExpired(session)) {
      this.store.delete(session.id);
      return { success: false, error: 'This session has expired.' };
    }

    // Do not allow joining if session was explicitly cancelled
    if (session.state === 'CANCELLED' || session.state === 'FAILED' || session.state === 'EXPIRED') {
      return {
        success: false,
        error: `Cannot join session in current state: ${session.state}`,
      };
    }

    const isAutoApproved = session.autoApprove ?? true;
    const sanitizedName = sanitizeDeviceName(deviceName);

    const receiverInfo: ReceiverPeerInfo = {
      id: receiverSocketId,
      deviceName: sanitizedName,
      joinedAt: Date.now(),
      approved: isAutoApproved,
      state: isAutoApproved ? 'APPROVED' : 'REQUESTED',
    };

    const receivers = { ...(session.receivers || {}) };
    receivers[receiverSocketId] = receiverInfo;

    const updated = this.store.update(session.id, {
      receivers,
      receiverSocketId,
      receiverDeviceName: sanitizedName,
      receiverApproved: isAutoApproved,
      state: session.state === 'WAITING_FOR_RECEIVER' && !isAutoApproved ? 'RECEIVER_REQUESTED' : session.state,
    });

    if (!updated) {
      return { success: false, error: 'Failed to update session for joining.' };
    }

    this.store.mapSocket(receiverSocketId, session.id, 'receiver');

    return {
      success: true,
      session: updated,
      receiverId: receiverSocketId,
      autoApproved: isAutoApproved,
    };
  }

  /**
   * Sender approves one or all receivers.
   */
  public approveReceiver(
    sessionId: string,
    receiverId?: string,
    senderSocketId?: string
  ): { success: boolean; session?: Session; approvedReceiverIds?: string[]; error?: string } {
    const session = this.store.getById(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found.' };
    }

    if (senderSocketId && session.senderSocketId && session.senderSocketId !== senderSocketId) {
      return { success: false, error: 'Unauthorized: only the sender can approve receivers.' };
    }

    const receivers = { ...(session.receivers || {}) };
    const approvedReceiverIds: string[] = [];

    if (receiverId) {
      if (!receivers[receiverId]) {
        return { success: false, error: 'Receiver not found in session.' };
      }
      receivers[receiverId] = {
        ...receivers[receiverId],
        approved: true,
        state: 'APPROVED',
      };
      approvedReceiverIds.push(receiverId);
    } else {
      // Approve all unapproved receivers
      for (const id of Object.keys(receivers)) {
        if (!receivers[id].approved) {
          receivers[id] = {
            ...receivers[id],
            approved: true,
            state: 'APPROVED',
          };
          approvedReceiverIds.push(id);
        }
      }
    }

    const updated = this.store.update(sessionId, {
      receivers,
      receiverApproved: true,
      senderSocketId: senderSocketId || session.senderSocketId,
    });

    return {
      success: true,
      session: updated ?? undefined,
      approvedReceiverIds,
    };
  }

  /**
   * Sender rejects a receiver.
   */
  public rejectReceiver(
    sessionId: string,
    receiverId?: string
  ): { success: boolean; session?: Session; rejectedReceiverIds?: string[]; error?: string } {
    const session = this.store.getById(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found.' };
    }

    const receivers = { ...(session.receivers || {}) };
    const rejectedReceiverIds: string[] = [];

    if (receiverId && receivers[receiverId]) {
      receivers[receiverId] = {
        ...receivers[receiverId],
        approved: false,
        state: 'REJECTED',
      };
      rejectedReceiverIds.push(receiverId);
    } else if (!receiverId) {
      for (const id of Object.keys(receivers)) {
        receivers[id] = {
          ...receivers[id],
          approved: false,
          state: 'REJECTED',
        };
        rejectedReceiverIds.push(id);
      }
    }

    const updated = this.store.update(sessionId, {
      receivers,
      receiverApproved: false,
    });

    return {
      success: true,
      session: updated ?? undefined,
      rejectedReceiverIds,
    };
  }

  /**
   * Update transfer state for a specific receiver or session.
   */
  public updateReceiverState(
    sessionId: string,
    receiverId: string,
    state: ReceiverTransferState
  ): { success: boolean; session?: Session } {
    const session = this.store.getById(sessionId);
    if (!session) return { success: false };

    const receivers = { ...(session.receivers || {}) };
    if (receivers[receiverId]) {
      receivers[receiverId] = {
        ...receivers[receiverId],
        state,
      };
    }

    const updated = this.store.update(sessionId, { receivers });
    return { success: true, session: updated ?? undefined };
  }

  /**
   * Marks a specific receiver transfer as completed.
   * Note: The session stays open for other receivers.
   */
  public completeReceiverTransfer(
    sessionId: string,
    receiverId: string
  ): { success: boolean; session?: Session } {
    return this.updateReceiverState(sessionId, receiverId, 'COMPLETED');
  }

  /**
   * Sender or receiver reports transfer completed for session.
   */
  public completeTransfer(
    sessionId: string
  ): { success: boolean; session?: Session; error?: string } {
    const session = this.store.getById(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found.' };
    }

    const updated = this.store.update(sessionId, {
      state: 'COMPLETED',
    });

    return { success: true, session: updated ?? undefined };
  }

  /**
   * Sender cancels the session for all peers.
   */
  public cancelSession(
    sessionId: string
  ): { success: boolean; session?: Session; error?: string } {
    const session = this.store.getById(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found.' };
    }

    const updated = this.store.update(sessionId, {
      state: 'CANCELLED',
    });

    return { success: true, session: updated ?? undefined };
  }

  /**
   * Sets session state (e.g. CONNECTING or TRANSFERRING).
   */
  public updateTransferState(
    sessionId: string,
    state: TransferState
  ): { success: boolean; session?: Session; error?: string } {
    const session = this.store.getById(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found.' };
    }

    const updated = this.store.update(sessionId, { state });
    return { success: true, session: updated ?? undefined };
  }

  /**
   * Handles sender socket disconnect.
   * Emits session:sender-disconnected to all connected receivers and marks session as FAILED.
   */
  public handleSenderDisconnect(socketId: string): { session: Session; receiverIds: string[] } | null {
    const mapping = this.store.getSessionBySocketId(socketId);
    if (!mapping || mapping.role !== 'sender') {
      return null;
    }

    const { session } = mapping;
    this.store.unmapSocket(socketId);

    const receiverIds = Object.keys(session.receivers || {}).filter(
      (id) => session.receivers[id].state !== 'DISCONNECTED' && session.receivers[id].state !== 'COMPLETED'
    );

    // If session is already in a terminal state, don't overwrite
    const terminalStates: TransferState[] = ['CANCELLED', 'EXPIRED', 'FAILED'];
    if (terminalStates.includes(session.state)) {
      return { session, receiverIds };
    }

    const updated = this.store.update(session.id, {
      senderSocketId: null,
      state: 'FAILED',
    });

    return { session: updated || session, receiverIds };
  }

  /**
   * Handles receiver socket disconnect.
   * Only marks this receiver as DISCONNECTED. The session remains open for other receivers.
   */
  public handleReceiverDisconnect(socketId: string): { session: Session; receiverId: string } | null {
    const mapping = this.store.getSessionBySocketId(socketId);
    if (!mapping || mapping.role !== 'receiver') {
      return null;
    }

    const { session } = mapping;
    this.store.unmapSocket(socketId);

    const receivers = { ...(session.receivers || {}) };
    if (receivers[socketId]) {
      receivers[socketId] = {
        ...receivers[socketId],
        state: 'DISCONNECTED',
      };
    }

    const updated = this.store.update(session.id, { receivers });
    return { session: updated || session, receiverId: socketId };
  }

  public getSessionById(sessionId: string): Session | undefined {
    return this.store.getById(sessionId);
  }

  public getSessionByCode(code: string): Session | undefined {
    return this.store.getByCode(code);
  }

  public deleteSession(sessionId: string): boolean {
    return this.store.delete(sessionId);
  }

  public getActiveCount(): number {
    return this.store.count();
  }
}

export const sessionManager = new SessionManager();
