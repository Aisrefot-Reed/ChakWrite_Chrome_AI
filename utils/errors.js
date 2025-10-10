/**
 * Custom error class for AI API related errors.
 */
export class AiApiError extends Error {
  constructor(message, type) {
    super(message);
    this.name = 'AiApiError';
    this.type = type; // e.g., 'writer', 'summarizer'
  }
}

/**
 * Centralized error logging.
 * @param {Error} error - The error object.
 * @param {string} context - Additional context about where the error occurred.
 */
export function logError(error, context = 'General') {
  console.error(`[${context}]`, error);
  // Future implementation could send errors to a remote logging service.
}
