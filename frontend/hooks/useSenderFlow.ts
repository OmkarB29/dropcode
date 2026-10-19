'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  SenderState,
  TransferProgress,
  WebRTCSignal,
  FileManifestEntry,
} from '@/types/transfer';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useWebRTC } from './useWebRTC';
import { sendFiles, sendFilesViaSocket, createManifest } from '@/lib/fileTransfer';
import { MAX_FILES_PER_SESSION, MAX_TOTAL_SIZE_BYTES } from '@/lib/constants';

const INITIAL_STATE: SenderState = {
  state: 'IDLE',
  files: [],
  sessionId: null,
  transferCode: null,
  expiresAt: null,
  receiverDeviceName: null,
  progress: null,
  error: null,
};

export function useSenderFlow() {
  const [senderState, setSenderState] = useState<SenderState>(INITIAL_STATE);
  const isCancelledRef = useRef<boolean>(false);
  const activeSessionIdRef = useRef<string | null>(null);
  const transferStartedRef = useRef<boolean>(false);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const filesRef = useRef<File[]>([]);

  // Sync refs
  activeSessionIdRef.current = senderState.sessionId;
  filesRef.current = senderState.files;

  const startRelayTransfer = useCallback(async () => {
    if (transferStartedRef.current) return;
    transferStartedRef.current = true;
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    const sessId = activeSessionIdRef.current;
    const currentFiles = filesRef.current;
    if (!sessId || currentFiles.length === 0) return;

    console.log('[DropCode] WebRTC unavailable or slow on Wi-Fi. Streaming via WebSocket Relay (PairDrop style)...');
    setSenderState((prev) => ({ ...prev, state: 'TRANSFERRING' }));

    try {
      await sendFilesViaSocket(
        getSocket(),
        sessId,
        currentFiles,
        (prog: TransferProgress) => {
          setSenderState((prev) => ({ ...prev, progress: prog }));
        },
        () => isCancelledRef.current
      );
      setSenderState((prev) => ({ ...prev, state: 'COMPLETED' }));
    } catch (err: any) {
      if (!isCancelledRef.current) {
        console.error('WebSocket relay transfer failed:', err);
        setSenderState((prev) => ({
          ...prev,
          state: 'FAILED',
          error: err?.message || 'WebSocket relay transfer failed',
        }));
      }
    }
  }, []);

  // WebRTC hooks
  const {
    setupSender,
    handleRemoteSignal,
    cleanup: cleanupWebRTC,
    dataChannelRef,
  } = useWebRTC({
    onDataChannelOpen: async (channel) => {
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
      if (transferStartedRef.current) return;
      transferStartedRef.current = true;

      setSenderState((prev) => ({ ...prev, state: 'TRANSFERRING' }));
      try {
        await sendFiles(
          channel,
          filesRef.current,
          (prog: TransferProgress) => {
            setSenderState((prev) => ({ ...prev, progress: prog }));
          },
          () => isCancelledRef.current
        );
        setSenderState((prev) => ({ ...prev, state: 'COMPLETED' }));
      } catch (err: any) {
        if (!isCancelledRef.current) {
          console.error('File transfer failed:', err);
          setSenderState((prev) => ({
            ...prev,
            state: 'FAILED',
            error: err?.message || 'Transfer failed',
          }));
        }
      }
    },
    onDataChannelClose: () => {
      setSenderState((prev) => {
        if (prev.state === 'TRANSFERRING' && !transferStartedRef.current) {
          return {
            ...prev,
            state: 'FAILED',
            error: 'Connection closed unexpectedly',
          };
        }
        return prev;
      });
    },
    onConnectionStateChange: (connState) => {
      if (connState === 'failed') {
        if (!transferStartedRef.current) {
          console.warn('[DropCode] WebRTC connection failed on Wi-Fi. Switching to WebSocket Relay...');
          startRelayTransfer();
        }
      }
    },
  });

  const initiateTransfer = useCallback(async () => {
    transferStartedRef.current = false;
    setSenderState((prev) => ({ ...prev, state: 'CONNECTING' }));

    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }

    // 3.5s timeout: if WebRTC DataChannel doesn't open within 3.5s, fall back to WebSocket Relay (PairDrop mode)
    fallbackTimerRef.current = setTimeout(() => {
      if (!transferStartedRef.current) {
        console.log('[DropCode] WebRTC DataChannel did not open within 3.5s. Falling back to WebSocket Relay...');
        startRelayTransfer();
      }
    }, 3500);

    try {
      await setupSender((signal: WebRTCSignal) => {
        const currentSocket = getSocket();
        const sessId = activeSessionIdRef.current;
        currentSocket.emit('sender:webrtc-signal', {
          sessionId: sessId,
          signal,
        });
        currentSocket.emit('webrtc:signal', {
          sessionId: sessId,
          signal,
        });
      });
    } catch (err: any) {
      console.warn('Failed to setup WebRTC sender, immediately using relay fallback:', err);
      startRelayTransfer();
    }
  }, [setupSender, startRelayTransfer]);

  // Socket setup and listeners
  useEffect(() => {
    const socket = getSocket();

    const onSessionCreated = (data: {
      sessionId: string;
      code: string;
      expiresAt: number;
    }) => {
      setSenderState((prev) => ({
        ...prev,
        sessionId: data.sessionId,
        transferCode: data.code,
        expiresAt: data.expiresAt,
        state: 'WAITING_FOR_RECEIVER',
      }));
    };

    const onReceiverJoined = (data: {
      receiverDeviceName?: string;
      deviceName?: string;
    }) => {
      const name = data.receiverDeviceName || data.deviceName || 'Peer Device';
      setSenderState((prev) => ({
        ...prev,
        receiverDeviceName: name,
        state: 'RECEIVER_REQUESTED',
      }));
    };

    const onTransferApproved = () => {
      initiateTransfer();
    };

    const onReceiverSignal = (data: { signal: WebRTCSignal }) => {
      const sig = data.signal || data;
      handleRemoteSignal(sig);
    };

    const onSessionExpired = () => {
      setSenderState((prev) => ({
        ...prev,
        state: 'EXPIRED',
        error: 'Transfer session expired',
      }));
      cleanupWebRTC();
    };

    const onTransferCancelled = (data?: { reason?: string }) => {
      setSenderState((prev) => ({
        ...prev,
        state: 'CANCELLED',
        error: data?.reason || 'Transfer was cancelled by receiver',
      }));
      cleanupWebRTC();
    };

    const onError = (data: { message?: string }) => {
      setSenderState((prev) => ({
        ...prev,
        state: 'FAILED',
        error: data?.message || 'Server error occurred',
      }));
    };

    const onConnectError = (err: any) => {
      setSenderState((prev) => ({
        ...prev,
        state: 'FAILED',
        error: `Cannot connect to backend server (${err?.message || 'Connection refused'}). Make sure the backend service is running and awake.`,
      }));
    };

    socket.on('session:created', onSessionCreated);
    socket.on('session:receiver-joined', onReceiverJoined);
    socket.on('transfer:approved', onTransferApproved);
    socket.on('receiver:webrtc-signal', onReceiverSignal);
    socket.on('webrtc:signal', onReceiverSignal);
    socket.on('session:expired', onSessionExpired);
    socket.on('transfer:cancelled', onTransferCancelled);
    socket.on('receiver:disconnected', onTransferCancelled);
    socket.on('error', onError);
    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('session:created', onSessionCreated);
      socket.off('session:receiver-joined', onReceiverJoined);
      socket.off('transfer:approved', onTransferApproved);
      socket.off('receiver:webrtc-signal', onReceiverSignal);
      socket.off('webrtc:signal', onReceiverSignal);
      socket.off('session:expired', onSessionExpired);
      socket.off('transfer:cancelled', onTransferCancelled);
      socket.off('receiver:disconnected', onTransferCancelled);
      socket.off('error', onError);
      socket.off('connect_error', onConnectError);
    };
  }, [cleanupWebRTC, handleRemoteSignal, setupSender]);

  // Actions
  const addFiles = useCallback((newFiles: File[]) => {
    setSenderState((prev) => {
      const combined = [...prev.files, ...newFiles];
      if (combined.length > MAX_FILES_PER_SESSION) {
        return {
          ...prev,
          error: `Maximum ${MAX_FILES_PER_SESSION} files allowed per session`,
        };
      }
      const totalSize = combined.reduce((acc, f) => acc + f.size, 0);
      if (totalSize > MAX_TOTAL_SIZE_BYTES) {
        return {
          ...prev,
          error: 'Total file size exceeds 2 GB limit',
        };
      }
      return {
        ...prev,
        files: combined,
        state: 'SELECTING_FILES',
        error: null,
      };
    });
  }, []);

  const removeFile = useCallback((index: number) => {
    setSenderState((prev) => {
      const updated = prev.files.filter((_, i) => i !== index);
      return {
        ...prev,
        files: updated,
        state: updated.length === 0 ? 'IDLE' : 'SELECTING_FILES',
        error: null,
      };
    });
  }, []);

  const clearFiles = useCallback(() => {
    setSenderState((prev) => ({
      ...prev,
      files: [],
      state: 'IDLE',
      error: null,
    }));
  }, []);

  const createSession = useCallback(async () => {
    if (senderState.files.length === 0) {
      setSenderState((prev) => ({
        ...prev,
        error: 'Please select at least one file to share',
      }));
      return;
    }

    isCancelledRef.current = false;
    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    const deviceName =
      (typeof window !== 'undefined' &&
        localStorage.getItem('dropcode_device_name')) ||
      'DropCode Sender';

    const manifest: FileManifestEntry[] = createManifest(senderState.files);

    const payload = {
      deviceName,
      files: manifest,
    };

    // Emit event with callback fallback
    socket.emit(
      'sender:create-session',
      payload,
      (response: {
        success?: boolean;
        sessionId?: string;
        code?: string;
        expiresAt?: number;
        error?: string;
      }) => {
        if (response && response.sessionId && response.code) {
          setSenderState((prev) => ({
            ...prev,
            sessionId: response.sessionId!,
            transferCode: response.code!,
            expiresAt: response.expiresAt || Date.now() + 600000,
            state: 'WAITING_FOR_RECEIVER',
            error: null,
          }));
        } else if (response && response.error) {
          setSenderState((prev) => ({
            ...prev,
            state: 'FAILED',
            error: response.error || 'Failed to create session',
          }));
        }
      }
    );

    setSenderState((prev) => ({
      ...prev,
      state: 'SESSION_CREATED',
      error: null,
    }));
  }, [senderState.files]);

  const approveReceiver = useCallback(() => {
    const socket = getSocket();
    socket.emit('sender:approve-receiver', {
      sessionId: activeSessionIdRef.current,
    });
    initiateTransfer();
  }, [initiateTransfer]);

  const rejectReceiver = useCallback(() => {
    const socket = getSocket();
    socket.emit('sender:reject-receiver', {
      sessionId: activeSessionIdRef.current,
    });
    setSenderState((prev) => ({
      ...prev,
      state: 'WAITING_FOR_RECEIVER',
      receiverDeviceName: null,
    }));
  }, []);

  const cancelTransfer = useCallback(() => {
    isCancelledRef.current = true;
    transferStartedRef.current = false;
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    const socket = getSocket();
    socket.emit('sender:cancel', {
      sessionId: activeSessionIdRef.current,
    });
    cleanupWebRTC();
    setSenderState((prev) => ({
      ...prev,
      state: 'CANCELLED',
      error: 'Transfer cancelled',
    }));
  }, [cleanupWebRTC]);

  const reset = useCallback(() => {
    isCancelledRef.current = false;
    transferStartedRef.current = false;
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    cleanupWebRTC();
    disconnectSocket();
    setSenderState(INITIAL_STATE);
  }, [cleanupWebRTC]);

  return {
    ...senderState,
    addFiles,
    removeFile,
    clearFiles,
    createSession,
    approveReceiver,
    rejectReceiver,
    cancelTransfer,
    reset,
  };
}
