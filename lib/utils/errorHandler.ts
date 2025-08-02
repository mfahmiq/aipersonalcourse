// Error handling utility for better user experience

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export class RateLimitError extends Error {
  constructor(message: string = 'Too many requests. Please wait before trying again.') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class AuthError extends Error {
  constructor(message: string = 'Authentication failed. Please log in again.') {
    super(message);
    this.name = 'AuthError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network error. Please check your connection.') {
    super(message);
    this.name = 'NetworkError';
  }
}

export function handleSupabaseError(error: any): ApiError {
  // Handle Supabase specific errors
  if (error?.code === 'PGRST301') {
    return {
      message: 'Rate limit exceeded. Please wait before making another request.',
      code: 'RATE_LIMIT',
      status: 429
    };
  }

  if (error?.code === 'PGRST116') {
    return {
      message: 'Authentication failed. Please log in again.',
      code: 'AUTH_ERROR',
      status: 401
    };
  }

  if (error?.code === 'PGRST301') {
    return {
      message: 'Too many requests. Please wait before trying again.',
      code: 'RATE_LIMIT',
      status: 429
    };
  }

  // Handle network errors
  if (error?.message?.includes('fetch')) {
    return {
      message: 'Network error. Please check your connection.',
      code: 'NETWORK_ERROR',
      status: 0
    };
  }

  // Handle generic errors
  return {
    message: error?.message || 'An unexpected error occurred.',
    code: 'UNKNOWN_ERROR',
    status: 500,
    details: error
  };
}

export function showUserFriendlyError(error: ApiError): string {
  switch (error.code) {
    case 'RATE_LIMIT':
      return 'Terlalu banyak permintaan. Silakan tunggu sebentar sebelum mencoba lagi.';
    case 'AUTH_ERROR':
      return 'Sesi Anda telah berakhir. Silakan masuk kembali.';
    case 'NETWORK_ERROR':
      return 'Koneksi internet bermasalah. Silakan periksa koneksi Anda.';
    default:
      return error.message || 'Terjadi kesalahan yang tidak terduga.';
  }
}

export function logError(error: ApiError, context?: string): void {
  console.error(`[${context || 'App'}] Error:`, {
    message: error.message,
    code: error.code,
    status: error.status,
    details: error.details,
    timestamp: new Date().toISOString()
  });
}

// Toast notification helper
export function showErrorToast(error: ApiError): void {
  // You can integrate this with your toast library
  const message = showUserFriendlyError(error);
  
  // For now, just log to console
  console.error('Error Toast:', message);
  
  // If you have a toast library, you can use it here:
  // toast.error(message);
}

// Retry logic with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors
      if (error?.code === 'RATE_LIMIT' || error?.code === 'AUTH_ERROR') {
        throw error;
      }
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
} 