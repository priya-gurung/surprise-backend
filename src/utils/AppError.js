export class AppError extends Error {
  constructor(statusCode, code, message, details) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }

  static badRequest(message, details) {
    return new AppError(400, 'BAD_REQUEST', message, details)
  }

  static unauthorized(message = 'Authentication required') {
    return new AppError(401, 'UNAUTHORIZED', message)
  }

  static forbidden(message = 'You do not have access to this resource') {
    return new AppError(403, 'FORBIDDEN', message)
  }

  static notFound(message = 'Resource not found') {
    return new AppError(404, 'NOT_FOUND', message)
  }

  static conflict(message, details) {
    return new AppError(409, 'CONFLICT', message, details)
  }

  static tooManyRequests(message = 'Too many requests, please slow down') {
    return new AppError(429, 'TOO_MANY_REQUESTS', message)
  }

  static internal(message = 'Something went wrong') {
    return new AppError(500, 'INTERNAL_ERROR', message)
  }
}
