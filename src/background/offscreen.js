// src/background/offscreen.js
// Офскрин-документ для выполнения AI запросов через window.ai.
// Все зависимости (errors.js, api.js) загружены через <script> в offscreen.html.

console.log('[ChakWrite] Offscreen document загружен, window.ai доступен:', !!window.ai);

/**
 * Обрабатывает сообщения от background script.
 * @param {object} request - объект запроса
 * @returns {Promise<void>}
 */
async function handleMessages(request) {
  // Обрабатываем только сообщения, адресованные offscreen
  if (request.target !== 'offscreen') return;

  if (request.action === 'performAiAction') {
    try {
      console.log('[ChakWrite Offscreen] Получен AI запрос:', request.data.type);
      
      // getCompletion определён в src/ai/api.js, загруженном через offscreen.html
      const result = await getCompletion(
        request.data.type,
        request.data.payload,
        request.data.config
      );
      
      console.log('[ChakWrite Offscreen] AI запрос выполнен успешно');
      
      // Отправляем результат обратно в background
      chrome.runtime.sendMessage({
        action: 'aiActionResponse',
        data: { success: true, data: result, originalRequest: request }
      });
    } catch (error) {
      console.error('[ChakWrite Offscreen] Ошибка AI запроса:', error);
      
      chrome.runtime.sendMessage({
        action: 'aiActionResponse',
        data: { 
          success: false, 
          error: error.message || 'Неизвестная ошибка AI', 
          originalRequest: request 
        }
      });
    }
  }
}

// Подписываемся на сообщения от background
chrome.runtime.onMessage.addListener(handleMessages);
