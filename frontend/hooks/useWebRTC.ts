'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  createPeerConnection,
  createDataChannel,
  createOffer,
  handleOfferAndCreateAnswer,
  handleAnswer,
  addIceCandidate,
} from '@/lib/webrtc';
import { WebRTCSignal } from '@/types/transfer';

interface UseWebRTCOptions {
  onDataChannelOpen?: (channel: RTCDataChannel) => void;
  onDataChannelClose?: () => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
}

export function useWebRTC(options: UseWebRTCOptions = {}) {
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const earlySignalQueueRef = useRef<{ signal: any; sendSignal?: (sig: WebRTCSignal) => void }[]>([]);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');
  const [isChannelOpen, setIsChannelOpen] = useState(false);

  const cleanup = useCallback(() => {
    pendingCandidatesRef.current = [];
    earlySignalQueueRef.current = [];
    if (dataChannelRef.current) {
      try {
        dataChannelRef.current.close();
      } catch (e) {
        // ignore
      }
      dataChannelRef.current = null;
    }
    if (pcRef.current) {
      try {
        pcRef.current.close();
      } catch (e) {
        // ignore
      }
      pcRef.current = null;
    }
    setIsChannelOpen(false);
    setConnectionState('closed');
  }, []);

  const attachDataChannelEvents = useCallback(
    (channel: RTCDataChannel) => {
      dataChannelRef.current = channel;

      channel.onopen = () => {
        setIsChannelOpen(true);
        if (options.onDataChannelOpen) {
          options.onDataChannelOpen(channel);
        }
      };

      channel.onclose = () => {
        setIsChannelOpen(false);
        if (options.onDataChannelClose) {
          options.onDataChannelClose();
        }
      };

      channel.onerror = (err) => {
        console.error('WebRTC DataChannel error:', err);
      };
    },
    [options]
  );

  const setupSender = useCallback(
    async (sendSignal: (signal: WebRTCSignal) => void): Promise<RTCPeerConnection> => {
      cleanup();

      const pc = createPeerConnection((candidate) => {
        sendSignal({
          type: 'candidate',
          candidate: candidate.toJSON(),
        });
      });

      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
        if (options.onConnectionStateChange) {
          options.onConnectionStateChange(pc.connectionState);
        }
      };

      pcRef.current = pc;

      // Sender creates the DataChannel
      const channel = createDataChannel(pc, 'dropcode-transfer');
      attachDataChannelEvents(channel);

      // Sender creates the initial offer
      const offer = await createOffer(pc);
      sendSignal({
        type: 'offer',
        sdp: offer,
      });

      return pc;
    },
    [attachDataChannelEvents, cleanup, options]
  );

  const setupReceiver = useCallback(
    (sendSignal: (signal: WebRTCSignal) => void): RTCPeerConnection => {
      cleanup();

      const pc = createPeerConnection(
        (candidate) => {
          sendSignal({
            type: 'candidate',
            candidate: candidate.toJSON(),
          });
        },
        (channel) => {
          attachDataChannelEvents(channel);
        }
      );

      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
        if (options.onConnectionStateChange) {
          options.onConnectionStateChange(pc.connectionState);
        }
      };

      pcRef.current = pc;

      // Drain early signals that arrived before setupReceiver was called
      if (earlySignalQueueRef.current.length > 0) {
        const queued = [...earlySignalQueueRef.current];
        earlySignalQueueRef.current = [];
        for (const item of queued) {
          handleRemoteSignal(item.signal, item.sendSignal || sendSignal);
        }
      }

      return pc;
    },
    [attachDataChannelEvents, cleanup, options]
  );

  const handleRemoteSignal = useCallback(
    async (
      signal: WebRTCSignal | any,
      sendSignal?: (signal: WebRTCSignal) => void
    ) => {
      const pc = pcRef.current;
      if (!pc) {
        console.warn('WebRTC signal received before PeerConnection was active. Queuing signal.');
        earlySignalQueueRef.current.push({ signal, sendSignal });
        return;
      }

      try {
        if (signal.type === 'offer') {
          const sdp = signal.sdp || signal;
          const answer = await handleOfferAndCreateAnswer(pc, sdp);
          if (sendSignal) {
            sendSignal({
              type: 'answer',
              sdp: answer,
            });
          }
          // Drain any early ICE candidates that arrived before the offer
          if (pendingCandidatesRef.current.length > 0) {
            for (const cand of pendingCandidatesRef.current) {
              await addIceCandidate(pc, cand);
            }
            pendingCandidatesRef.current = [];
          }
        } else if (signal.type === 'answer') {
          const sdp = signal.sdp || signal;
          await handleAnswer(pc, sdp);
          // Drain any early ICE candidates that arrived before the answer
          if (pendingCandidatesRef.current.length > 0) {
            for (const cand of pendingCandidatesRef.current) {
              await addIceCandidate(pc, cand);
            }
            pendingCandidatesRef.current = [];
          }
        } else if (signal.type === 'candidate' || signal.candidate) {
          const cand = signal.candidate || signal;
          if (!pc.remoteDescription || !pc.remoteDescription.type) {
            // Remote description not ready yet, queue the candidate
            pendingCandidatesRef.current.push(cand);
          } else {
            await addIceCandidate(pc, cand);
          }
        }
      } catch (err) {
        console.error('Error handling WebRTC remote signal:', err);
      }
    },
    []
  );

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    pcRef,
    dataChannelRef,
    isChannelOpen,
    connectionState,
    setupSender,
    setupReceiver,
    handleRemoteSignal,
    cleanup,
  };
}
