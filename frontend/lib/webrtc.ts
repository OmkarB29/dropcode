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
  await pc.setRemoteDescription(new RTCSessionDescription(offer));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer;
}

export async function handleAnswer(
  pc: RTCPeerConnection,
  answer: RTCSessionDescriptionInit
): Promise<void> {
  await pc.setRemoteDescription(new RTCSessionDescription(answer));
}

export async function addIceCandidate(
  pc: RTCPeerConnection,
  candidate: RTCIceCandidateInit
): Promise<void> {
  try {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (err) {
    console.error('Failed to add ICE candidate:', err);
  }
}
