// src/ui/options/options.js
// Страница настроек с живым обновлением, сохранением и сбросом настроек.

// === ЭЛЕМЕНТЫ DOM === //
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');
const statusMessage = document.getElementById('status-message');

// Нейро-инклюзивные настройки
const neuroFeatureSelect = document.getElementById('neuro-feature');

// Визуальные настройки
const fontSelect = document.getElementById('font-select');
const spacingSlider = document.getElementById('spacing-slider');
const spacingValue = document.getElementById('spacing-value');
const highContrastToggle = document.getElementById('high-contrast-toggle');

// AI возможности
const realtimeProofreaderToggle = document.getElementById('realtime-proofreader-toggle');
const autocompleteToggle = document.getElementById('autocomplete-toggle');

// Экспериментальное
const ocrToggle = document.getElementById('ocr-toggle');

// === ДЕФОЛТНЫЕ НАСТРОЙКИ === //
const DEFAULT_SETTINGS = {
  userPreferences: {
    neuroFeature: 'none',
    realtimeProofreader: false,
    autocompleteOnTab: true
  },
  accessibility: {
    font: 'default',
    spacing: 1.5,
    highContrast: false,
    enableOcr: false
  }
};

// === ИНИЦИАЛИЗАЦИЯ === //
document.addEventListener('DOMContentLoaded', () => {
  loadOptions();
  setupLiveUpdates();
  console.log('[ChakWrite Options] Инициализирован');
});

// === ЗАГРУЗКА НАСТРОЕК === //
function loadOptions() {
  chrome.storage.local.get(['userPreferences', 'accessibility'], (result) => {
    const prefs = result.userPreferences || DEFAULT_SETTINGS.userPreferences;
    const access = result.accessibility || DEFAULT_SETTINGS.accessibility;

    // Нейро-инклюзивные
    neuroFeatureSelect.value = prefs.neuroFeature || 'none';

    // Визуальные
    fontSelect.value = access.font || 'default';
    spacingSlider.value = access.spacing || 1.5;
    spacingValue.textContent = spacingSlider.value;
    highContrastToggle.checked = access.highContrast || false;

    // AI возможности
    realtimeProofreaderToggle.checked = prefs.realtimeProofreader || false;
    autocompleteToggle.checked = prefs.autocompleteOnTab !== undefined ? prefs.autocompleteOnTab : true;

    // Экспериментальное
    ocrToggle.checked = access.enableOcr || false;

    console.log('[ChakWrite Options] Настройки загружены:', { prefs, access });
  });
}

// === СОХРАНЕНИЕ НАСТРОЕК === //
function saveOptions() {
  const userPreferences = {
    neuroFeature: neuroFeatureSelect.value,
    realtimeProofreader: realtimeProofreaderToggle.checked,
    autocompleteOnTab: autocompleteToggle.checked
  };

  const accessibility = {
    font: fontSelect.value,
    spacing: parseFloat(spacingSlider.value),
    highContrast: highContrastToggle.checked,
    enableOcr: ocrToggle.checked
  };

  chrome.storage.local.set(
    { 
      userPreferences,
      accessibility
    },
    () => {
      showStatus('✓ Настройки сохранены и применены!', false);
      
      // Уведомляем активную вкладку об обновлении визуальных настроек
      chrome.runtime.sendMessage({ 
        action: 'applyVisualChanges', 
        settings: accessibility 
      });

      console.log('[ChakWrite Options] Настройки сохранены:', { userPreferences, accessibility });
    }
  );
}

// === СБРОС К ДЕФОЛТНЫМ === //
function resetOptions() {
  if (!confirm('Вы уверены что хотите сбросить все настройки к значениям по умолчанию?')) {
    return;
  }

  chrome.storage.local.set(DEFAULT_SETTINGS, () => {
    loadOptions();
    showStatus('🔄 Настройки сброшены к значениям по умолчанию', false);
    
    // Уведомляем активную вкладку
    chrome.runtime.sendMessage({ 
      action: 'applyVisualChanges', 
      settings: DEFAULT_SETTINGS.accessibility 
    });

    console.log('[ChakWrite Options] Настройки сброшены');
  });
}

// === ЖИВОЕ ОБНОВЛЕНИЕ === //
function setupLiveUpdates() {
  // Обновление значения слайдера в реальном времени
  spacingSlider.addEventListener('input', (e) => {
    spacingValue.textContent = e.target.value;
  });

  // Живое применение визуальных изменений
  const visualElements = [fontSelect, spacingSlider, highContrastToggle];
  
  visualElements.forEach(element => {
    element.addEventListener('change', () => {
      // Автоматически применяем изменения к активной вкладке
      const accessibility = {
        font: fontSelect.value,
        spacing: parseFloat(spacingSlider.value),
        highContrast: highContrastToggle.checked,
        enableOcr: ocrToggle.checked
      };

      chrome.runtime.sendMessage({ 
        action: 'applyVisualChanges', 
        settings: accessibility 
      });

      console.log('[ChakWrite Options] Живое обновление применено');
    });
  });
}

// === СТАТУС СООБЩЕНИЯ === //
function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${isError ? 'error' : ''}`;
  statusMessage.classList.remove('hidden');

  // Автоскрытие через 3 секунды
  setTimeout(() => {
    statusMessage.classList.add('hidden');
  }, 3000);
}

// === ОБРАБОТЧИКИ СОБЫТИЙ === //
saveBtn.addEventListener('click', saveOptions);
resetBtn.addEventListener('click', resetOptions);

// Ctrl/Cmd + S для быстрого сохранения
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveOptions();
  }
});

console.log('[ChakWrite Options] Скрипт загружен и готов');
