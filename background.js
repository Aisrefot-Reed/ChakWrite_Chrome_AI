try {
  importScripts(
    './utils/errors.js',
    './utils/storage.js'
    // Do not import ai/api.js here, it's used in the offscreen document
  );
} catch (e) {
  console.error('Error importing scripts in background.js:', e);
}

// --- Chrome Extension Lifecycle --- //
chrome.runtime.onInstalled.addListener(() => {
  console.log("ChakWrite AI Assistant installed.");
  setStorage({
    userPreferences: { neuroFeature: 'none', theme: 'dark', realtimeProofreader: false, autocompleteOnTab: true },
    accessibility: { font: 'default', spacing: 1.4, enableOcr: false }
  });
});

// --- Offscreen Document Management --- //
let creatingOffscreenDocument;
let offscreenDocumentActive = false;
let jobQueue = [];
let responseCallbacks = {};
let responseTimers = {};

async function hasOffscreenDocument() {
  if (offscreenDocumentActive) return true;
  if (chrome.runtime.getContexts) {
      const contexts = await chrome.runtime.getContexts({
          contextTypes: ['OFFSCREEN_DOCUMENT'],
          documentUrls: [chrome.runtime.getURL('offscreen.html')]
      });
      offscreenDocumentActive = contexts.length > 0;
      return offscreenDocumentActive;
  } else {
      // Fallback for older versions if needed, though getContexts is standard
      return false;
  }
}

async function setupOffscreenDocument() {
  if (await hasOffscreenDocument()) {
    return;
  }

  if (creatingOffscreenDocument) {
    await creatingOffscreenDocument;
    return;
  }

  creatingOffscreenDocument = chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['USER_ACTION'],
    justification: 'Required to access the window.ai API for AI processing.',
  });

  await creatingOffscreenDocument;
  creatingOffscreenDocument = null;
  offscreenDocumentActive = true;

  // Process any queued jobs
  console.log(`Offscreen document created. Processing ${jobQueue.length} queued jobs.`);
  jobQueue.forEach(job => sendMessageToOffscreen(job.request, job.sendResponse));
  jobQueue = [];
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
    request.requestId = requestId; // Tag request with a unique ID
    chrome.runtime.sendMessage(request);
    // Timeout safeguard
    responseTimers[requestId] = setTimeout(() => {
        if (!responded) {
            responded = true;
            delete responseCallbacks[requestId];
            sendResponse({ success: false, error: 'AI request timed out' });
        }
    }, 15000);
}


// --- Main Message Listener --- //
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Listener for responses from the offscreen document
  if (request.action === 'aiActionResponse') {
    const callback = responseCallbacks[request.data.originalRequest.requestId];
    if (callback) {
      callback(request.data);
      delete responseCallbacks[request.data.originalRequest.requestId];
      clearTimeout(responseTimers[request.data.originalRequest.requestId]);
      delete responseTimers[request.data.originalRequest.requestId];
    }
    return false; // Not an async response from this listener's perspective
  }

  // --- Actions that require the AI API --- //
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
    return true; // Indicates asynchronous response
  }

  // --- Other actions --- //
  if (request.action === 'getInitialState') {
    getStorage().then(config => {
      sendResponse({ success: true, config });
    });
    return true;
  }

  if (request.action === 'applyVisualChanges') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
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

// --- Keyboard shortcuts (commands) --- //
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
