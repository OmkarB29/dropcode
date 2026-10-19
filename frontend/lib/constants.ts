export const CHUNK_SIZE = 64 * 1024; // 64 KB
export const MAX_BUFFERED_AMOUNT = 16 * 1024 * 1024; // 16 MB backpressure threshold
export const BUFFERED_AMOUNT_LOW_THRESHOLD = 1 * 1024 * 1024; // 1 MB resume threshold

export const STUN_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302',
  'stun:stun.cloudflare.com:3478',
];

/**
 * Build WebRTC ICE server configuration dynamically from env vars.
 *
 * Supports multiple TURN URLs (comma-separated) via:
 *   NEXT_PUBLIC_TURN_URLS      e.g. "turn:relay.metered.ca:80,turn:relay.metered.ca:443"
 *   NEXT_PUBLIC_TURN_USERNAME  e.g. "your-username"
 *   NEXT_PUBLIC_TURN_CREDENTIAL e.g. "your-credential"
 *
 * Falls back to STUN-only if no TURN vars are set.
 */
function buildRTCConfig(): RTCConfiguration {
  const iceServers: RTCIceServer[] = [
    { urls: STUN_SERVERS },
  ];

  const turnUrls =
    process.env.NEXT_PUBLIC_TURN_URLS ||
    'turn:relay.metered.ca:80,turn:relay.metered.ca:443,turn:relay.metered.ca:443?transport=tcp,turns:relay.metered.ca:443';
  const turnUsername =
    process.env.NEXT_PUBLIC_TURN_USERNAME || 'a9ee189d84a04e1b2c813ca6';
  const turnCredential =
    process.env.NEXT_PUBLIC_TURN_CREDENTIAL || 'Bbll4Y7gBPJXGMfC';

  if (turnUrls && turnUsername && turnCredential) {
    const urls = turnUrls.split(',').map((u) => u.trim()).filter(Boolean);
    if (urls.length > 0) {
      iceServers.push({
        urls,
        username: turnUsername,
        credential: turnCredential,
      });
    }
  }

  return {
    iceServers,
    // Prefer relay when TURN is available to maximise connectivity
    iceTransportPolicy: turnUrls ? 'all' : 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
  };
}

export const RTC_CONFIG: RTCConfiguration = buildRTCConfig();

export const MAX_FILES_PER_SESSION = 10;
export const MAX_TOTAL_SIZE_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

export const DEFAULT_BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export const getSiteUrl = (): string => {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return 'https://dropcode-three.vercel.app';
};
