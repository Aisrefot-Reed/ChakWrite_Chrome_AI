// src/utils/errors.js
// Утилиты для обработки ошибок и логирования.

/**
 * Пользовательский класс ошибки для AI API.
 * @param {string} message - текст ошибки
 * @param {string} type - тип AI операции ('writer', 'summarizer', и т.д.)
 */
class AiApiError extends Error {
  constructor(message, type) {
    super(message);
    this.name = 'AiApiError';
    this.type = type;
  }
}

/**
 * Централизованное логирование ошибок.
 * @param {Error} error - объект ошибки
 * @param {string} context - контекст, где произошла ошибка
 */
function logError(error, context = 'General') {
  console.error(`[ChakWrite::${context}]`, error);
  // В будущем можно отправлять ошибки в удалённый сервис логирования.
}
