// src/ui/popup/popup.js
// Логика всплывающего окна: навигация, выбор режима, голосовой ввод, отправка AI-запросов.

const mainDashboard = document.getElementById('main-dashboard');
const settingsPanel = document.getElementById('settings-panel');
const settingsBtn = document.getElementById('settings-btn');
const micBtn = document.getElementById('mic-btn');
const backBtn = document.getElementById('back-to-main-btn');
const optionsLink = document.getElementById('options-link');
const executeBtn = document.getElementById('execute-btn');
const modeSwitcher = document.getElementById('mode-switcher');
const mainTextarea = document.getElementById('main-textarea');
const resultDisplay = document.getElementById('result-display');

let currentMode = 'writer'; // Режим по умолчанию
let recognizing = false;
let recognition;

// --- Навигация по панелям --- //
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

// --- Переключение режимов --- //
modeSwitcher.addEventListener('click', (e) => {
  if (e.target.classList.contains('mode-btn')) {
    document.querySelector('.mode-btn.active').classList.remove('active');
    e.target.classList.add('active');
    currentMode = e.target.dataset.mode;
    mainTextarea.placeholder = `Текст для режима: ${currentMode}...`;
  }
});

// --- Голосовой ввод (Web Speech API) --- //
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
  recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'ru-RU'; // Русский для диктовки
  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        mainTextarea.value += (mainTextarea.value ? ' ' : '') + event.results[i][0].transcript;
      } else {
        interim += event.results[i][0].transcript;
      }
    }
  };
  recognition.onend = () => {
    recognizing = false;
    micBtn.textContent = '🎤';
  };
  micBtn.addEventListener('click', () => {
    if (!recognizing) { recognition.start(); recognizing = true; micBtn.textContent = '⏹️'; }
    else { recognition.stop(); }
  });
} else {
  micBtn.disabled = true;
  micBtn.title = 'Голосовое распознавание не поддерживается';
}

// --- Выполнение основного действия --- //
executeBtn.addEventListener('click', async () => {
  const text = mainTextarea.value.trim();
  if (!text) { resultDisplay.textContent = 'Введите текст.'; return; }

  resultDisplay.textContent = 'Думаю...';
  resultDisplay.setAttribute('aria-busy', 'true');
  executeBtn.disabled = true;

  chrome.runtime.sendMessage(
    { action: 'performAiAction', data: { type: currentMode, payload: { text } } },
    (response) => {
      if (chrome.runtime.lastError) {
        resultDisplay.textContent = `Ошибка: ${chrome.runtime.lastError.message}`;
      } else if (response.success) {
        resultDisplay.textContent = response.data;
      } else {
        resultDisplay.textContent = `Ошибка: ${response.error}`;
      }
      executeBtn.disabled = false;
      resultDisplay.setAttribute('aria-busy', 'false');
    }
  );
});
