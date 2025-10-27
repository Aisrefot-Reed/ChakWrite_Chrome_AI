// background.js - Service worker for handling text processing requests
// Load mode processors (will be injected as separate scripts in manifest)

// Import mode processors dynamically
importScripts(
    'modes/dyslexia.js',
    'modes/adhd.js',
    'modes/autism.js'
);

// Mode registry
const modes = {
    dyslexia: dyslexiaMode,
    adhd: adhdMode,
    autism: autismMode
};

// Listen for messages from content script/overlay
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'processText') {
        handleTextProcessing(request, sendResponse);
        return true; // Keep message channel open for async response
    }
    
    if (request.action === 'getModeInfo') {
        const mode = modes[request.mode] || modes.dyslexia;
        sendResponse({
            name: mode.name,
            displayName: mode.displayName,
            description: mode.description
        });
        return false;
    }
});

// Handle text processing requests
async function handleTextProcessing(request, sendResponse) {
    const { mode, textAction, text } = request;
    
    try {
        // Get the appropriate mode processor
        const modeProcessor = modes[mode] || modes.dyslexia;
        
        // Process the text
        const result = await modeProcessor.processText(textAction, text);
        
        sendResponse({ result: result });
    } catch (error) {
        console.error('Background processing error:', error);
        sendResponse({ error: error.message || 'Processing failed' });
    }
}

// Initialize default mode on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
        activeMode: 'dyslexia',
        promptAPIEnabled: true,
        overlayEnabled: true
    });
    console.log('ChakWrite extension installed');
});

// Listen for mode changes from popup
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (changes.activeMode) {
        // Notify all tabs about mode change
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'modeChanged',
                    mode: changes.activeMode.newValue
                }).catch(err => {
                    // Tab might not have content script injected
                    console.log('Could not notify tab:', err);
                });
            });
        });
    }
});

console.log('ChakWrite background service worker initialized');
