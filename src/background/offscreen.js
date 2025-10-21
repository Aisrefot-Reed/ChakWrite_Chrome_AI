// src/background/offscreen.js
// Принимает запросы от background и выполняет их через window.ai (см. src/ai/api.js)

try {
  importScripts(
    'src/utils/errors.js',   // логирование ошибок
    'src/ai/api.js'          // обёртки над Chrome AI API
  );
} catch (e) {
  console.error('Ошибка importScripts в offscreen.js:', e);
}

chrome.runtime.onMessage.addListener(handleMessages);

/**
 * Обрабатывает сообщения, адресованные оффскрин-документу
 * @param {object} request - объект запроса
 */
async function handleMessages(request) {
  if (request.target !== 'offscreen') return;

  if (request.action === 'performAiAction') {
    try {
      const result = await getCompletion(
        request.data.type,
        request.data.payload,
        request.data.config
      );
      chrome.runtime.sendMessage({
        action: 'aiActionResponse',
        data: { success: true, data: result, originalRequest: request }
      });
    } catch (error) {
      console.error('Offscreen AI Action Error:', error);
      chrome.runtime.sendMessage({
        action: 'aiActionResponse',
        data: { success: false, error: error.message, originalRequest: request }
      });
    }
  }
}
