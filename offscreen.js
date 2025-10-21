try {
  importScripts(
    './utils/errors.js',
    './ai/api.js'
  );
} catch (e) {
  console.error('Error importing scripts in offscreen.js:', e);
}

chrome.runtime.onMessage.addListener(handleMessages);

async function handleMessages(request) {
  if (request.target !== 'offscreen') {
    return;
  }

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
