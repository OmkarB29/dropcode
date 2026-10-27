export type TransferState =
  | 'IDLE'
  | 'SELECTING_FILES'
  | 'SESSION_CREATED'
  | 'WAITING_FOR_RECEIVER'
  | 'RECEIVER_REQUESTED'
  | 'RECEIVER_APPROVED'
  | 'CONNECTING'
  | 'TRANSFERRING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'FAILED';

export interface FileManifestEntry {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  chunkCount: number;
}

export interface TransferProgress {
  currentFileIndex: number;
  currentFileName: string;
  currentFileProgress: number; // 0-100
  overallProgress: number;     // 0-100
  bytesTransferred: number;
  totalBytes: number;
  speedBps: number;            // bytes per second
  estimatedSecondsRemaining: number;
}

export interface DownloadedFile {
  id?: string;
  name: string;
  url: string;
  size: number;
  mimeType?: string;
}

export interface ReceiverPeer {
  id: string; // receiver socket ID
  deviceName: string;
  status: 'waiting' | 'approved' | 'connecting' | 'transferring' | 'completed' | 'rejected' | 'failed' | 'disconnected';
  progress?: TransferProgress | null;
  joinedAt: number;
}

export interface SenderState {
  state: TransferState;
  files: File[];
  sessionId: string | null;
  transferCode: string | null;
  expiresAt: number | null;
  receiverDeviceName: string | null;
  progress: TransferProgress | null;
  receivers: Record<string, ReceiverPeer>;
  autoApprove: boolean;
  error: string | null;
}

export interface ReceiverState {
  state: TransferState;
  code: string;
  sessionId: string | null;
  senderDeviceName: string | null;
  files: FileManifestEntry[];
  progress: TransferProgress | null;
  downloadedFiles: DownloadedFile[];
  error: string | null;
}

export type WebRTCSignal =
  | { type: 'offer'; sdp: RTCSessionDescriptionInit }
  | { type: 'answer'; sdp: RTCSessionDescriptionInit }
  | { type: 'candidate'; candidate: RTCIceCandidateInit };

export type DataChannelMessage =
  | { type: 'manifest'; files: FileManifestEntry[] }
  | { type: 'file-start'; fileId: string; fileName: string; fileSize: number; mimeType?: string }
  | { type: 'file-end'; fileId: string }
  | { type: 'transfer-complete' };
