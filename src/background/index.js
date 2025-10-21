// src/background/index.js
// Сервис-воркер (background) MV3. Управляет жизненным циклом, оффскрин-документом и маршрутизацией AI-запросов.

try {
  importScripts(
    '../utils/errors.js',
    '../utils/storage.js'
  );
} catch (e) {
  console.error('Ошибка importScripts в background/index.js:', e);
}

// --- Инициализация расширения --- //
chrome.runtime.onInstalled.addListener(() => {
  setStorage({
    userPreferences: { neuroFeature: 'none', theme: 'dark', realtimeProofreader: false, autocompleteOnTab: true },
    accessibility: { font: 'default', spacing: 1.4, enableOcr: false }
  });
});

// --- Оффскрин-документ для доступа к window.ai --- //
let creatingOffscreenDocument;
let offscreenDocumentActive = false;
let responseCallbacks = {};
let responseTimers = {};

async function hasOffscreenDocument() {
  if (offscreenDocumentActive) return true;
  if (chrome.runtime.getContexts) {
    const contexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT'],
      documentUrls: [chrome.runtime.getURL('src/background/offscreen.html')]
    });
    offscreenDocumentActive = contexts.length > 0;
    return offscreenDocumentActive;
  }
  return false;
}

async function setupOffscreenDocument() {
  if (await hasOffscreenDocument()) return;

  if (creatingOffscreenDocument) {
    await creatingOffscreenDocument;
    return;
  }

  creatingOffscreenDocument = chrome.offscreen.createDocument({
    url: 'src/background/offscreen.html',
    reasons: ['USER_ACTION'],
    justification: 'Нужен доступ к window.ai для локальной обработки AI-запросов.'
  });

  await creatingOffscreenDocument;
  creatingOffscreenDocument = null;
  offscreenDocumentActive = true;
}

function sendMessageToOffscreen(request, sendResponse) {
  const requestId = `${Date.now()}-${Math.random()}`;
  let responded = false;
  responseCallbacks[requestId] = (payload) => {
    if (responded) return;
    responded = true;
    clearTimeout(responseTimers[requestId]);
    delete responseTimers[requestId];
    sendResponse(payload);
  };
  request.requestId = requestId;
  chrome.runtime.sendMessage(request);
  responseTimers[requestId] = setTimeout(() => {
    if (!responded) {
      responded = true;
      delete responseCallbacks[requestId];
      sendResponse({ success: false, error: 'AI запрос превысил лимит времени' });
    }
  }, 15000);
}

// --- Главный обработчик сообщений --- //
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'aiActionResponse') {
    const callback = responseCallbacks[request.data.originalRequest.requestId];
    if (callback) {
      callback(request.data);
      delete responseCallbacks[request.data.originalRequest.requestId];
      clearTimeout(responseTimers[request.data.originalRequest.requestId]);
      delete responseTimers[request.data.originalRequest.requestId];
    }
    return false;
  }

  if (request.action === 'performAiAction') {
    (async () => {
      await setupOffscreenDocument();
      const config = await getConfig();
      const fullRequest = {
        target: 'offscreen',
        action: request.action,
        data: { ...request.data, config }
      };
      sendMessageToOffscreen(fullRequest, sendResponse);
    })();
    return true;
  }

  if (request.action === 'getInitialState') {
    getConfig().then(config => {
      sendResponse({ success: true, config });
    });
    return true;
  }

  if (request.action === 'applyVisualChanges') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'updateVisuals', settings: request.settings });
      }
    });
    return false;
  }

  if (request.action === 'updateContext') {
    const { selectedText } = request.data || {};
    if (selectedText) {
      setStorage({ context: { lastSelectedText: selectedText, updatedAt: Date.now() } });
    }
    return false;
  }

  return false;
});

// --- Горячие клавиши --- //
chrome.commands?.onCommand.addListener((command) => {
  if (command === 'rewrite_selection' || command === 'proofread_selection') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'performQuickAction',
          type: command === 'rewrite_selection' ? 'rewriter' : 'proofreader'
        });
      }
    });
  }
});
