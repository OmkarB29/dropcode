export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

interface ClientRecord {
  timestamps: number[];
}

export class InMemoryRateLimiter {
  private records: Map<string, ClientRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(private cleanupIntervalMs: number = 60000) {
    this.startCleanupTimer();
  }

  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.cleanupIntervalMs);
    // Don't keep the event loop active solely for cleanup timer
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  public check(
    identifier: string,
    action: string,
    limit: number,
    windowMs: number = 60000
  ): RateLimitResult {
    const now = Date.now();
    const key = `${identifier}:${action}`;
    const windowStart = now - windowMs;

    let record = this.records.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.records.set(key, record);
    }

    // Filter out timestamps outside the active window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= limit) {
      const oldestInWindow = record.timestamps[0];
      const resetAt = oldestInWindow + windowMs;
      return {
        allowed: false,
        limit,
        remaining: 0,
        resetAt,
      };
    }

    // Record this attempt
    record.timestamps.push(now);
    const resetAt = record.timestamps[0] + windowMs;

    return {
      allowed: true,
      limit,
      remaining: Math.max(0, limit - record.timestamps.length),
      resetAt,
    };
  }

  public cleanup(maxAgeMs: number = 60000): void {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < maxAgeMs);
      if (record.timestamps.length === 0) {
        this.records.delete(key);
      }
    }
  }

  public stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

export const rateLimiter = new InMemoryRateLimiter();
