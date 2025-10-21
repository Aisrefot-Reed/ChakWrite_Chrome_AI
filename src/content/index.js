// src/content/index.js
// Content script с поддержкой нейро-инклюзивных фич, OCR, автодополнения, realtime proofreader.

// === СОСТОЯНИЕ === //
let settings = {};
let lastSelection = null; // Сохранённое выделение для вставки
let autocompleteDebounceTimer = null;
let proofreadDebounceTimer = null;
let overlayVisible = false;

// === ИНИЦИАЛИЗАЦИЯ === //
chrome.runtime.sendMessage({ action: 'getInitialState' }, response => {
  if (response?.success) {
    settings = response.config;
    applyVisuals(settings.accessibility);
    initOcrListeners();
    console.log('[ChakWrite Content] Инициализирован с настройками:', settings);
  }
});

// === ОБРАБОТКА СООБЩЕНИЙ === //
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Обновление визуальных настроек
  if (request.action === 'updateVisuals') {
    settings.accessibility = request.settings;
    applyVisuals(request.settings);
    sendResponse({ success: true });
    return false;
  }

  // Быстрые действия по горячим клавишам
  if (request.action === 'performQuickAction') {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText.length > 0) {
      handleQuickAction(request.type, selectedText);
    }
    sendResponse({ success: true });
    return false;
  }
});

// === ВИЗУАЛЬНЫЕ АДАПТАЦИИ === //
function applyVisuals(accessibilitySettings) {
  if (!accessibilitySettings) return;

  const body = document.body;
  body.classList.remove('chakwrite-dyslexia-font', 'chakwrite-high-contrast');

  // Шрифт для дислексии
  if (accessibilitySettings.font === 'dyslexia') {
    body.classList.add('chakwrite-dyslexia-font');
  }

  // Увеличенный межстрочный интервал
  if (accessibilitySettings.spacing) {
    body.style.lineHeight = accessibilitySettings.spacing;
    body.style.letterSpacing = `${(parseFloat(accessibilitySettings.spacing) - 1) * 0.05}em`;
  }

  // Высококонтрастный режим
  if (accessibilitySettings.highContrast) {
    body.classList.add('chakwrite-high-contrast');
  }
}

// === ВЫДЕЛЕНИЕ ТЕКСТА === //
document.addEventListener('mouseup', (event) => {
  const selectedText = window.getSelection().toString().trim();
  
  if (selectedText.length > 3) {
    // Сохраняем выделение
    saveSelection();
    
    // Обновляем контекст в background
    chrome.runtime.sendMessage({ action: 'updateContext', data: { selectedText } });
    
    // Показываем overlay если выделено достаточно текста
    if (selectedText.length > 10) {
      showUiOverlay(event.clientX, event.clientY, selectedText);
    }
  } else {
    hideOverlay();
  }
});

// === СОХРАНЕНИЕ И ВОССТАНОВЛЕНИЕ ВЫДЕЛЕНИЯ === //
function saveSelection() {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    lastSelection = selection.getRangeAt(0).cloneRange();
  }
}

function restoreSelection() {
  if (lastSelection) {
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(lastSelection);
  }
}

// === СТЕКЛЯННЫЙ OVERLAY С ARIA === //
function showUiOverlay(x, y, text) {
  let overlay = document.getElementById('chakwrite-overlay');
  if (!overlay) {
    overlay = createOverlay();
  }

  // Формируем список действий в зависимости от режима
  const actions = getAvailableActions();
  
  overlay.innerHTML = `
    <div class="chakwrite-menu" role="menu" aria-label="ChakWrite Actions">
      ${actions.map((action, index) => `
        <button 
          data-action="${action.type}" 
          role="menuitem" 
          tabindex="${index === 0 ? 0 : -1}"
          aria-label="${action.label}"
        >
          <span class="icon">${action.icon}</span>
          <span class="label">${action.label}</span>
        </button>
      `).join('')}
    </div>
  `;
  
  // Позиционируем overlay
  positionOverlay(overlay, x, y);
  overlay.style.display = 'block';
  overlayVisible = true;

  // Добавляем обработчики
  overlay.querySelectorAll('button').forEach((button, index) => {
    button.addEventListener('click', (e) => {
      const action = e.currentTarget.dataset.action;
      handleOverlayAction(action, text);
      hideOverlay();
    });

    // Клавиатурная навигация
    button.addEventListener('keydown', (e) => {
      handleOverlayKeyboard(e, overlay.querySelectorAll('button'), index);
    });
  });

  // Фокус на первой кнопке
  overlay.querySelector('button')?.focus();
}

function createOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'chakwrite-overlay';
  overlay.className = 'chakwrite-overlay-glass';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  document.body.appendChild(overlay);
  return overlay;
}

function positionOverlay(overlay, x, y) {
  // Позиционируем с учётом границ viewport
  const rect = overlay.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = x + 10;
  let top = y + 10;

  // Корректируем если выходит за границы
  if (left + rect.width > viewportWidth) {
    left = viewportWidth - rect.width - 10;
  }
  if (top + rect.height > viewportHeight) {
    top = y - rect.height - 10;
  }

  overlay.style.left = `${Math.max(10, left)}px`;
  overlay.style.top = `${Math.max(10, top)}px`;
}

function getAvailableActions() {
  const baseActions = [
    { type: 'rewriter', label: 'Переписать', icon: '✍️' },
    { type: 'proofreader', label: 'Проверить', icon: '✓' },
    { type: 'summarizer', label: 'Резюме', icon: '📝' },
  ];

  // Добавляем специальные действия в зависимости от режима
  if (settings.userPreferences?.neuroFeature === 'dyslexia') {
    baseActions.push({ type: 'simplifier', label: 'Упростить', icon: '🔍' });
  }

  return baseActions;
}

function hideOverlay() {
  const overlay = document.getElementById('chakwrite-overlay');
  if (overlay) {
    overlay.style.display = 'none';
    overlayVisible = false;
  }
}

// === КЛАВИАТУРНАЯ НАВИГАЦИЯ OVERLAY === //
function handleOverlayKeyboard(event, buttons, currentIndex) {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault();
      buttons[(currentIndex + 1) % buttons.length].focus();
      break;
    case 'ArrowUp':
      event.preventDefault();
      buttons[(currentIndex - 1 + buttons.length) % buttons.length].focus();
      break;
    case 'Escape':
      event.preventDefault();
      hideOverlay();
      break;
  }
}

// === ОБРАБОТКА ДЕЙСТВИЙ === //
function handleOverlayAction(action, text) {
  let payloadType = action;
  let payload = { text };

  // Специальные режимы
  if (action === 'simplifier') {
    payloadType = 'rewriter';
    payload.tone = 'casual';
    payload.length = 'shorter';
  }

  // Отправляем запрос в background
  chrome.runtime.sendMessage(
    { action: 'performAiAction', data: { type: payloadType, payload } },
    (response) => {
      if (response?.success) {
        replaceSelectedText(response.data);
      } else {
        showNotification(`Ошибка: ${response?.error || 'Неизвестная ошибка'}`, 'error');
      }
    }
  );

  // Показываем индикатор загрузки
  showNotification('Обработка...', 'loading');
}

function handleQuickAction(type, text) {
  handleOverlayAction(type, text);
}

// === ВСТАВКА ТЕКСТА === //
function replaceSelectedText(newText) {
  restoreSelection();
  
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    
    // Вставляем новый текст как текстовый узел
    const textNode = document.createTextNode(newText);
    range.insertNode(textNode);
    
    // Перемещаем курсор в конец вставленного текста
    range.setStartAfter(textNode);
    range.setEndAfter(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
    
    showNotification('Текст обновлён', 'success');
  }
}

// === OCR ЧЕРЕЗ TEXTDETECTOR === //
function initOcrListeners() {
  if (!settings.accessibility?.enableOcr) return;

  document.querySelectorAll('img').forEach(img => {
    img.style.cursor = 'pointer';
    img.title = 'Нажмите для извлечения текста (OCR)';
    img.addEventListener('click', (e) => {
      e.stopPropagation();
      performOcr(img);
    });
  });
}

async function performOcr(imgElement) {
  try {
    // Проверка доступности TextDetector API
    if (!('TextDetector' in window)) {
      showNotification('OCR не поддерживается в этой версии браузера. Требуется Chrome 91+ с включённым флагом Shape Detection API.', 'error');
      return;
    }

    showNotification('Извлечение текста из изображения...', 'loading');

    const detector = new TextDetector();
    const detectedText = await detector.detect(imgElement);

    if (detectedText.length === 0) {
      showNotification('Текст на изображении не найден', 'warning');
      return;
    }

    // Собираем весь найденный текст
    const extractedText = detectedText.map(item => item.rawValue).join(' ');
    
    // Создаём текстовую область с результатом
    createOcrResultDialog(extractedText);
    
  } catch (error) {
    console.error('[ChakWrite] OCR Error:', error);
    showNotification(`Ошибка OCR: ${error.message}`, 'error');
  }
}

function createOcrResultDialog(text) {
  const dialog = document.createElement('div');
  dialog.className = 'chakwrite-ocr-dialog';
  dialog.innerHTML = `
    <div class="chakwrite-ocr-content" role="dialog" aria-labelledby="ocr-title">
      <h3 id="ocr-title">Извлечённый текст</h3>
      <textarea readonly aria-label="Извлечённый текст">${text}</textarea>
      <div class="chakwrite-ocr-actions">
        <button id="ocr-copy" aria-label="Копировать текст">Копировать</button>
        <button id="ocr-close" aria-label="Закрыть">Закрыть</button>
      </div>
    </div>
  `;
  document.body.appendChild(dialog);

  // Обработчики
  dialog.querySelector('#ocr-copy').addEventListener('click', () => {
    navigator.clipboard.writeText(text);
    showNotification('Текст скопирован', 'success');
  });

  dialog.querySelector('#ocr-close').addEventListener('click', () => {
    dialog.remove();
  });

  // Закрытие по Escape
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') dialog.remove();
  });
}

// === АВТОДОПОЛНЕНИЕ НА TAB === //
document.addEventListener('keydown', (event) => {
  if (!settings.userPreferences?.autocompleteOnTab) return;
  
  // Проверяем Tab в редактируемых полях
  if (event.key === 'Tab' && isEditableElement(event.target)) {
    event.preventDefault();
    const textBeforeCursor = getTextBeforeCursor(event.target);
    
    if (textBeforeCursor.trim().length > 5) {
      performAutocomplete(event.target, textBeforeCursor);
    }
  }
});

function isEditableElement(element) {
  return (
    element.isContentEditable ||
    element.tagName === 'TEXTAREA' ||
    (element.tagName === 'INPUT' && ['text', 'search', 'email'].includes(element.type))
  );
}

function getTextBeforeCursor(element) {
  if (element.isContentEditable) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      return preCaretRange.toString();
    }
  } else {
    return element.value.substring(0, element.selectionStart);
  }
  return '';
}

function performAutocomplete(element, textBeforeCursor) {
  showNotification('Генерация продолжения...', 'loading');

  chrome.runtime.sendMessage(
    { 
      action: 'performAiAction', 
      data: { 
        type: 'autocomplete', 
        payload: { text: textBeforeCursor } 
      } 
    },
    (response) => {
      if (response?.success && response.data) {
        insertAutocompleteText(element, response.data);
        showNotification('Автодополнение вставлено', 'success');
      } else {
        showNotification('Не удалось сгенерировать продолжение', 'error');
      }
    }
  );
}

function insertAutocompleteText(element, text) {
  if (element.isContentEditable) {
    document.execCommand('insertText', false, text);
  } else {
    const start = element.selectionStart;
    const end = element.selectionEnd;
    element.value = element.value.substring(0, start) + text + element.value.substring(end);
    element.selectionStart = element.selectionEnd = start + text.length;
  }
}

// === REALTIME PROOFREADER === //
document.addEventListener('input', (event) => {
  if (!settings.userPreferences?.realtimeProofreader) return;
  if (!isEditableElement(event.target)) return;

  // Debounce для избежания частых запросов
  clearTimeout(proofreadDebounceTimer);
  proofreadDebounceTimer = setTimeout(() => {
    performRealtimeProofread(event.target);
  }, 2000); // 2 секунды после остановки ввода
});

function performRealtimeProofread(element) {
  const text = element.isContentEditable ? element.textContent : element.value;
  
  if (text.trim().length < 20) return; // Минимальная длина для проверки

  chrome.runtime.sendMessage(
    { 
      action: 'performAiAction', 
      data: { 
        type: 'proofreader', 
        payload: { text } 
      } 
    },
    (response) => {
      if (response?.success && response.data !== text) {
        // Показываем подсказку с исправлениями
        showProofreadSuggestion(element, response.data);
      }
    }
  );
}

function showProofreadSuggestion(element, correctedText) {
  // Создаём tooltip с предложением исправлений
  let tooltip = document.getElementById('chakwrite-proofread-tooltip');
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.id = 'chakwrite-proofread-tooltip';
    tooltip.className = 'chakwrite-tooltip';
    document.body.appendChild(tooltip);
  }

  tooltip.innerHTML = `
    <div class="tooltip-content">
      <p>Предложены исправления</p>
      <button id="apply-proofread">Применить</button>
      <button id="dismiss-proofread">Отклонить</button>
    </div>
  `;

  // Позиционируем около элемента
  const rect = element.getBoundingClientRect();
  tooltip.style.left = `${rect.left}px`;
  tooltip.style.top = `${rect.bottom + 5}px`;
  tooltip.style.display = 'block';

  // Обработчики
  tooltip.querySelector('#apply-proofread').addEventListener('click', () => {
    if (element.isContentEditable) {
      element.textContent = correctedText;
    } else {
      element.value = correctedText;
    }
    tooltip.style.display = 'none';
    showNotification('Исправления применены', 'success');
  });

  tooltip.querySelector('#dismiss-proofread').addEventListener('click', () => {
    tooltip.style.display = 'none';
  });
}

// === УВЕДОМЛЕНИЯ === //
function showNotification(message, type = 'info') {
  let notification = document.getElementById('chakwrite-notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.id = 'chakwrite-notification';
    notification.className = 'chakwrite-notification';
    notification.setAttribute('role', 'status');
    notification.setAttribute('aria-live', 'polite');
    document.body.appendChild(notification);
  }

  notification.className = `chakwrite-notification chakwrite-notification-${type}`;
  notification.textContent = message;
  notification.style.display = 'block';

  // Автоскрытие через 3 секунды (кроме loading)
  if (type !== 'loading') {
    setTimeout(() => {
      notification.style.display = 'none';
    }, 3000);
  }
}

// === ЗАКРЫТИЕ OVERLAY ПРИ КЛИКЕ СНАРУЖИ === //
document.addEventListener('mousedown', (event) => {
  if (!overlayVisible) return;
  
  const overlay = document.getElementById('chakwrite-overlay');
  if (overlay && !overlay.contains(event.target)) {
    hideOverlay();
  }
});

// === ЗАКРЫТИЕ OVERLAY ПО ESCAPE === //
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && overlayVisible) {
    hideOverlay();
  }
});

console.log('[ChakWrite Content] Content script загружен и готов');
