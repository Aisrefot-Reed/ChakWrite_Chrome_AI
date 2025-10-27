// overlay.js - Floating overlay system for text selection assistance
(function() {
    'use strict';

    let overlay = null;
    let currentSelection = null;
    let hideTimeout = null;
    let activeMode = 'dyslexia';

    // Initialize overlay system
    function init() {
        loadActiveMode();
        createOverlay();
        attachListeners();
        console.log('ChakWrite overlay initialized');
    }

    // Load active mode from storage
    function loadActiveMode() {
        chrome.storage.local.get(['activeMode'], (result) => {
            if (result.activeMode) {
                activeMode = result.activeMode;
            }
        });
    }

    // Create overlay DOM structure
    function createOverlay() {
        overlay = document.createElement('div');
        overlay.className = 'chakwrite-overlay';
        overlay.setAttribute('role', 'toolbar');
        overlay.setAttribute('aria-label', 'Writing assistance tools');
        
        overlay.innerHTML = `
            <div class="chakwrite-mode-indicator">
                <span class="chakwrite-mode-icon ${activeMode}"></span>
                <span class="chakwrite-mode-name">${getModeName()}</span>
            </div>
            <div class="chakwrite-panel">
                <button class="chakwrite-btn simplify" data-action="simplify" aria-label="Simplify selected text">
                    <span>✨</span>
                    <span>Simplify</span>
                </button>
                <button class="chakwrite-btn expand" data-action="expand" aria-label="Expand selected text">
                    <span>📝</span>
                    <span>Expand</span>
                </button>
                <button class="chakwrite-btn grammar" data-action="grammar" aria-label="Check grammar">
                    <span>✓</span>
                    <span>Check</span>
                </button>
            </div>
        `;

        document.body.appendChild(overlay);

        // Attach button listeners
        overlay.querySelectorAll('.chakwrite-btn').forEach(btn => {
            btn.addEventListener('click', handleAction);
        });

        // Keyboard navigation
        overlay.addEventListener('keydown', handleKeyboard);
    }

    // Get human-readable mode name
    function getModeName() {
        const modes = {
            dyslexia: 'Dyslexia-Friendly',
            adhd: 'ADHD Focus',
            autism: 'Clear & Direct'
        };
        return modes[activeMode] || 'Writing Assistant';
    }

    // Attach selection listeners
    function attachListeners() {
        document.addEventListener('mouseup', handleTextSelection);
        document.addEventListener('selectionchange', debounce(handleTextSelection, 100));
        document.addEventListener('mousedown', handleClickOutside);
        
        // Listen for mode changes from popup
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.action === 'modeChanged') {
                activeMode = request.mode;
                updateModeIndicator();
            }
        });
    }

    // Handle text selection
    function handleTextSelection(e) {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText.length > 0 && selectedText.length < 5000) {
            currentSelection = {
                text: selectedText,
                range: selection.getRangeAt(0)
            };
            showOverlay(e);
        } else {
            hideOverlay();
        }
    }

    // Show overlay near selected text
    function showOverlay(e) {
        if (!overlay || !currentSelection) return;

        clearTimeout(hideTimeout);

        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Position overlay near selection (below if space, above if not)
        const spaceBelow = window.innerHeight - rect.bottom;
        const overlayHeight = 60; // approximate height

        let top, left;
        if (spaceBelow > overlayHeight + 20) {
            top = window.scrollY + rect.bottom + 10;
        } else {
            top = window.scrollY + rect.top - overlayHeight - 10;
        }

        left = window.scrollX + rect.left;

        // Keep overlay within viewport
        const maxLeft = window.innerWidth - overlay.offsetWidth - 20;
        left = Math.min(left, maxLeft);
        left = Math.max(left, 10);

        overlay.style.top = `${top}px`;
        overlay.style.left = `${left}px`;
        overlay.classList.add('visible');
        overlay.classList.remove('hiding');

        // Auto-hide after 3 seconds of inactivity
        hideTimeout = setTimeout(() => {
            hideOverlay();
        }, 3000);
    }

    // Hide overlay
    function hideOverlay() {
        if (!overlay) return;
        
        overlay.classList.add('hiding');
        overlay.classList.remove('visible');
        
        setTimeout(() => {
            overlay.classList.remove('hiding');
        }, 200);
    }

    // Handle clicks outside overlay
    function handleClickOutside(e) {
        if (overlay && !overlay.contains(e.target)) {
            hideOverlay();
        }
    }

    // Update mode indicator
    function updateModeIndicator() {
        const indicator = overlay.querySelector('.chakwrite-mode-indicator');
        const icon = indicator.querySelector('.chakwrite-mode-icon');
        const name = indicator.querySelector('.chakwrite-mode-name');

        icon.className = `chakwrite-mode-icon ${activeMode}`;
        name.textContent = getModeName();
    }

    // Handle action buttons
    async function handleAction(e) {
        const button = e.currentTarget;
        const action = button.dataset.action;

        if (!currentSelection || button.classList.contains('loading')) return;

        button.classList.add('loading');
        button.disabled = true;

        try {
            const result = await processText(action, currentSelection.text);
            replaceSelectedText(result);
            hideOverlay();
        } catch (error) {
            console.error('ChakWrite error:', error);
            showError(button, error.message);
        } finally {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }

    // Process text based on action and mode
    async function processText(action, text) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({
                action: 'processText',
                mode: activeMode,
                textAction: action,
                text: text
            }, (response) => {
                if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                } else if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response.result);
                }
            });
        });
    }

    // Replace selected text with processed result
    function replaceSelectedText(newText) {
        if (!currentSelection || !currentSelection.range) return;

        const range = currentSelection.range;
        const activeElement = document.activeElement;

        // Handle contenteditable and input elements
        if (activeElement && (activeElement.isContentEditable || 
            activeElement.tagName === 'TEXTAREA' || 
            activeElement.tagName === 'INPUT')) {
            
            const start = activeElement.selectionStart;
            const end = activeElement.selectionEnd;
            const value = activeElement.value || activeElement.textContent;
            
            const newValue = value.substring(0, start) + newText + value.substring(end);
            
            if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
                activeElement.value = newValue;
            } else {
                activeElement.textContent = newValue;
            }
            
            // Set cursor position after inserted text
            const newPosition = start + newText.length;
            if (activeElement.setSelectionRange) {
                activeElement.setSelectionRange(newPosition, newPosition);
            }
        } else {
            // Regular text nodes
            range.deleteContents();
            range.insertNode(document.createTextNode(newText));
        }

        currentSelection = null;
    }

    // Show error message
    function showError(button, message) {
        const originalText = button.innerHTML;
        button.innerHTML = '<span>⚠️</span><span>Error</span>';
        setTimeout(() => {
            button.innerHTML = originalText;
        }, 2000);
    }

    // Keyboard navigation
    function handleKeyboard(e) {
        const buttons = Array.from(overlay.querySelectorAll('.chakwrite-btn'));
        const currentIndex = buttons.findIndex(btn => btn === document.activeElement);

        if (e.key === 'ArrowRight' && currentIndex < buttons.length - 1) {
            e.preventDefault();
            buttons[currentIndex + 1].focus();
        } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
            e.preventDefault();
            buttons[currentIndex - 1].focus();
        } else if (e.key === 'Escape') {
            hideOverlay();
        }
    }

    // Utility: Debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Listen for overlay enable/disable
    chrome.storage.onChanged.addListener((changes, namespace) => {
        if (changes.overlayEnabled) {
            if (changes.overlayEnabled.newValue === false) {
                hideOverlay();
                overlay.style.display = 'none';
            } else {
                overlay.style.display = '';
            }
        }
    });
})();
