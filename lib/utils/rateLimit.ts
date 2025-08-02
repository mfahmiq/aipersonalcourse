// Rate limiting utility to prevent excessive API calls

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig = { maxRequests: 10, windowMs: 1000 }) {
    this.config = config;
  }

  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, [now]);
      return true;
    }

    const requestTimes = this.requests.get(key)!;
    const validRequests = requestTimes.filter(time => time > windowStart);
    
    if (validRequests.length >= this.config.maxRequests) {
      return false;
    }

    validRequests.push(now);
    this.requests.set(key, validRequests);
    return true;
  }

  clearOldRequests(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    
    for (const [key, requestTimes] of this.requests.entries()) {
      const validRequests = requestTimes.filter(time => time > windowStart);
      if (validRequests.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, validRequests);
      }
    }
  }
}

// Global rate limiter instance
export const apiRateLimiter = new RateLimiter({
  maxRequests: 5, // Max 5 requests per second
  windowMs: 1000  // 1 second window
});

// Debounce utility
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Clean up old requests periodically
setInterval(() => {
  apiRateLimiter.clearOldRequests();
}, 5000); // Clean up every 5 seconds 