// src/background/index.js
// Service worker (background) MV3. Manages lifecycle and AI request routing using chrome.ml API.

try {
  importScripts(
    '../utils/errors.js',
    '../utils/storage.js',
    '../ai/api.js'
  );
} catch (e) {
  console.error('Error loading scripts in background/index.js:', e);
}

// --- Extension initialization --- //
chrome.runtime.onInstalled.addListener(() => {
  setStorage({
    userPreferences: { neuroFeature: 'none', theme: 'dark', realtimeProofreader: false, autocompleteOnTab: true },
    accessibility: { font: 'default', spacing: 1.4, enableOcr: false }
  });
});

// --- Main message handler --- //
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'performAiAction') {
    (async () => {
      try {
        console.log('[ChakWrite] AI request received:', request.data.type);
        
        const config = await getConfig();
        
        // Use getCompletion from api.js (loaded via importScripts)
        const result = await getCompletion(
          request.data.type,
          request.data.payload,
          config
        );
        
        console.log('[ChakWrite] AI request completed successfully');
        sendResponse({ success: true, data: result });
      } catch (error) {
        console.error('[ChakWrite] AI request error:', error);
        sendResponse({ 
          success: false, 
          error: error.message || 'Unknown AI error' 
        });
      }
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

// --- Hotkey commands --- //
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
