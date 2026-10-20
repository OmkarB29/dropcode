import { z } from 'zod';

export type TransferState =
  | 'WAITING_FOR_RECEIVER'
  | 'RECEIVER_REQUESTED'
  | 'RECEIVER_APPROVED'
  | 'CONNECTING'
  | 'TRANSFERRING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'FAILED'
  | 'EXPIRED';

export interface FileManifestEntry {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  chunkCount: number;
}

export interface Session {
  id: string;          // internal UUID
  code: string;        // human-readable e.g. ABCD-7392
  state: TransferState;
  senderSocketId: string | null;
  receiverSocketId: string | null;
  receiverApproved: boolean;
  files: FileManifestEntry[];
  createdAt: number;
  expiresAt: number;
  senderDeviceName: string;
  receiverDeviceName?: string;
  connectionType: 'webrtc' | 'relay' | 'unknown';
}

export type PublicSession = Omit<Session, 'senderSocketId' | 'receiverSocketId'>;

// Zod schemas for validation
export const FileManifestEntrySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(255),
  size: z.number().nonnegative(),
  mimeType: z.string().default('application/octet-stream'),
  chunkCount: z.number().int().nonnegative().default(1),
});

export const CreateSessionPayloadSchema = z.object({
  deviceName: z.string().min(1).max(50),
  files: z.array(FileManifestEntrySchema).min(1),
});

export type CreateSessionPayload = z.infer<typeof CreateSessionPayloadSchema>;

export const JoinSessionPayloadSchema = z.object({
  code: z
    .string()
    .trim()
    .transform((val) => val.toUpperCase().replace(/\s+/g, ''))
    .pipe(
      z
        .string()
        .regex(
          /^[0-9]{4}$|^[A-Z0-9]{4}$|^[A-Z0-9]{4}-[0-9]{4}$|^[A-Z0-9]{6,8}$/,
          'PIN must be 4 digits'
        )
    ),
  deviceName: z.string().min(1).max(50),
});

export type JoinSessionPayload = z.infer<typeof JoinSessionPayloadSchema>;

export const SessionIdPayloadSchema = z.object({
  sessionId: z.string().uuid(),
});

export type SessionIdPayload = z.infer<typeof SessionIdPayloadSchema>;

export const WebRTCSignalPayloadSchema = z.object({
  sessionId: z.string().uuid(),
  signal: z.any(),
});

export type WebRTCSignalPayload = z.infer<typeof WebRTCSignalPayloadSchema>;
