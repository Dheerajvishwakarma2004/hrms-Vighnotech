/**
 * Operational error with an HTTP status code and optional field-level errors.
 * `errors` is an array of `{ field, message }` so clients can map them onto form inputs.
 */
export class ApiError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    if (errors?.length) {
      this.errors = errors;
    }
  }

  static badRequest(message, errors) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = 'Not authenticated, please log in') {
    return new ApiError(401, message);
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message);
  }

  static conflict(message, errors) {
    return new ApiError(409, message, errors);
  }
}
