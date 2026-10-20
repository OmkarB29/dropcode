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
import { receiveFiles, receiveFilesViaSocket, ReceiverCallbacks } from '@/lib/fileTransfer';
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
  const transferStartedRef = useRef<boolean>(false);

  // Stable callbacks container so WebRTC and Relay listeners never unmount/re-mount mid-transfer
  const callbacksRef = useRef<ReceiverCallbacks>({});
  callbacksRef.current = {
    onManifest: (manifest) => {
      transferStartedRef.current = true;
      setReceiverState((prev) => ({
        ...prev,
        files: manifest,
      }));
    },
    onProgress: (prog) => {
      setReceiverState((prev) => ({
        ...prev,
        state: 'TRANSFERRING',
        progress: prog,
      }));
    },
    onFileComplete: (file: DownloadedFile) => {
      setReceiverState((prev) => {
        if (prev.downloadedFiles.some((f) => f.id === file.id)) {
          return prev;
        }
        return {
          ...prev,
          downloadedFiles: [...prev.downloadedFiles, file],
        };
      });
    },
    onTransferComplete: () => {
      setReceiverState((prev) => ({
        ...prev,
        state: 'COMPLETED',
      }));
      cleanupWebRTC();
    },
    onError: (err) => {
      setReceiverState((prev) => ({
        ...prev,
        state: 'FAILED',
        error: err,
      }));
    },
  };

  // WebRTC hooks with stable delegates
  const {
    pcRef,
    setupReceiver,
    handleRemoteSignal,
    cleanup: cleanupWebRTC,
    fullReset,
  } = useWebRTC({
    onDataChannelOpen: (channel) => {
      if (transferStartedRef.current) return;
      transferStartedRef.current = true;
      setReceiverState((prev) => ({ ...prev, state: 'TRANSFERRING' }));

      // Attach file reception listener to WebRTC DataChannel
      receiveFiles(channel, {
        onManifest: (m) => callbacksRef.current.onManifest?.(m),
        onProgress: (p) => callbacksRef.current.onProgress?.(p),
        onFileComplete: (f) => callbacksRef.current.onFileComplete?.(f),
        onTransferComplete: () => callbacksRef.current.onTransferComplete?.(),
        onError: (e) => callbacksRef.current.onError?.(e),
      });
    },
    onDataChannelClose: () => {
      setReceiverState((prev) => {
        if (prev.state === 'TRANSFERRING' && prev.downloadedFiles.length === 0) {
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
        if (!transferStartedRef.current) {
          console.warn('[DropCode] WebRTC P2P failed on Wi-Fi router. Awaiting PairDrop-style WebSocket Relay...');
        }
      }
    },
  });

  const setupReceiverRef = useRef(setupReceiver);
  setupReceiverRef.current = setupReceiver;

  const handleRemoteSignalRef = useRef(handleRemoteSignal);
  handleRemoteSignalRef.current = handleRemoteSignal;

  const cleanupWebRTCRef = useRef(cleanupWebRTC);
  cleanupWebRTCRef.current = cleanupWebRTC;

  // Socket setup and listeners - mounted ONCE to prevent dropped events or unmounting mid-stream
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
      // Set up peer connection to receive offer (if not already active)
      setupReceiverRef.current((signal: WebRTCSignal) => {
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
      // Auto-initialize receiver peer connection if an offer arrives before onTransferApproved
      if (!pcRef.current || pcRef.current.signalingState === 'closed') {
        setupReceiverRef.current((signal: WebRTCSignal) => {
          const currentSocket = getSocket();
          currentSocket.emit('receiver:webrtc-signal', {
            sessionId: activeSessionIdRef.current,
            signal,
          });
        });
      }
      handleRemoteSignalRef.current(sig, (replySignal) => {
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
      cleanupWebRTCRef.current();
    };

    const onTransferCancelled = (data?: { reason?: string }) => {
      setReceiverState((prev) => ({
        ...prev,
        state: 'CANCELLED',
        error: data?.reason || 'Sender cancelled the transfer',
      }));
      cleanupWebRTCRef.current();
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

    // Register WebSocket Relay listener (PairDrop style) with stable forwarders
    const cleanupRelay = receiveFilesViaSocket(socket, {
      onManifest: (m) => callbacksRef.current.onManifest?.(m),
      onProgress: (p) => callbacksRef.current.onProgress?.(p),
      onFileComplete: (f) => callbacksRef.current.onFileComplete?.(f),
      onTransferComplete: () => callbacksRef.current.onTransferComplete?.(),
      onError: (e) => callbacksRef.current.onError?.(e),
    });

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
      cleanupRelay();
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
  }, [pcRef]);

  const setCode = useCallback((code: string) => {
    setReceiverState((prev) => ({
      ...prev,
      code: formatCode(code),
      error: null,
    }));
  }, []);

  const joinSession = useCallback(() => {
    const rawCode = receiverState.code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (rawCode.length < 4) {
      setReceiverState((prev) => ({
        ...prev,
        error: 'Please enter a valid 4-digit PIN',
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
    transferStartedRef.current = false;
    const socket = getSocket();
    socket.emit('receiver:reject', {
      sessionId: activeSessionIdRef.current,
    });
    fullReset();
    setReceiverState((prev) => ({
      ...prev,
      state: 'REJECTED',
      error: 'Transfer declined',
    }));
  }, [fullReset]);

  const reset = useCallback(() => {
    transferStartedRef.current = false;
    fullReset();
    disconnectSocket();
    setReceiverState(INITIAL_STATE);
  }, [fullReset]);

  return {
    ...receiverState,
    setCode,
    joinSession,
    acceptTransfer,
    rejectTransfer,
    reset,
  };
}
