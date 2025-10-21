try {
  importScripts(
    './utils/errors.js',
    './utils/storage.js',
    './ai/api.js'
  );
} catch (e) {
  console.error(e);
}

// --- Chrome Extension Lifecycle --- //
chrome.runtime.onInstalled.addListener(() => {
  console.log("ChakWrite AI Assistant installed.");
  // Initialize default settings
  setStorage({
    userPreferences: { neuroFeature: 'none' },
    accessibility: { font: 'default', spacing: 1.0, enableOcr: false }
  });
});

// --- Context Management --- //
let activeContext = {};
function updateContext(data) {
  activeContext = { ...activeContext, ...data };
  console.log("Context updated:", activeContext);
}

// --- AI Execution Engine --- //

/**
 * Injects and executes a script in the active tab to access `window.ai`.
 * @param {string} functionName The name of the function to call from the `ai/api.js` module.
 * @param {object} payload The data payload for the AI function.
 * @returns {Promise<any>} The result from the AI execution.
 */
async function executeAiScript(functionName, payload) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) throw new Error("No active tab found.");

  const config = await getConfig();

  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ['utils/errors.js', 'ai/api.js'], // Make sure dependencies are loaded
    func: (type, pl, conf) => {
      // This function runs in the content script's isolated world, but `window.ai` is available.
      // We need to re-import the function here to have access to it.
      return getCompletion(type, pl, conf);
    },
    args: [functionName, payload, config],
    world: 'MAIN' // Execute in the main world to access `window.ai`
  });

  if (chrome.runtime.lastError) {
    throw new Error(chrome.runtime.lastError.message);
  }

  // The result is wrapped in an object, extract it.
  return results[0].result;
}


// --- Main Message Listener --- //
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background script received message:", request.action);

  if (request.action === 'updateContext') {
    updateContext(request.data);
    sendResponse({ success: true });

  } else if (request.action === 'performAiAction') {
    executeAiScript(request.data.type, request.data.payload)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Indicates asynchronous response.

  } else if (request.action === 'getInitialState') {
    getConfig().then(config => {
      sendResponse({ success: true, config });
    });
    return true;

  } else if (request.action === 'applyVisualChanges') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'updateVisuals', settings: request.settings });
      }
    });
  }

  return false;
});