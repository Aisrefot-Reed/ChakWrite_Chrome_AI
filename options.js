const saveBtn = document.getElementById('save-btn');
const statusMessage = document.getElementById('status-message');
const neuroFeatureSelect = document.getElementById('neuro-feature');
const apiModelSelect = document.getElementById('api-model');
const ocrToggle = document.getElementById('ocr-toggle');

// --- Functions ---

function saveOptions() {
  const settings = {
    userPreferences: {
      neuroFeature: neuroFeatureSelect.value
    },
    apiConfig: {
      defaultModel: apiModelSelect.value
    },
    accessibility: {
      enableOcr: ocrToggle.checked
    }
  };

  chrome.storage.local.set(settings, () => {
    statusMessage.textContent = 'Settings saved!';
    setTimeout(() => { statusMessage.textContent = ''; }, 2000);
  });
}

function loadOptions() {
  chrome.storage.local.get(['userPreferences', 'apiConfig', 'accessibility'], (result) => {
    neuroFeatureSelect.value = result.userPreferences?.neuroFeature || 'none';
    apiModelSelect.value = result.apiConfig?.defaultModel || 'gemini-pro';
    ocrToggle.checked = result.accessibility?.enableOcr || false;
  });
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', loadOptions);
saveBtn.addEventListener('click', saveOptions);
