const saveBtn = document.getElementById('save-btn');
const statusMessage = document.getElementById('status-message');
const neuroFeatureSelect = document.getElementById('neuro-feature');
const fontSelect = document.getElementById('font-select');
const spacingSlider = document.getElementById('spacing-slider');
const spacingValue = document.getElementById('spacing-value');
const ocrToggle = document.getElementById('ocr-toggle');

// --- Functions ---

function saveOptions() {
  const accessibilitySettings = {
    font: fontSelect.value,
    spacing: spacingSlider.value,
    enableOcr: ocrToggle.checked
  };

  const userPreferences = {
    neuroFeature: neuroFeatureSelect.value
  };

  chrome.storage.local.set({ 
    accessibility: accessibilitySettings,
    userPreferences: userPreferences
  }, () => {
    statusMessage.textContent = 'Settings saved and applied!';
    // Notify the active tab to update its visuals
    chrome.runtime.sendMessage({ action: 'applyVisualChanges', settings: accessibilitySettings });
    setTimeout(() => { statusMessage.textContent = ''; }, 2500);
  });
}

function loadOptions() {
  chrome.storage.local.get(['userPreferences', 'accessibility'], (result) => {
    neuroFeatureSelect.value = result.userPreferences?.neuroFeature || 'none';
    fontSelect.value = result.accessibility?.font || 'default';
    spacingSlider.value = result.accessibility?.spacing || 1.5;
    spacingValue.textContent = spacingSlider.value;
    ocrToggle.checked = result.accessibility?.enableOcr || false;
  });
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', loadOptions);
saveBtn.addEventListener('click', saveOptions);
spacingSlider.addEventListener('input', (e) => {
  spacingValue.textContent = e.target.value;
});