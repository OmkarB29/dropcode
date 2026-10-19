import dotenv from 'dotenv';

dotenv.config();

function parseNumber(envVar: string | undefined, defaultValue: number): number {
  if (!envVar) return defaultValue;
  const parsed = parseInt(envVar, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
export const allowedFrontendUrls = rawFrontendUrl
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

export const config = {
  port: parseNumber(process.env.PORT, 3001),
  frontendUrl: allowedFrontendUrls[0] || 'http://localhost:3000',
  allowedFrontendUrls,
  sessionTtlMs: parseNumber(process.env.SESSION_TTL_MS, 600000), // 10 minutes
  sessionMaxTtlMs: parseNumber(process.env.SESSION_MAX_TTL_MS, 1800000), // 30 minutes
  maxFilesPerSession: parseNumber(process.env.MAX_FILES_PER_SESSION, 10),
  maxTotalSizeBytes: parseNumber(process.env.MAX_TOTAL_SIZE_BYTES, 2147483648), // 2 GB
  nodeEnv: process.env.NODE_ENV || 'development',
  cleanupIntervalMs: 60000, // 60 seconds
  expiringSoonThresholdMs: 60000, // 60 seconds before expiry
  rateLimits: {
    joinPerMinute: 10,
    createPerMinute: 5,
  },
} as const;

export type Config = typeof config;
