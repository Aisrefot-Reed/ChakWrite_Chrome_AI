// src/ui/popup/popup.js
// Popup UI с Web Speech API, всеми режимами работы и стеклянным дизайном.

// === ЭЛЕМЕНТЫ DOM === //
const mainDashboard = document.getElementById('main-dashboard');
const settingsPanel = document.getElementById('settings-panel');
const settingsBtn = document.getElementById('settings-btn');
const backBtn = document.getElementById('back-to-main-btn');
const optionsLink = document.getElementById('options-link');
const executeBtn = document.getElementById('execute-btn');
const modeSwitcher = document.getElementById('mode-switcher');
const mainTextarea = document.getElementById('main-textarea');
const resultDisplay = document.getElementById('result-display');
const voiceInputBtn = document.getElementById('voice-input-btn');
const rewriterOptions = document.getElementById('rewriter-options');
const toneSelect = document.getElementById('tone-select');
const lengthSelect = document.getElementById('length-select');
const resultActions = document.getElementById('result-actions');
const copyResultBtn = document.getElementById('copy-result-btn');
const clearResultBtn = document.getElementById('clear-result-btn');
const quickNeuroMode = document.getElementById('quick-neuro-mode');

// === СОСТОЯНИЕ === //
let currentMode = 'writer';
let isListening = false;
let recognition = null;

// === ИНИЦИАЛИЗАЦИЯ === //
document.addEventListener('DOMContentLoaded', () => {
  initSpeechRecognition();
  loadSettings();
  updatePlaceholder();
  console.log('[ChakWrite Popup] Инициализирован');
});

// === ЗАГРУЗКА НАСТРОЕК === //
function loadSettings() {
  chrome.storage.local.get(['userPreferences'], (result) => {
    if (result.userPreferences) {
      quickNeuroMode.value = result.userPreferences.neuroFeature || 'none';
    }
  });
}

// === НАВИГАЦИЯ === //
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

// === ПЕРЕКЛЮЧЕНИЕ РЕЖИМОВ === //
modeSwitcher.addEventListener('click', (e) => {
  const btn = e.target.closest('.mode-btn');
  if (!btn) return;

  // Обновляем активный режим
  document.querySelectorAll('.mode-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });
  
  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');
  currentMode = btn.dataset.mode;
  
  // Показываем/скрываем опции для rewriter
  if (currentMode === 'rewriter') {
    rewriterOptions.classList.remove('hidden');
  } else {
    rewriterOptions.classList.add('hidden');
  }
  
  updatePlaceholder();
  console.log('[ChakWrite Popup] Режим изменён:', currentMode);
});

function updatePlaceholder() {
  const placeholders = {
    writer: 'Опишите что вы хотите написать...',
    rewriter: 'Введите текст для переписывания...',
    summarizer: 'Введите текст для создания резюме...',
    proofreader: 'Введите текст для проверки грамматики...',
    autocomplete: 'Начните вводить текст для автодополнения...'
  };
  
  mainTextarea.placeholder = placeholders[currentMode] || 'Введите текст для обработки...';
}

// === WEB SPEECH API === //
function initSpeechRecognition() {
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    console.warn('[ChakWrite Popup] Web Speech API не поддерживается');
    voiceInputBtn.disabled = true;
    voiceInputBtn.title = 'Голосовой ввод не поддерживается в этом браузере';
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  
  recognition.lang = 'ru-RU';
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    voiceInputBtn.classList.add('listening');
    voiceInputBtn.setAttribute('aria-label', 'Остановить голосовой ввод');
    showStatus('Слушаю...', 'info');
  };

  recognition.onresult = (event) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += transcript + ' ';
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript) {
      mainTextarea.value += finalTranscript;
    }
  };

  recognition.onerror = (event) => {
    console.error('[ChakWrite Popup] Speech recognition error:', event.error);
    stopListening();
    
    const errorMessages = {
      'no-speech': 'Речь не обнаружена',
      'audio-capture': 'Микрофон недоступен',
      'not-allowed': 'Доступ к микрофону запрещён'
    };
    
    showStatus(errorMessages[event.error] || 'Ошибка распознавания речи', 'error');
  };

  recognition.onend = () => {
    if (isListening) {
      // Перезапускаем если пользователь не остановил вручную
      try {
        recognition.start();
      } catch (e) {
        stopListening();
      }
    }
  };
}

voiceInputBtn?.addEventListener('click', () => {
  if (!recognition) {
    showStatus('Голосовой ввод не поддерживается', 'error');
    return;
  }

  if (isListening) {
    stopListening();
  } else {
    startListening();
  }
});

function startListening() {
  try {
    recognition.start();
  } catch (e) {
    console.error('[ChakWrite Popup] Не удалось запустить распознавание:', e);
    showStatus('Не удалось запустить голосовой ввод', 'error');
  }
}

function stopListening() {
  isListening = false;
  voiceInputBtn.classList.remove('listening');
  voiceInputBtn.setAttribute('aria-label', 'Начать голосовой ввод');
  
  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {
      console.error('[ChakWrite Popup] Ошибка остановки распознавания:', e);
    }
  }
}

// === ВЫПОЛНЕНИЕ AI ДЕЙСТВИЯ === //
executeBtn.addEventListener('click', async () => {
  const text = mainTextarea.value.trim();
  
  if (!text) {
    showStatus('Пожалуйста, введите текст', 'error');
    return;
  }

  // Останавливаем голосовой ввод если активен
  if (isListening) {
    stopListening();
  }

  // Формируем payload в зависимости от режима
  const payload = { text };
  
  if (currentMode === 'rewriter') {
    payload.tone = toneSelect.value;
    payload.length = lengthSelect.value;
  }

  // UI обратная связь
  executeBtn.disabled = true;
  resultDisplay.innerHTML = '<p class="result-placeholder">🤔 Обработка...</p>';
  resultActions.classList.add('hidden');

  console.log('[ChakWrite Popup] Отправка запроса:', { type: currentMode, payload });

  // Отправляем запрос в background
  chrome.runtime.sendMessage(
    {
      action: 'performAiAction',
      data: {
        type: currentMode,
        payload
      }
    },
    (response) => {
      executeBtn.disabled = false;

      if (chrome.runtime.lastError) {
        console.error('[ChakWrite Popup] Runtime error:', chrome.runtime.lastError);
        displayError(`Ошибка: ${chrome.runtime.lastError.message}`);
        return;
      }

      if (response?.success) {
        displayResult(response.data);
        showStatus('Готово!', 'success');
      } else {
        displayError(response?.error || 'Неизвестная ошибка');
      }
    }
  );
});

function displayResult(text) {
  resultDisplay.textContent = text;
  resultActions.classList.remove('hidden');
  
  // Анимация появления
  resultDisplay.style.opacity = '0';
  setTimeout(() => {
    resultDisplay.style.transition = 'opacity 0.3s';
    resultDisplay.style.opacity = '1';
  }, 10);
}

function displayError(message) {
  resultDisplay.innerHTML = `<p style="color: #e53e3e; text-align: center;">❌ ${message}</p>`;
  showStatus('Ошибка при выполнении', 'error');
}

// === ДЕЙСТВИЯ С РЕЗУЛЬТАТОМ === //
copyResultBtn?.addEventListener('click', async () => {
  const text = resultDisplay.textContent;
  
  try {
    await navigator.clipboard.writeText(text);
    showStatus('Скопировано в буфер обмена', 'success');
  } catch (e) {
    console.error('[ChakWrite Popup] Ошибка копирования:', e);
    showStatus('Не удалось скопировать', 'error');
  }
});

clearResultBtn?.addEventListener('click', () => {
  resultDisplay.innerHTML = '<p class="result-placeholder">Результат появится здесь...</p>';
  resultActions.classList.add('hidden');
  mainTextarea.value = '';
  mainTextarea.focus();
});

// === БЫСТРЫЕ НАСТРОЙКИ === //
quickNeuroMode?.addEventListener('change', (e) => {
  const neuroFeature = e.target.value;
  
  chrome.storage.local.get(['userPreferences'], (result) => {
    const prefs = result.userPreferences || {};
    prefs.neuroFeature = neuroFeature;
    
    chrome.storage.local.set({ userPreferences: prefs }, () => {
      showStatus('Настройки сохранены', 'success');
      console.log('[ChakWrite Popup] Нейро-режим обновлён:', neuroFeature);
    });
  });
});

// === СТАТУС УВЕДОМЛЕНИЯ === //
function showStatus(message, type = 'info') {
  const statusIndicator = document.getElementById('status-indicator');
  if (!statusIndicator) return;

  statusIndicator.textContent = message;
  statusIndicator.className = `status-indicator ${type}`;
  statusIndicator.classList.remove('hidden');

  // Автоскрытие через 3 секунды
  setTimeout(() => {
    statusIndicator.classList.add('hidden');
  }, 3000);
}

// === КЛАВИАТУРНЫЕ СОКРАЩЕНИЯ === //
mainTextarea?.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Enter для выполнения
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    executeBtn.click();
  }
});

console.log('[ChakWrite Popup] Скрипт загружен и готов');
