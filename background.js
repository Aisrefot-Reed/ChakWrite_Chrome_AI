import { getConfig } from './utils/storage.js';
import { getCompletion } from './ai/api.js';

// --- Chrome Extension Lifecycle --- //
chrome.runtime.onInstalled.addListener(() => {
  console.log("ChakWrite AI Assistant installed.");
  // Initialize default settings
  chrome.storage.local.set({
    userPreferences: { neuroFeature: 'none' },
    apiConfig: { defaultModel: 'gemini-pro' },
    accessibility: { fontSize: '16px' }
  });
});

// --- Context Manager --- //
let activeContext = null;

function updateContext(newContext) {
  activeContext = newContext;
  console.log("Context updated:", activeContext);
}

// --- API Manager & Routing --- //
async function handleApiRequest(request) {
  const { type, payload } = request;
  const config = await getConfig();

  // Add context to the payload if available
  const enrichedPayload = { ...payload, context: activeContext };

  try {
    // Route to the correct AI function based on the request type
    const result = await getCompletion(type, enrichedPayload, config);
    return { success: true, data: result };
  } catch (error) {
    console.error(`Error handling API request type ${type}:`, error);
    return { success: false, error: error.message };
  }
}

// --- Main Message Listener --- //
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Background script received message:", request);

  if (request.action === 'updateContext') {
    updateContext(request.data);
    sendResponse({ success: true, message: "Context updated" });
  } else if (request.action === 'performAiAction') {
    handleApiRequest(request.data).then(sendResponse);
    return true; // Indicates that the response is asynchronous
  }

  // Fallback for unknown actions
  return false;
});
