'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  SenderState,
  TransferProgress,
  WebRTCSignal,
  FileManifestEntry,
  ReceiverPeer,
} from '@/types/transfer';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { createPeerConnection } from '@/lib/webrtc';
import { sendFiles, sendFilesViaSocketToPeer, createManifest } from '@/lib/fileTransfer';
import { MAX_FILES_PER_SESSION, MAX_TOTAL_SIZE_BYTES } from '@/lib/constants';

interface PeerConnectionData {
  pc: RTCPeerConnection;
  channel?: RTCDataChannel;
  fallbackTimer?: NodeJS.Timeout;
}

const INITIAL_STATE: SenderState = {
  state: 'IDLE',
  files: [],
  sessionId: null,
  transferCode: null,
  expiresAt: null,
  receiverDeviceName: null,
  progress: null,
  receivers: {},
  autoApprove: true,
  error: null,
};

export function useSenderFlow() {
  const [senderState, setSenderState] = useState<SenderState>(INITIAL_STATE);
  const isCancelledRef = useRef<boolean>(false);
  const activeSessionIdRef = useRef<string | null>(null);
  const filesRef = useRef<File[]>([]);
  const autoApproveRef = useRef<boolean>(true);

  // Map of receiverId -> PeerConnectionData
  const peerConnectionsRef = useRef<Map<string, PeerConnectionData>>(new Map());
  // Set of receiverIds that have already started/are transferring
  const activeTransfersRef = useRef<Set<string>>(new Set());

  // Sync refs
  activeSessionIdRef.current = senderState.sessionId;
  filesRef.current = senderState.files;
  autoApproveRef.current = senderState.autoApprove;

  const updateReceiverStatus = useCallback((receiverId: string, status: ReceiverPeer['status']) => {
    setSenderState((prev) => {
      const peer = prev.receivers[receiverId];
      if (!peer) return prev;
      return {
        ...prev,
        receivers: {
          ...prev.receivers,
          [receiverId]: {
            ...peer,
            status,
          },
        },
      };
    });
  }, []);

  const updateReceiverProgress = useCallback((receiverId: string, prog: TransferProgress) => {
    setSenderState((prev) => {
      const peer = prev.receivers[receiverId];
      if (!peer) return prev;
      return {
        ...prev,
        progress: prog, // latest progress
        receivers: {
          ...prev.receivers,
          [receiverId]: {
            ...peer,
            status: 'transferring',
            progress: prog,
          },
        },
      };
    });
  }, []);

  const cleanupPeer = useCallback((receiverId: string) => {
    const peerData = peerConnectionsRef.current.get(receiverId);
    if (peerData) {
      if (peerData.fallbackTimer) {
        clearTimeout(peerData.fallbackTimer);
      }
      try {
        peerData.channel?.close();
      } catch (e) {
        // ignore
      }
      try {
        peerData.pc?.close();
      } catch (e) {
        // ignore
      }
      peerConnectionsRef.current.delete(receiverId);
    }
    activeTransfersRef.current.delete(receiverId);
  }, []);

  const cleanupAllPeers = useCallback(() => {
    for (const [receiverId] of peerConnectionsRef.current.entries()) {
      cleanupPeer(receiverId);
    }
    peerConnectionsRef.current.clear();
    activeTransfersRef.current.clear();
  }, [cleanupPeer]);

  const startRelayTransferForPeer = useCallback(async (receiverId: string) => {
    if (activeTransfersRef.current.has(receiverId)) return;
    activeTransfersRef.current.add(receiverId);

    const sessId = activeSessionIdRef.current;
    const currentFiles = filesRef.current;
    if (!sessId || currentFiles.length === 0) return;

    console.log(`[DropCode] WebRTC DataChannel fallback: Streaming to peer ${receiverId} via WebSocket Relay...`);
    updateReceiverStatus(receiverId, 'transferring');

    try {
      await sendFilesViaSocketToPeer(
        getSocket(),
        sessId,
        receiverId,
        currentFiles,
        (prog: TransferProgress) => {
          updateReceiverProgress(receiverId, prog);
        },
        () => isCancelledRef.current
      );
      updateReceiverStatus(receiverId, 'completed');
    } catch (err: any) {
      if (!isCancelledRef.current) {
        console.error(`WebSocket relay transfer failed for peer ${receiverId}:`, err);
        updateReceiverStatus(receiverId, 'failed');
      }
    }
  }, [updateReceiverProgress, updateReceiverStatus]);

  const startTransferForPeer = useCallback(async (receiverId: string) => {
    if (activeTransfersRef.current.has(receiverId)) return;

    const sessId = activeSessionIdRef.current;
    if (!sessId || filesRef.current.length === 0) return;

    updateReceiverStatus(receiverId, 'connecting');

    // Clean up any existing connection for this peer
    cleanupPeer(receiverId);

    try {
      const pc = createPeerConnection((candidate) => {
        const socket = getSocket();
        socket.emit('sender:webrtc-signal', {
          sessionId: sessId,
          targetReceiverId: receiverId,
          signal: {
            type: 'candidate',
            candidate: candidate.toJSON(),
          },
        });
      });

      const channel = pc.createDataChannel('fileTransfer', { ordered: true });
      channel.binaryType = 'arraybuffer';

      // 3.5s timeout: if WebRTC DataChannel doesn't open within 3.5s, fall back to WebSocket Relay
      const fallbackTimer = setTimeout(() => {
        if (!activeTransfersRef.current.has(receiverId)) {
          console.log(`[DropCode] Peer ${receiverId} WebRTC timeout (3.5s). Switching to WebSocket Relay...`);
          startRelayTransferForPeer(receiverId);
        }
      }, 3500);

      const peerData: PeerConnectionData = { pc, channel, fallbackTimer };
      peerConnectionsRef.current.set(receiverId, peerData);

      channel.onopen = async () => {
        if (peerData.fallbackTimer) {
          clearTimeout(peerData.fallbackTimer);
          peerData.fallbackTimer = undefined;
        }
        if (activeTransfersRef.current.has(receiverId)) return;
        activeTransfersRef.current.add(receiverId);

        updateReceiverStatus(receiverId, 'transferring');
        try {
          await sendFiles(
            channel,
            filesRef.current,
            (prog: TransferProgress) => {
              updateReceiverProgress(receiverId, prog);
            },
            () => isCancelledRef.current
          );
          updateReceiverStatus(receiverId, 'completed');
        } catch (err: any) {
          if (!isCancelledRef.current) {
            console.error(`WebRTC transfer error to peer ${receiverId}:`, err);
            updateReceiverStatus(receiverId, 'failed');
          }
        }
      };

      channel.onclose = () => {
        console.log(`[DropCode] DataChannel closed for peer ${receiverId}`);
      };

      channel.onerror = (e) => {
        console.warn(`[DropCode] DataChannel error for peer ${receiverId}:`, e);
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'failed') {
          if (!activeTransfersRef.current.has(receiverId)) {
            console.warn(`[DropCode] WebRTC failed for peer ${receiverId}. Switching to WebSocket Relay...`);
            startRelayTransferForPeer(receiverId);
          }
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const socket = getSocket();
      socket.emit('sender:webrtc-signal', {
        sessionId: sessId,
        targetReceiverId: receiverId,
        signal: {
          type: 'offer',
          sdp: offer,
        },
      });
    } catch (err: any) {
      console.warn(`WebRTC setup failed for peer ${receiverId}, using relay fallback immediately:`, err);
      startRelayTransferForPeer(receiverId);
    }
  }, [cleanupPeer, startRelayTransferForPeer, updateReceiverProgress, updateReceiverStatus]);

  // Socket setup and listeners
  useEffect(() => {
    const socket = getSocket();

    const onSessionCreated = (data: {
      sessionId: string;
      code: string;
      expiresAt: number;
      autoApprove?: boolean;
    }) => {
      setSenderState((prev) => ({
        ...prev,
        sessionId: data.sessionId,
        transferCode: data.code,
        expiresAt: data.expiresAt,
        autoApprove: data.autoApprove ?? prev.autoApprove,
        state: 'WAITING_FOR_RECEIVER',
      }));
    };

    const onReceiverJoined = (data: {
      receiverId: string;
      receiverDeviceName?: string;
      autoApproved?: boolean;
    }) => {
      const receiverId = data.receiverId;
      const deviceName = data.receiverDeviceName || 'Peer Device';
      const isAuto = data.autoApproved ?? autoApproveRef.current;

      setSenderState((prev) => {
        const updatedReceivers = {
          ...prev.receivers,
          [receiverId]: {
            id: receiverId,
            deviceName,
            status: (isAuto ? 'approved' : 'waiting') as ReceiverPeer['status'],
            progress: null,
            joinedAt: Date.now(),
          },
        };
        return {
          ...prev,
          receiverDeviceName: deviceName,
          receivers: updatedReceivers,
        };
      });

      if (isAuto) {
        // Automatically start peer transfer
        startTransferForPeer(receiverId);
      }
    };

    const onReceiverAccepted = (data: { receiverId: string; receiverDeviceName?: string }) => {
      if (data?.receiverId) {
        startTransferForPeer(data.receiverId);
      }
    };

    const onReceiverSignal = async (data: { receiverId?: string; signal: WebRTCSignal }) => {
      const receiverId = data.receiverId;
      const sig = data.signal || data;
      if (!receiverId) return;

      const peerData = peerConnectionsRef.current.get(receiverId);
      if (!peerData?.pc) return;

      try {
        if (sig.type === 'answer' && sig.sdp) {
          if (peerData.pc.signalingState === 'have-local-offer') {
            await peerData.pc.setRemoteDescription(new RTCSessionDescription(sig.sdp));
          }
        } else if (sig.type === 'candidate' && sig.candidate) {
          await peerData.pc.addIceCandidate(new RTCIceCandidate(sig.candidate));
        }
      } catch (err) {
        console.warn(`Error handling remote signal for peer ${receiverId}:`, err);
      }
    };

    const onReceiverProgress = (data: { receiverId: string; progress: TransferProgress }) => {
      if (data.receiverId && data.progress) {
        updateReceiverProgress(data.receiverId, data.progress);
      }
    };

    const onReceiverCompleted = (data: { receiverId: string }) => {
      if (data.receiverId) {
        updateReceiverStatus(data.receiverId, 'completed');
      }
    };

    const onReceiverDisconnected = (data: { receiverId: string }) => {
      if (data.receiverId) {
        updateReceiverStatus(data.receiverId, 'disconnected');
        cleanupPeer(data.receiverId);
      }
    };

    const onSessionExpired = () => {
      setSenderState((prev) => ({
        ...prev,
        state: 'EXPIRED',
        error: 'Transfer session expired',
      }));
      cleanupAllPeers();
    };

    const onTransferCancelled = (data?: { reason?: string }) => {
      setSenderState((prev) => ({
        ...prev,
        state: 'CANCELLED',
        error: data?.reason || 'Transfer was cancelled',
      }));
      cleanupAllPeers();
    };

    const onError = (data: { message?: string }) => {
      setSenderState((prev) => ({
        ...prev,
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
    socket.on('receiver:accepted', onReceiverAccepted);
    socket.on('receiver:webrtc-signal', onReceiverSignal);
    socket.on('session:receiver-progress', onReceiverProgress);
    socket.on('session:receiver-completed', onReceiverCompleted);
    socket.on('session:receiver-disconnected', onReceiverDisconnected);
    socket.on('session:expired', onSessionExpired);
    socket.on('transfer:cancelled', onTransferCancelled);
    socket.on('error', onError);
    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('session:created', onSessionCreated);
      socket.off('session:receiver-joined', onReceiverJoined);
      socket.off('receiver:accepted', onReceiverAccepted);
      socket.off('receiver:webrtc-signal', onReceiverSignal);
      socket.off('session:receiver-progress', onReceiverProgress);
      socket.off('session:receiver-completed', onReceiverCompleted);
      socket.off('session:receiver-disconnected', onReceiverDisconnected);
      socket.off('session:expired', onSessionExpired);
      socket.off('transfer:cancelled', onTransferCancelled);
      socket.off('error', onError);
      socket.off('connect_error', onConnectError);
    };
  }, [cleanupAllPeers, cleanupPeer, startTransferForPeer, updateReceiverProgress, updateReceiverStatus]);

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

  const addTextFile = useCallback((text: string, title?: string) => {
    if (!text.trim()) return;
    const cleanTitle = (title?.trim() || 'shared-text').replace(/[/\\?%*:|"<>]/g, '-');
    const filename = cleanTitle.includes('.') ? cleanTitle : `${cleanTitle}.txt`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const file = new File([blob], filename, { type: 'text/plain;charset=utf-8' });
    addFiles([file]);
  }, [addFiles]);

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

  const setAutoApprove = useCallback((enabled: boolean) => {
    autoApproveRef.current = enabled;
    setSenderState((prev) => {
      const nextReceivers = { ...prev.receivers };
      // If toggled ON, immediately approve any peers that are waiting
      if (enabled) {
        for (const [id, peer] of Object.entries(nextReceivers)) {
          if (peer.status === 'waiting') {
            nextReceivers[id] = { ...peer, status: 'approved' };
            const socket = getSocket();
            socket.emit('sender:approve-receiver', {
              sessionId: prev.sessionId,
              receiverId: id,
            });
            startTransferForPeer(id);
          }
        }
      }
      return {
        ...prev,
        autoApprove: enabled,
        receivers: nextReceivers,
      };
    });
  }, [startTransferForPeer]);

  const createSession = useCallback(async (overrideFiles?: File[]) => {
    const targetFiles = overrideFiles || senderState.files;
    if (targetFiles.length === 0) {
      setSenderState((prev) => ({
        ...prev,
        error: 'Please select at least one file or enter text to share',
      }));
      return;
    }

    if (overrideFiles) {
      filesRef.current = overrideFiles;
      setSenderState((prev) => ({
        ...prev,
        files: overrideFiles,
      }));
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

    const manifest: FileManifestEntry[] = createManifest(targetFiles);

    const payload = {
      deviceName,
      files: manifest,
      autoApprove: autoApproveRef.current,
    };

    socket.emit(
      'sender:create-session',
      payload,
      (response: {
        success?: boolean;
        sessionId?: string;
        code?: string;
        expiresAt?: number;
        autoApprove?: boolean;
        error?: string;
      }) => {
        if (response && response.sessionId && response.code) {
          setSenderState((prev) => ({
            ...prev,
            sessionId: response.sessionId!,
            transferCode: response.code!,
            expiresAt: response.expiresAt || Date.now() + 600000,
            autoApprove: response.autoApprove ?? prev.autoApprove,
            state: 'WAITING_FOR_RECEIVER',
            receivers: {},
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

  const sendTextImmediately = useCallback((text: string, title?: string) => {
    if (!text.trim()) return;
    const cleanTitle = (title?.trim() || 'shared-text').replace(/[/\\?%*:|"<>]/g, '-');
    const filename = cleanTitle.includes('.') ? cleanTitle : `${cleanTitle}.txt`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const file = new File([blob], filename, { type: 'text/plain;charset=utf-8' });
    createSession([file]);
  }, [createSession]);

  const approveReceiver = useCallback((receiverId?: string) => {
    const socket = getSocket();
    socket.emit('sender:approve-receiver', {
      sessionId: activeSessionIdRef.current,
      receiverId,
    });
    if (receiverId) {
      updateReceiverStatus(receiverId, 'approved');
      startTransferForPeer(receiverId);
    } else {
      // Approve all waiting peers
      for (const [id, peer] of Object.entries(senderState.receivers)) {
        if (peer.status === 'waiting') {
          updateReceiverStatus(id, 'approved');
          startTransferForPeer(id);
        }
      }
    }
  }, [senderState.receivers, startTransferForPeer, updateReceiverStatus]);

  const rejectReceiver = useCallback((receiverId?: string) => {
    const socket = getSocket();
    socket.emit('sender:reject-receiver', {
      sessionId: activeSessionIdRef.current,
      receiverId,
    });
    if (receiverId) {
      updateReceiverStatus(receiverId, 'rejected');
      cleanupPeer(receiverId);
    }
  }, [cleanupPeer, updateReceiverStatus]);

  const cancelTransfer = useCallback(() => {
    isCancelledRef.current = true;
    cleanupAllPeers();
    const socket = getSocket();
    socket.emit('sender:cancel', {
      sessionId: activeSessionIdRef.current,
    });
    setSenderState((prev) => ({
      ...prev,
      state: 'CANCELLED',
      error: 'Transfer session ended',
    }));
  }, [cleanupAllPeers]);

  const reset = useCallback(() => {
    isCancelledRef.current = false;
    cleanupAllPeers();
    disconnectSocket();
    setSenderState(INITIAL_STATE);
  }, [cleanupAllPeers]);

  return {
    ...senderState,
    addFiles,
    addTextFile,
    sendTextImmediately,
    removeFile,
    clearFiles,
    createSession,
    approveReceiver,
    rejectReceiver,
    setAutoApprove,
    cancelTransfer,
    reset,
  };
}
