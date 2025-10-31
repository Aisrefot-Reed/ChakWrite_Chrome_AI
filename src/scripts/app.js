// app.js - main file with mode switching
document.addEventListener('DOMContentLoaded', function() {
    const modeSelect = document.getElementById('modeSelect');
    const submitBtn = document.getElementById('submitBtn');
    const userInput = document.getElementById('userInput');
    const outputElement = document.getElementById('output');
    const promptAPIToggle = document.getElementById('promptAPIToggle');

    // Load saved settings
    if (promptAPIToggle) {
        chrome.storage.local.get(['promptAPIEnabled'], function(result) {
            promptAPIToggle.checked = result.promptAPIEnabled !== false; // default true
        });
        
        // Save settings on change
        promptAPIToggle.addEventListener('change', function() {
            chrome.storage.local.set({ promptAPIEnabled: promptAPIToggle.checked });
        });
    }

    submitBtn.addEventListener('click', handleSubmit);

    // Function to determine current mode
    function getCurrentMode() {
        return modeSelect.value;
    }
    
    // Check if Prompt API is enabled
    async function isPromptAPIEnabled() {
        if (!promptAPIToggle) return true; // default enabled if toggle doesn't exist
        return promptAPIToggle.checked;
    }

    async function handleSubmit() {
        const userText = userInput.value.trim();
        
        if (!userText) {
            outputElement.textContent = 'Please enter text';
            return;
        }

        outputElement.textContent = 'Processing...';
        submitBtn.disabled = true;
        
        try {
            let result;
            const mode = getCurrentMode();
            const promptEnabled = await isPromptAPIEnabled();
            
            // Use Prompt API if enabled and mode is 'prompt'
            if (mode === 'prompt') {
                if (!promptEnabled) {
                    result = 'Prompt API is disabled in settings. Enable it to use.';
                } else if (typeof processTextWithPromptAPI === 'function') {
                    result = await processTextWithPromptAPI(userText);
                } else {
                    result = 'Prompt API not loaded';
                }
            } else {
                // Use other modes
                switch(mode) {
                    case 'rewrite':
                        if (typeof processTextWithRewriter === 'function') {
                            result = await processTextWithRewriter(userText);
                        } else {
                            result = 'Rewrite function not available';
                        }
                        break;
                    case 'write':
                        if (typeof processTextWithWriter === 'function') {
                            result = await processTextWithWriter(userText);
                        } else {
                            result = 'Write function not available';
                        }
                        break;
                    case 'proofread':
                        if (typeof processTextWithProofreader === 'function') {
                            result = await processTextWithProofreader(userText);
                        } else {
                            result = 'Proofread function not available';
                        }
                        break;
                    case 'summarize':
                        if (typeof processTextWithSummarizer === 'function') {
                            result = await processTextWithSummarizer(userText);
                        } else {
                            result = 'Summarize function not available';
                        }
                        break;
                    default:
                        result = 'Unknown mode';
                }
            }
            
            outputElement.textContent = result || 'No result received';
            
        } catch (error) {
            console.error('Error:', error);
            outputElement.textContent = 'Error: ' + error.message;
        } finally {
            submitBtn.disabled = false;
        }
    }
});
