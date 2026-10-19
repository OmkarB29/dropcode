import { RTC_CONFIG } from './constants';

export type IceCandidateCallback = (candidate: RTCIceCandidate) => void;
export type DataChannelCallback = (channel: RTCDataChannel) => void;

export function createPeerConnection(
  onIceCandidate?: IceCandidateCallback,
  onDataChannel?: DataChannelCallback
): RTCPeerConnection {
  const pc = new RTCPeerConnection(RTC_CONFIG);

  if (onIceCandidate) {
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(event.candidate);
      }
    };
  }

  if (onDataChannel) {
    pc.ondatachannel = (event) => {
      onDataChannel(event.channel);
    };
  }

  return pc;
}

export function createDataChannel(
  pc: RTCPeerConnection,
  label: string = 'dropcode-transfer'
): RTCDataChannel {
  const channel = pc.createDataChannel(label, {
    ordered: true,
  });
  channel.binaryType = 'arraybuffer';
  return channel;
}

export async function createOffer(
  pc: RTCPeerConnection
): Promise<RTCSessionDescriptionInit> {
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  return offer;
}

export async function handleOfferAndCreateAnswer(
  pc: RTCPeerConnection,
  offer: RTCSessionDescriptionInit
): Promise<RTCSessionDescriptionInit> {
  const desc = offer.type ? offer : { type: 'offer' as RTCSdpType, sdp: (offer as any).sdp || offer };
  await pc.setRemoteDescription(new RTCSessionDescription(desc));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
}

export async function handleAnswer(
  pc: RTCPeerConnection,
  answer: RTCSessionDescriptionInit
): Promise<void> {
  if (pc.signalingState !== 'have-local-offer') {
    console.warn(`Cannot set remote answer in signalingState: ${pc.signalingState}`);
    return;
  }
  const desc = answer.type ? answer : { type: 'answer' as RTCSdpType, sdp: (answer as any).sdp || answer };
  await pc.setRemoteDescription(new RTCSessionDescription(desc));
}

export async function addIceCandidate(
  pc: RTCPeerConnection,
  candidate: RTCIceCandidateInit | any
): Promise<void> {
  if (!candidate) return;
  const cand = candidate.candidate !== undefined ? candidate : candidate.candidateInit || candidate;
  if (!cand || !cand.candidate || cand.candidate.trim() === '') {
    return; // Ignore empty end-of-candidate markers
  }
  try {
    await pc.addIceCandidate(cand);
  } catch (err) {
    console.warn('Failed to add ICE candidate:', err);
  }
}
