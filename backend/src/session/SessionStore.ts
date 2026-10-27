import { EventEmitter } from 'events';
import { Session, TransferState, PublicSession } from './types';
import { config } from '../config';

export interface SessionStoreEvents {
  expired: (session: Session) => void;
  expiringSoon: (session: Session, secondsRemaining: number) => void;
}

export class SessionStore extends EventEmitter {
  private sessions: Map<string, Session> = new Map();
  private codeToId: Map<string, string> = new Map();
  private socketToSession: Map<string, { sessionId: string; role: 'sender' | 'receiver' }> = new Map();
  private notifiedExpiringSoon: Set<string> = new Set();
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(private cleanupIntervalMs: number = config.cleanupIntervalMs) {
    super();
    this.startCleanupTimer();
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, this.cleanupIntervalMs);
    if (this.cleanupTimer.unref) {
      this.cleanupTimer.unref();
    }
  }

  public createSession(session: Session): Session {
    session.receivers = session.receivers || {};
    session.autoApprove = session.autoApprove ?? true;

    this.sessions.set(session.id, session);
    this.codeToId.set(session.code.toUpperCase(), session.id);

    if (session.senderSocketId) {
      this.mapSocket(session.senderSocketId, session.id, 'sender');
    }
    if (session.receiverSocketId) {
      this.mapSocket(session.receiverSocketId, session.id, 'receiver');
    }
    for (const receiverId of Object.keys(session.receivers)) {
      this.mapSocket(receiverId, session.id, 'receiver');
    }

    return session;
  }

  public getById(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  public getByCode(code: string): Session | undefined {
    const sessionId = this.codeToId.get(code.toUpperCase());
    if (!sessionId) return undefined;
    return this.sessions.get(sessionId);
  }

  public isCodeTaken(code: string): boolean {
    const existing = this.getByCode(code);
    if (!existing) return false;
    // If existing session is expired or completed/cancelled, treat as available or cleanup
    if (this.isSessionExpired(existing)) {
      this.delete(existing.id);
      return false;
    }
    return true;
  }

  public update(id: string, updates: Partial<Session>): Session | null {
    const session = this.sessions.get(id);
    if (!session) return null;

    // If socket IDs are changing, update socket mappings
    if (updates.senderSocketId !== undefined && updates.senderSocketId !== session.senderSocketId) {
      if (session.senderSocketId) {
        this.unmapSocket(session.senderSocketId);
      }
      if (updates.senderSocketId) {
        this.mapSocket(updates.senderSocketId, id, 'sender');
      }
    }

    if (updates.receiverSocketId !== undefined && updates.receiverSocketId !== session.receiverSocketId) {
      if (session.receiverSocketId) {
        this.unmapSocket(session.receiverSocketId);
      }
      if (updates.receiverSocketId) {
        this.mapSocket(updates.receiverSocketId, id, 'receiver');
      }
    }

    const updatedSession: Session = {
      ...session,
      ...updates,
    };

    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  public updateState(id: string, state: TransferState): boolean {
    const session = this.sessions.get(id);
    if (!session) return false;
    session.state = state;
    return true;
  }

  public delete(id: string): boolean {
    const session = this.sessions.get(id);
    if (!session) return false;

    if (session.senderSocketId) {
      this.unmapSocket(session.senderSocketId);
    }
    if (session.receiverSocketId) {
      this.unmapSocket(session.receiverSocketId);
    }
    if (session.receivers) {
      for (const receiverId of Object.keys(session.receivers)) {
        this.unmapSocket(receiverId);
      }
    }

    this.codeToId.delete(session.code.toUpperCase());
    this.notifiedExpiringSoon.delete(id);
    return this.sessions.delete(id);
  }

  public list(): Session[] {
    return Array.from(this.sessions.values());
  }

  public count(): number {
    return this.sessions.size;
  }

  public toPublicSession(session: Session): PublicSession {
    const { senderSocketId, receiverSocketId, ...publicFields } = session;
    return {
      ...publicFields,
      receiverCount: Object.keys(session.receivers || {}).length,
    };
  }

  public mapSocket(socketId: string, sessionId: string, role: 'sender' | 'receiver'): void {
    this.socketToSession.set(socketId, { sessionId, role });
  }

  public unmapSocket(socketId: string): void {
    this.socketToSession.delete(socketId);
  }

  public getSessionBySocketId(socketId: string): { session: Session; role: 'sender' | 'receiver' } | null {
    const mapping = this.socketToSession.get(socketId);
    if (!mapping) return null;
    const session = this.sessions.get(mapping.sessionId);
    if (!session) {
      this.socketToSession.delete(socketId);
      return null;
    }
    return { session, role: mapping.role };
  }

  public isSessionExpired(session: Session): boolean {
    return Date.now() >= session.expiresAt;
  }

  public cleanup(): void {
    const now = Date.now();
    const thresholdMs = config.expiringSoonThresholdMs;

    for (const [id, session] of this.sessions.entries()) {
      // 1. Check if completely expired
      if (now >= session.expiresAt) {
        session.state = 'EXPIRED';
        this.emit('expired', session);
        this.delete(id);
        continue;
      }

      // 2. Check if expiring soon (within thresholdMs, e.g. 60 seconds)
      const remainingMs = session.expiresAt - now;
      if (remainingMs <= thresholdMs && !this.notifiedExpiringSoon.has(id)) {
        this.notifiedExpiringSoon.add(id);
        const secondsRemaining = Math.max(1, Math.round(remainingMs / 1000));
        this.emit('expiringSoon', session, secondsRemaining);
      }
    }
  }

  public stop(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

export const sessionStore = new SessionStore();
