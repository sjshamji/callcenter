export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_SERVER_ERROR'
  ) {
    super(message)
    this.name = 'APIError'
  }
}

export function handleAPIError(error: unknown) {
  console.error('API Error:', error)
  
  if (error instanceof APIError) {
    return {
      error: error.message,
      code: error.code,
      status: error.statusCode
    }
  }
  
  if (error instanceof Error) {
    return {
      error: error.message,
      code: 'INTERNAL_SERVER_ERROR',
      status: 500
    }
  }
  
  return {
    error: 'An unexpected error occurred',
    code: 'INTERNAL_SERVER_ERROR',
    status: 500
  }
}

export const ErrorCodes = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
} as const 