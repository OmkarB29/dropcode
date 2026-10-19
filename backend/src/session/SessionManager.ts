import { v4 as uuidv4 } from 'uuid';
import { SessionStore, sessionStore } from './SessionStore';
import { Session, FileManifestEntry, TransferState } from './types';
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
    senderSocketId: string | null = null
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
   */
  public joinSession(
    code: string,
    deviceName: string,
    receiverSocketId: string
  ): { success: boolean; session?: Session; error?: string } {
    const session = this.store.getByCode(code);
    if (!session) {
      return { success: false, error: 'Session not found or code is invalid.' };
    }

    if (this.store.isSessionExpired(session)) {
      this.store.delete(session.id);
      return { success: false, error: 'This session has expired.' };
    }

    if (session.state !== 'WAITING_FOR_RECEIVER' && session.state !== 'RECEIVER_REQUESTED') {
      return {
        success: false,
        error: `Cannot join session in current state: ${session.state}`,
      };
    }

    const updated = this.store.update(session.id, {
      receiverSocketId,
      receiverDeviceName: sanitizeDeviceName(deviceName),
      state: 'RECEIVER_REQUESTED',
    });

    if (!updated) {
      return { success: false, error: 'Failed to update session for joining.' };
    }

    return { success: true, session: updated };
  }

  /**
   * Sender approves the receiver.
   */
  public approveReceiver(
    sessionId: string,
    senderSocketId?: string
  ): { success: boolean; session?: Session; error?: string } {
    const session = this.store.getById(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found.' };
    }

    if (senderSocketId && session.senderSocketId && session.senderSocketId !== senderSocketId) {
      return { success: false, error: 'Unauthorized: only the sender can approve the receiver.' };
    }

    if (session.state !== 'RECEIVER_REQUESTED') {
      return {
        success: false,
        error: `Cannot approve receiver in state: ${session.state}`,
      };
    }

    const updated = this.store.update(sessionId, {
      receiverApproved: true,
      state: 'RECEIVER_APPROVED',
      senderSocketId: senderSocketId || session.senderSocketId,
    });

    return { success: true, session: updated ?? undefined };
  }

  /**
   * Sender or receiver rejects the transfer.
   */
  public rejectReceiver(
    sessionId: string
  ): { success: boolean; session?: Session; error?: string } {
    const session = this.store.getById(sessionId);
    if (!session) {
      return { success: false, error: 'Session not found.' };
    }

    const updated = this.store.update(sessionId, {
      receiverApproved: false,
      state: 'REJECTED',
    });

    return { success: true, session: updated ?? undefined };
  }

  /**
   * Sender or receiver cancels the session.
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
   * Sets state to CONNECTING or TRANSFERRING.
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
   * Sender or receiver reports transfer completed.
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
   * Handles sender socket disconnect.
   * Emits session:sender-disconnected to any connected receiver and marks session as FAILED.
   */
  public handleSenderDisconnect(socketId: string): Session | null {
    const mapping = this.store.getSessionBySocketId(socketId);
    if (!mapping || mapping.role !== 'sender') {
      return null;
    }

    const { session } = mapping;
    this.store.unmapSocket(socketId);

    // If session is already in a terminal state, don't overwrite
    const terminalStates: TransferState[] = ['COMPLETED', 'CANCELLED', 'EXPIRED', 'FAILED'];
    if (terminalStates.includes(session.state)) {
      return session;
    }

    const updated = this.store.update(session.id, {
      senderSocketId: null,
      state: 'FAILED',
    });

    return updated || session;
  }

  /**
   * Handles receiver socket disconnect.
   * If in RECEIVER_REQUESTED state, resets session to WAITING_FOR_RECEIVER.
   */
  public handleReceiverDisconnect(socketId: string): Session | null {
    const mapping = this.store.getSessionBySocketId(socketId);
    if (!mapping || mapping.role !== 'receiver') {
      return null;
    }

    const { session } = mapping;
    this.store.unmapSocket(socketId);

    if (session.state === 'RECEIVER_REQUESTED') {
      const updated = this.store.update(session.id, {
        receiverSocketId: null,
        receiverDeviceName: undefined,
        receiverApproved: false,
        state: 'WAITING_FOR_RECEIVER',
      });
      return updated || session;
    }

    if (session.state === 'RECEIVER_APPROVED' || session.state === 'CONNECTING' || session.state === 'TRANSFERRING') {
      const updated = this.store.update(session.id, {
        receiverSocketId: null,
        state: 'FAILED',
      });
      return updated || session;
    }

    return session;
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
