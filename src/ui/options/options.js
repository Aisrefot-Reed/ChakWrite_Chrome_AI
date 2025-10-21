// src/ui/options/options.js
// Сохранение/загрузка пользовательских настроек и уведомление контент-скриптов о визуальных изменениях.

const saveBtn = document.getElementById('save-btn');
const statusMessage = document.getElementById('status-message');
const neuroFeatureSelect = document.getElementById('neuro-feature');
const fontSelect = document.getElementById('font-select');
const spacingSlider = document.getElementById('spacing-slider');
const spacingValue = document.getElementById('spacing-value');
const ocrToggle = document.getElementById('ocr-toggle');
const highContrastToggle = document.getElementById('high-contrast-toggle');
const rtProofToggle = document.getElementById('rt-proof-toggle');
const autocompleteToggle = document.getElementById('autocomplete-tab-toggle');

function saveOptions() {
  const accessibilitySettings = {
    font: fontSelect.value,
    spacing: spacingSlider.value,
    enableOcr: ocrToggle.checked,
    highContrast: highContrastToggle.checked
  };

  const userPreferences = {
    neuroFeature: neuroFeatureSelect.value,
    realtimeProofreader: rtProofToggle.checked,
    autocompleteOnTab: autocompleteToggle.checked
  };

  chrome.storage.local.set({ accessibility: accessibilitySettings, userPreferences }, () => {
    statusMessage.textContent = 'Сохранено и применено!';
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
    highContrastToggle.checked = result.accessibility?.highContrast || false;
    rtProofToggle.checked = result.userPreferences?.realtimeProofreader || false;
    autocompleteToggle.checked = (result.userPreferences?.autocompleteOnTab ?? true);
  });
}

document.addEventListener('DOMContentLoaded', loadOptions);
saveBtn.addEventListener('click', saveOptions);
spacingSlider.addEventListener('input', (e) => { spacingValue.textContent = e.target.value; });
