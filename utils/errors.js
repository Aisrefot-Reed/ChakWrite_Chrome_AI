/**
 * Пользовательский тип ошибки для AI API.
 * type указывает на тип операции (например, 'writer', 'summarizer').
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
 * @param {Error} error - ошибка
 * @param {string} context - контекст места возникновения ошибки
 */
function logError(error, context = 'General') {
  console.error(`[${context}]`, error);
  // В будущем можно отправлять ошибки на удалённый сборщик логов.
}
