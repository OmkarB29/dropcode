'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReceiverState,
  TransferProgress,
  WebRTCSignal,
  FileManifestEntry,
  DownloadedFile,
} from '@/types/transfer';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { useWebRTC } from './useWebRTC';
import { receiveFiles } from '@/lib/fileTransfer';
import { formatCode } from '@/lib/formatters';

const INITIAL_STATE: ReceiverState = {
  state: 'IDLE',
  code: '',
  sessionId: null,
  senderDeviceName: null,
  files: [],
  progress: null,
  downloadedFiles: [],
  error: null,
};

export function useReceiverFlow(initialCode: string = '') {
  const [receiverState, setReceiverState] = useState<ReceiverState>({
    ...INITIAL_STATE,
    code: formatCode(initialCode),
  });

  const activeSessionIdRef = useRef<string | null>(null);
  activeSessionIdRef.current = receiverState.sessionId;

  // WebRTC hooks
  const {
    setupReceiver,
    handleRemoteSignal,
    cleanup: cleanupWebRTC,
  } = useWebRTC({
    onDataChannelOpen: (channel) => {
      setReceiverState((prev) => ({ ...prev, state: 'TRANSFERRING' }));

      // Attach file reception listener
      receiveFiles(channel, {
        onManifest: (manifest) => {
          setReceiverState((prev) => ({
            ...prev,
            files: manifest,
          }));
        },
        onProgress: (prog) => {
          setReceiverState((prev) => ({
            ...prev,
            progress: prog,
          }));
        },
        onFileComplete: (file: DownloadedFile) => {
          setReceiverState((prev) => ({
            ...prev,
            downloadedFiles: [...prev.downloadedFiles, file],
          }));
        },
        onTransferComplete: () => {
          setReceiverState((prev) => ({
            ...prev,
            state: 'COMPLETED',
          }));
        },
        onError: (err) => {
          setReceiverState((prev) => ({
            ...prev,
            state: 'FAILED',
            error: err,
          }));
        },
      });
    },
    onDataChannelClose: () => {
      setReceiverState((prev) => {
        if (prev.state === 'TRANSFERRING') {
          return {
            ...prev,
            state: 'FAILED',
            error: 'Peer closed the connection before transfer finished',
          };
        }
        return prev;
      });
    },
    onConnectionStateChange: (connState) => {
      if (connState === 'failed') {
        setReceiverState((prev) => ({
          ...prev,
          state: 'FAILED',
          error: 'P2P WebRTC connection failed. Your Wi-Fi router might be blocking peer-to-peer traffic (AP isolation).',
        }));
      }
    },
  });

  // Socket setup and listeners
  useEffect(() => {
    const socket = getSocket();

    const onSessionJoined = (data: {
      sessionId: string;
      senderDeviceName?: string;
      deviceName?: string;
      files?: FileManifestEntry[];
    }) => {
      setReceiverState((prev) => ({
        ...prev,
        sessionId: data.sessionId,
        senderDeviceName: data.senderDeviceName || data.deviceName || 'Sender Device',
        files: data.files || [],
        state: 'SESSION_CREATED',
        error: null,
      }));
    };

    const onTransferApproved = () => {
      setReceiverState((prev) => ({ ...prev, state: 'CONNECTING' }));
      // Set up peer connection to receive offer
      setupReceiver((signal: WebRTCSignal) => {
        const currentSocket = getSocket();
        currentSocket.emit('receiver:webrtc-signal', {
          sessionId: activeSessionIdRef.current,
          signal,
        });
        currentSocket.emit('webrtc:signal', {
          sessionId: activeSessionIdRef.current,
          signal,
        });
      });
    };

    const onSenderSignal = (data: { signal: WebRTCSignal }) => {
      const sig = data.signal || data;
      handleRemoteSignal(sig, (replySignal) => {
        const currentSocket = getSocket();
        currentSocket.emit('receiver:webrtc-signal', {
          sessionId: activeSessionIdRef.current,
          signal: replySignal,
        });
        currentSocket.emit('webrtc:signal', {
          sessionId: activeSessionIdRef.current,
          signal: replySignal,
        });
      });
    };

    const onSessionExpired = () => {
      setReceiverState((prev) => ({
        ...prev,
        state: 'EXPIRED',
        error: 'This transfer session has expired',
      }));
      cleanupWebRTC();
    };

    const onTransferCancelled = (data?: { reason?: string }) => {
      setReceiverState((prev) => ({
        ...prev,
        state: 'CANCELLED',
        error: data?.reason || 'Sender cancelled the transfer',
      }));
      cleanupWebRTC();
    };

    const onError = (data: { message?: string }) => {
      setReceiverState((prev) => ({
        ...prev,
        state: 'FAILED',
        error: data?.message || 'Error occurred during session',
      }));
    };

    const onConnectError = (err: any) => {
      setReceiverState((prev) => ({
        ...prev,
        state: 'FAILED',
        error: `Cannot connect to backend server (${err?.message || 'Connection refused'}). Make sure the backend service is running and awake.`,
      }));
    };

    socket.on('session:joined', onSessionJoined);
    socket.on('transfer:approved', onTransferApproved);
    socket.on('sender:webrtc-signal', onSenderSignal);
    socket.on('webrtc:signal', onSenderSignal);
    socket.on('session:expired', onSessionExpired);
    socket.on('transfer:cancelled', onTransferCancelled);
    socket.on('sender:disconnected', onTransferCancelled);
    socket.on('error', onError);
    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('session:joined', onSessionJoined);
      socket.off('transfer:approved', onTransferApproved);
      socket.off('sender:webrtc-signal', onSenderSignal);
      socket.off('webrtc:signal', onSenderSignal);
      socket.off('session:expired', onSessionExpired);
      socket.off('transfer:cancelled', onTransferCancelled);
      socket.off('sender:disconnected', onTransferCancelled);
      socket.off('error', onError);
      socket.off('connect_error', onConnectError);
    };
  }, [cleanupWebRTC, handleRemoteSignal, setupReceiver]);

  const setCode = useCallback((code: string) => {
    setReceiverState((prev) => ({
      ...prev,
      code: formatCode(code),
      error: null,
    }));
  }, []);

  const joinSession = useCallback(() => {
    const rawCode = receiverState.code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (rawCode.length < 6) {
      setReceiverState((prev) => ({
        ...prev,
        error: 'Please enter a valid transfer code',
      }));
      return;
    }

    const socket = getSocket();
    if (!socket.connected) {
      socket.connect();
    }

    const deviceName =
      (typeof window !== 'undefined' &&
        localStorage.getItem('dropcode_device_name')) ||
      'DropCode Receiver';

    // 15-second safety timeout so it never hangs indefinitely
    const timeoutId = setTimeout(() => {
      setReceiverState((prev) => {
        if (prev.state === 'CONNECTING') {
          return {
            ...prev,
            state: 'FAILED',
            error: 'Connection timed out. The backend server might still be waking up, or the sender disconnected.',
          };
        }
        return prev;
      });
    }, 15000);

    // Send receiver:join
    socket.emit(
      'receiver:join',
      {
        code: receiverState.code,
        deviceName,
      },
      (response: {
        success?: boolean;
        sessionId?: string;
        senderDeviceName?: string;
        files?: FileManifestEntry[];
        error?: string;
      }) => {
        clearTimeout(timeoutId);
        if (response && response.sessionId) {
          setReceiverState((prev) => ({
            ...prev,
            sessionId: response.sessionId!,
            senderDeviceName: response.senderDeviceName || 'Sender Device',
            files: response.files || [],
            state: 'SESSION_CREATED',
            error: null,
          }));
        } else if (response && response.error) {
          setReceiverState((prev) => ({
            ...prev,
            state: 'FAILED',
            error: response.error ?? null,
          }));
        }
      }
    );

    setReceiverState((prev) => ({
      ...prev,
      state: 'CONNECTING',
      error: null,
    }));
  }, [receiverState.code]);

  const acceptTransfer = useCallback(() => {
    const socket = getSocket();
    socket.emit('receiver:accept', {
      sessionId: activeSessionIdRef.current,
    });
    setReceiverState((prev) => ({ ...prev, state: 'CONNECTING' }));

    // Pre-initialize peer connection
    setupReceiver((signal: WebRTCSignal) => {
      const currentSocket = getSocket();
      currentSocket.emit('receiver:webrtc-signal', {
        sessionId: activeSessionIdRef.current,
        signal,
      });
      currentSocket.emit('webrtc:signal', {
        sessionId: activeSessionIdRef.current,
        signal,
      });
    });
  }, [setupReceiver]);

  const rejectTransfer = useCallback(() => {
    const socket = getSocket();
    socket.emit('receiver:reject', {
      sessionId: activeSessionIdRef.current,
    });
    cleanupWebRTC();
    setReceiverState((prev) => ({
      ...prev,
      state: 'REJECTED',
      error: 'Transfer declined',
    }));
  }, [cleanupWebRTC]);

  const reset = useCallback(() => {
    cleanupWebRTC();
    disconnectSocket();
    setReceiverState(INITIAL_STATE);
  }, [cleanupWebRTC]);

  return {
    ...receiverState,
    setCode,
    joinSession,
    acceptTransfer,
    rejectTransfer,
    reset,
  };
}
