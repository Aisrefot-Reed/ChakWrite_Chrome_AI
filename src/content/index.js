// src/content/index.js
// Контент-скрипт. Применяет визуальные адаптации, показывает оверлей действий и выполняет замены текста на странице.

let settings = {};
let lastSelection = { range: null, input: null };

// --- Начальная инициализация состояния из background --- //
chrome.runtime.sendMessage({ action: 'getInitialState' }, response => {
  if (response.success) {
    settings = response.config;
    applyVisuals(settings.accessibility);
    setupRealtimeProofreader();
    setupAutocompleteOnTab();
  }
});

// Слушаем обновления настроек (например, с options)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateVisuals') {
    settings.accessibility = request.settings;
    applyVisuals(request.settings);
    sendResponse({ success: true });
  }
  if (request.action === 'performQuickAction') {
    // Быстрое действие с клавиатуры: берём выделенный текст либо текст из активного инпута
    const sel = window.getSelection();
    let text = '';
    if (sel && sel.toString().trim()) {
      text = sel.toString().trim();
    } else if (document.activeElement && (document.activeElement.value || document.activeElement.innerText)) {
      const el = document.activeElement;
      if (el.selectionStart != null && el.selectionEnd != null && el.value) {
        text = el.value.slice(el.selectionStart, el.selectionEnd);
      } else {
        text = el.innerText || '';
      }
    }
    if (text && text.length > 0) {
      handleOverlayAction(request.type, text);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Нет выделенного текста' });
    }
    return true;
  }
});

// Запоминаем текущее выделение для корректной замены
document.addEventListener('mouseup', () => {
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    lastSelection.range = sel.getRangeAt(0).cloneRange();
  }
  if (document.activeElement && (document.activeElement.tagName === 'TEXTAREA' || (document.activeElement.tagName === 'INPUT' && /text|search|email|url|tel/.test(document.activeElement.type)))) {
    lastSelection.input = {
      el: document.activeElement,
      start: document.activeElement.selectionStart,
      end: document.activeElement.selectionEnd
    };
  } else {
    lastSelection.input = null;
  }
});

// --- Визуальные адаптации (шрифт, межстрочный интервал, контраст, OCR) --- //
function applyVisuals(accessibilitySettings) {
  if (!accessibilitySettings) return;

  const body = document.body;
  body.classList.remove('chakwrite-dyslexia-font', 'chakwrite-adhd-spacing');

  // Дизлексия: подключаем дружественный шрифт
  if (accessibilitySettings.font === 'dyslexia') {
    body.classList.add('chakwrite-dyslexia-font');
  }

  // Межстрочный интервал
  if (accessibilitySettings.spacing) {
    body.style.lineHeight = String(accessibilitySettings.spacing);
  }

  // Повышенный контраст
  if (accessibilitySettings.highContrast) {
    body.style.filter = 'contrast(1.2)';
  } else {
    body.style.removeProperty('filter');
  }

  // Подготовка OCR по клику на изображениях, если включено
  if (accessibilitySettings.enableOcr) {
    document.querySelectorAll('img:not([data-chak-ocr])').forEach(img => {
      img.dataset.chakOcr = '1';
      img.addEventListener('click', () => {
        runOcrOnImage(img);
      });
    });
  }
}

// --- Появление оверлея с действиями при выделении текста --- //
document.addEventListener('mouseup', (event) => {
  const selectedText = window.getSelection().toString().trim();
  if (selectedText.length > 10) {
    chrome.runtime.sendMessage({ action: 'updateContext', data: { selectedText } });
    showUiOverlay(event.clientX, event.clientY, selectedText);
  }
}, { passive: true });

function showUiOverlay(x, y, text) {
  let overlay = document.getElementById('chakwrite-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'chakwrite-overlay';
    overlay.setAttribute('role', 'menu');
    overlay.setAttribute('aria-label', 'Действия ChakWrite');
    document.body.appendChild(overlay);
  }

  // Кнопки действий
  overlay.innerHTML = `
    <div class="chakwrite-menu">
      <button data-action="rewriter" role="menuitem" tabindex="0">Перефразировать</button>
      <button data-action="proofreader" role="menuitem" tabindex="0">Проверить грамматику</button>
      ${settings.userPreferences?.neuroFeature === 'dyslexia' ? '<button data-action="simplifier" role="menuitem" tabindex="0">Упростить</button>' : ''}
    </div>
  `;

  overlay.style.left = `${Math.min(x, window.innerWidth - 220)}px`;
  overlay.style.top = `${Math.min(y, window.innerHeight - 140)}px`;
  overlay.style.display = 'block';

  const buttons = overlay.querySelectorAll('button');
  if (buttons[0]) buttons[0].focus();

  // Навигация клавиатурой
  overlay.onkeydown = (e) => {
    const focusables = Array.from(overlay.querySelectorAll('button'));
    const idx = focusables.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = focusables[(idx + 1) % focusables.length];
      next && next.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prev = focusables[(idx - 1 + focusables.length) % focusables.length];
      prev && prev.focus();
    } else if (e.key === 'Escape') {
      overlay.style.display = 'none';
    }
  };

  // Обработчики кликов
  overlay.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      handleOverlayAction(action, text);
      overlay.style.display = 'none';
    });
  });
}

// Закрытие оверлея при клике вне его
document.addEventListener('mousedown', (event) => {
  const overlay = document.getElementById('chakwrite-overlay');
  if (overlay && !overlay.contains(event.target)) {
    overlay.style.display = 'none';
  }
}, { passive: true });

// Замена текста в активном поле (input/textarea) или в contenteditable
function replaceInActiveEditable(replacement) {
  // Случай input/textarea
  if (lastSelection.input && lastSelection.input.el) {
    const el = lastSelection.input.el;
    const start = lastSelection.input.start;
    const end = lastSelection.input.end;
    const value = el.value;
    el.value = value.slice(0, start) + replacement + value.slice(end);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  }
  // Случай contenteditable / произвольный Range
  if (lastSelection.range) {
    const range = lastSelection.range;
    range.deleteContents();
    range.insertNode(document.createTextNode(replacement));
    return true;
  }
  return false;
}

// Выполнение действия оверлея через background/offscreen + post-форматирование
function handleOverlayAction(action, text) {
  let payloadType = action;
  let payload = { text };

  // Кнопка «Упростить» маппится на rewriter с особым тоном
  if (action === 'simplifier') {
    payloadType = 'rewriter';
    payload.tone = 'simpler';
  }

  chrome.runtime.sendMessage(
    { action: 'performAiAction', data: { type: payloadType, payload } },
    (response) => {
      if (response.success) {
        // ADHD: автоматическое разбиение на короткие абзацы
        let output = response.data || '';
        if (settings?.userPreferences?.neuroFeature === 'adhd' && output) {
          const parts = output.split(/(?<=[.!?])\s+/).filter(Boolean);
          output = parts.map(p => p.trim()).reduce((acc, sent) => {
            const prev = acc[acc.length - 1] || '';
            if (!prev) return [sent];
            if (prev.split(' ').length < 20) acc[acc.length - 1] = prev + ' ' + sent;
            else acc.push(sent);
            return acc;
          }, []).join('\n\n');
        }
        if (!replaceInActiveEditable(output)) {
          alert('Не удалось автоматически заменить текст. Результат скопирован в буфер обмена.');
          navigator.clipboard && navigator.clipboard.writeText(output).catch(()=>{});
        }
      } else {
        alert(`Ошибка: ${response.error}`);
      }
    }
  );
}

// --- OCR: сначала TextDetector, затем (опционально) Tesseract.js --- //
async function runOcrOnImage(img) {
  try {
    if ('TextDetector' in window) {
      const detector = new window.TextDetector();
      const bitmap = await createImageBitmap(img);
      const texts = await detector.detect(bitmap);
      const content = texts.map(t => t.rawValue).join('\n');
      if (content) {
        chrome.runtime.sendMessage({ action: 'updateContext', data: { selectedText: content } });
        alert('Извлечённый текст добавлен в контекст.');
      } else {
        alert('Текст не обнаружен.');
      }
      return;
    }

    // Пытаемся лениво загрузить Tesseract.js из пакета расширения
    const tesseractUrl = chrome.runtime.getURL('vendor/tesseract.min.js');
    const ok = await fetch(tesseractUrl).then(r => r.ok).catch(() => false);
    if (!ok) { alert('OCR недоступен: нет TextDetector и не поставлены ассеты Tesseract.'); return; }

    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = tesseractUrl; s.onload = res; s.onerror = rej;
      document.documentElement.appendChild(s);
    });
    if (!window.Tesseract) { alert('Не удалось загрузить Tesseract.'); return; }

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');

    const worker = await window.Tesseract.createWorker('eng', 1, {
      workerPath: chrome.runtime.getURL('vendor/worker.min.js'),
      corePath: chrome.runtime.getURL('vendor/tesseract-core.wasm.js'),
      langPath: chrome.runtime.getURL('models'),
    });
    const { data: { text } } = await worker.recognize(dataUrl);
    await worker.terminate();
    const content = (text || '').trim();
    if (content) {
      chrome.runtime.sendMessage({ action: 'updateContext', data: { selectedText: content } });
      alert('Извлечённый текст добавлен в контекст.');
    } else {
      alert('Текст не обнаружен.');
    }
  } catch (e) {
    console.error('OCR error', e);
    alert('Сбой OCR.');
  }
}

// --- Реальный тайм proofreader (необяз.) --- //
function setupRealtimeProofreader() {
  if (!settings?.userPreferences?.realtimeProofreader) return;
  const handler = debounce(async (e) => {
    const el = e.target;
    const text = el.value || el.innerText || '';
    if (!text || text.length < 20 || text.length > 1000) return;
    chrome.runtime.sendMessage(
      { action: 'performAiAction', data: { type: 'proofreader', payload: { text } } },
      (response) => {
        if (response?.success && response.data) {
          // В этой версии показываем только доступность подсказки
          el.setAttribute('aria-description', 'Доступно предложение по исправлению');
        }
      }
    );
  }, 1500);

  const attach = (root) => {
    root.querySelectorAll('textarea, input[type="text"], input[type="search"], [contenteditable="true"]').forEach(el => {
      el.removeEventListener('input', handler);
      el.addEventListener('input', handler);
    });
  };

  attach(document);
  const mo = new MutationObserver((muts) => {
    muts.forEach(m => m.addedNodes && m.addedNodes.forEach(n => { if (n.nodeType === 1) attach(n); }));
  });
  mo.observe(document.body, { childList: true, subtree: true });
}

// Дебаунс хелпер
function debounce(fn, wait) {
  let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn.apply(null, args), wait); };
}

// --- Автодополнение по клавише Tab --- //
function setupAutocompleteOnTab() {
  if (!settings?.userPreferences?.autocompleteOnTab) return;
  const handler = async (e) => {
    if (e.key !== 'Tab') return;
    const el = e.target;
    const isEditable = el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && /text|search|email|url|tel/.test(el.type)) || el.isContentEditable;
    if (!isEditable) return;
    e.preventDefault();
    let textBefore = '';
    if (el.selectionStart != null && el.value != null) {
      textBefore = el.value.slice(0, el.selectionStart);
    } else {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0).cloneRange();
        range.selectNodeContents(el);
        range.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
        textBefore = range.toString();
      }
    }
    const seed = textBefore.split(/(?<=[.!?])\s+/).pop().slice(-120);
    if (!seed || seed.length < 5) return;
    chrome.runtime.sendMessage(
      { action: 'performAiAction', data: { type: 'autocomplete', payload: { text: seed } } },
      (response) => { if (response?.success && response.data) replaceInActiveEditable(response.data); }
    );
  };

  const attach = (root) => {
    root.querySelectorAll('textarea, input[type="text"], input[type="search"], [contenteditable="true"]').forEach(el => {
      el.removeEventListener('keydown', handler);
      el.addEventListener('keydown', handler);
    });
  };

  attach(document);
  const mo = new MutationObserver((muts) => {
    muts.forEach(m => m.addedNodes && m.addedNodes.forEach(n => { if (n.nodeType === 1) attach(n); }));
  });
  mo.observe(document.body, { childList: true, subtree: true });
}
