let settings = {};

// --- Initial State --- //
// Request settings from the background script on load
chrome.runtime.sendMessage({ action: 'getInitialState' }, response => {
  if (response.success) {
    settings = response.config;
    applyVisuals(settings.accessibility);
  }
});

// Listen for updates from the background script (e.g., when options change)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateVisuals') {
    settings.accessibility = request.settings;
    applyVisuals(request.settings);
    sendResponse({ success: true });
  }
});


// --- Visual Adaptations --- //
function applyVisuals(accessibilitySettings) {
  if (!accessibilitySettings) return;

  const body = document.body;
  // Reset classes
  body.classList.remove('chakwrite-dyslexia-font', 'chakwrite-adhd-spacing');

  // Apply font changes
  if (accessibilitySettings.font === 'dyslexia') {
    body.classList.add('chakwrite-dyslexia-font');
  }

  // Apply spacing changes
  if (accessibilitySettings.spacing) {
    body.style.lineHeight = accessibilitySettings.spacing;
  }
}

// --- Text Selection & UI Overlay --- //
document.addEventListener('mouseup', (event) => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText.length > 10) {
    chrome.runtime.sendMessage({ action: 'updateContext', data: { selectedText } });
    showUiOverlay(event.clientX, event.clientY, selectedText);
  }
});

function showUiOverlay(x, y, text) {
  let overlay = document.getElementById('chakwrite-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'chakwrite-overlay';
    document.body.appendChild(overlay);
  }

  // Populate overlay with actions
  overlay.innerHTML = `
    <div class="chakwrite-menu">
      <button data-action="rewriter">Rewrite</button>
      <button data-action="proofreader">Proofread</button>
      ${settings.userPreferences?.neuroFeature === 'dyslexia' ? '<button data-action="simplifier">Simplify</button>' : ''}
    </div>
  `;
  
  overlay.style.left = `${x}px`;
  overlay.style.top = `${y}px`;
  overlay.style.display = 'block';

  // Add event listeners
  overlay.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      handleOverlayAction(action, text);
      overlay.style.display = 'none';
    });
  });
}

function handleOverlayAction(action, text) {
  let payloadType = action;
  let payload = { text };

  if (action === 'simplifier') {
    payloadType = 'rewriter';
    payload.tone = 'simpler'; // We can define custom tones
  }

  chrome.runtime.sendMessage(
    { action: 'performAiAction', data: { type: payloadType, payload } },
    (response) => {
      if (response.success) {
        // Replace selected text with the result
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(response.data));
        }
      } else {
        alert(`Error: ${response.error}`);
      }
    }
  );
}

// --- OCR (Placeholder) & Other --- //
// Add listeners for images to trigger OCR on click if enabled in settings
if (settings.accessibility?.enableOcr) {
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('click', () => {
            alert('OCR feature not implemented. This would extract text from the image.');
        });
    });
}

// Close overlay when clicking away
document.addEventListener('mousedown', (event) => {
  const overlay = document.getElementById('chakwrite-overlay');
  if (overlay && !overlay.contains(event.target)) {
    overlay.style.display = 'none';
  }
});