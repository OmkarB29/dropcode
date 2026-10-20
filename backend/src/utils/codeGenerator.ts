import crypto from 'crypto';

const DIGITS = '0123456789';

/**
 * Generates a 4-digit PIN using cryptographically secure random bytes.
 * Example: 4827
 */
export function generateCode(): string {
  const digitBytes = crypto.randomBytes(4);
  let digits = '';
  for (let i = 0; i < 4; i++) {
    digits += DIGITS[digitBytes[i] % DIGITS.length];
  }
  return digits;
}

/**
 * Generates a unique 4-digit code/PIN that does not collide with active sessions.
 * Retries up to 100 times before failing.
 */
export function generateUniqueCode(isCodeActive: (code: string) => boolean): string {
  const MAX_RETRIES = 100;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = generateCode();
    if (!isCodeActive(code)) {
      return code;
    }
  }
  throw new Error('Failed to generate a unique session PIN after 100 attempts.');
}

/**
 * Sanitizes device names: strips HTML tags, trims whitespace, limits to 50 characters.
 */
export function sanitizeDeviceName(name?: string): string {
  if (!name || typeof name !== 'string') {
    return 'Unknown Device';
  }
  // Strip HTML tags and control characters
  const cleaned = name.replace(/<[^>]*>/g, '').replace(/[\r\n\t]/g, ' ').trim();
  const truncated = cleaned.slice(0, 50);
  return truncated.length > 0 ? truncated : 'Unknown Device';
}
