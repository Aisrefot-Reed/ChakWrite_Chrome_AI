// --- Text Selection Handler --- //
document.addEventListener('mouseup', (event) => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText.length > 5) { // Threshold to avoid accidental triggers
    console.log('Text selected:', selectedText);
    // Send selected text to the background script to update context
    chrome.runtime.sendMessage({
      action: 'updateContext',
      data: { selectedText }
    });
    // Here you would trigger the UI Overlay Manager to show a menu
    showUiOverlay(event.clientX, event.clientY, selectedText);
  }
});

// --- OCR Integration (Placeholder) --- //
function integrateOcr(imageElement) {
  console.log('OCR functionality to be implemented for image:', imageElement);
  // 1. Check if the user has granted permission.
  // 2. Use a library like Tesseract.js or a future Chrome AI API.
  // 3. Send extracted text to the background script.
  alert('OCR feature is not yet implemented.');
}

// --- UI Overlay Manager (Basic Placeholder) --- //
function showUiOverlay(x, y, text) {
  let overlay = document.getElementById('chakwrite-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'chakwrite-overlay';
    document.body.appendChild(overlay);
  }

  overlay.innerHTML = `
    <div class="chakwrite-menu">
      <button id="chak-rewrite">Rewrite</button>
      <button id="chak-summarize">Summarize</button>
    </div>
  `;
  overlay.style.position = 'absolute';
  overlay.style.left = `${x}px`;
  overlay.style.top = `${y}px`;
  overlay.style.display = 'block';

  // Add event listeners for the buttons
  document.getElementById('chak-rewrite').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'performAiAction',
      data: { type: 'rewriter', payload: { text } }
    }, response => {
      if (response.success) alert(`Rewritten: ${response.data}`);
      else alert(`Error: ${response.error}`);
    });
    overlay.style.display = 'none';
  });
  
  document.getElementById('chak-summarize').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      action: 'performAiAction',
      data: { type: 'summarizer', payload: { text } }
    }, response => {
      if (response.success) alert(`Summary: ${response.data}`);
      else alert(`Error: ${response.error}`);
    });
    overlay.style.display = 'none';
  });
}

// Close overlay when clicking elsewhere
document.addEventListener('mousedown', (event) => {
  const overlay = document.getElementById('chakwrite-overlay');
  if (overlay && !overlay.contains(event.target)) {
    overlay.style.display = 'none';
  }
});
