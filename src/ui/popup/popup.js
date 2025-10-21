const mainDashboard = document.getElementById('main-dashboard');
const settingsPanel = document.getElementById('settings-panel');
const settingsBtn = document.getElementById('settings-btn');
const backBtn = document.getElementById('back-to-main-btn');
const optionsLink = document.getElementById('options-link');
const executeBtn = document.getElementById('execute-btn');
const modeSwitcher = document.getElementById('mode-switcher');
const mainTextarea = document.getElementById('main-textarea');
const resultDisplay = document.getElementById('result-display');

let currentMode = 'writer'; // Default mode

// --- Event Listeners ---

// Navigation
settingsBtn.addEventListener('click', () => {
  mainDashboard.classList.add('hidden');
  settingsPanel.classList.remove('hidden');
});

backBtn.addEventListener('click', () => {
  settingsPanel.classList.add('hidden');
  mainDashboard.classList.remove('hidden');
});

optionsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});

// Mode Switching
modeSwitcher.addEventListener('click', (e) => {
  if (e.target.classList.contains('mode-btn')) {
    document.querySelector('.mode-btn.active').classList.remove('active');
    e.target.classList.add('active');
    currentMode = e.target.dataset.mode;
    mainTextarea.placeholder = `Text to ${currentMode}...`;
  }
});

// Main Action
executeBtn.addEventListener('click', async () => {
  const text = mainTextarea.value.trim();
  if (!text) {
    resultDisplay.textContent = 'Please enter some text.';
    return;
  }

  resultDisplay.textContent = 'Thinking...';
  executeBtn.disabled = true;

  chrome.runtime.sendMessage(
    {
      action: 'performAiAction',
      data: {
        type: currentMode,
        payload: { text } // Simple payload, can be enriched
      }
    },
    (response) => {
      if (chrome.runtime.lastError) {
        resultDisplay.textContent = `Error: ${chrome.runtime.lastError.message}`;
      } else if (response.success) {
        resultDisplay.textContent = response.data;
      } else {
        resultDisplay.textContent = `Error: ${response.error}`;
      }
      executeBtn.disabled = false;
    }
  );
});
