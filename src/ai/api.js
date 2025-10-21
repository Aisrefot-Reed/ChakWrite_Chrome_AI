// src/ai/api.js
// Универсальный API слой для Chrome AI (Gemini Nano) с поддержкой feature detection,
// контекстных запросов, нейро-инклюзивных промптов и всех режимов работы.

/**
 * Проверяет доступность Chrome AI API.
 * @returns {boolean} True если chrome.ml доступен.
 */
function isAiAvailable() {
  return typeof chrome !== 'undefined' && chrome.ml && typeof chrome.ml.getModel === 'function';
}

/**
 * Получает Gemini модель через chrome.ml API.
 * @param {string} modelName - название модели (по умолчанию 'gemini-nano')
 * @returns {Promise<object>} объект модели
 */
async function getGeminiModel(modelName = 'gemini-nano') {
  if (!isAiAvailable()) {
    throw new Error('chrome.ml API is not available');
  }
  return await chrome.ml.getModel(modelName);
}

/**
 * Безопасное создание сессии с Gemini через chrome.ml.
 * @param {string} apiType - тип API (для совместимости)
 * @param {object} options - опции для модели
 * @returns {Promise<object>} модель Gemini с методами generateText/prompt
 * @throws {AiApiError} если API недоступен
 */
async function safeCreateSession(apiType, options = {}) {
  if (!isAiAvailable()) {
    throw new AiApiError('chrome.ml API is not available. Make sure you are using Chrome with Gemini support.', apiType);
  }

  try {
    const model = await getGeminiModel();
    
    // Проверяем capabilities если доступны
    if (typeof model.getCapabilities === 'function') {
      try {
        const capabilities = await model.getCapabilities();
        console.log('Gemini capabilities:', capabilities);
      } catch (err) {
        logError(err, `safeCreateSession capabilities check: ${apiType}`);
      }
    }
    
    // Возвращаем обёртку с унифицированными методами
    return {
      model,
      options,
      async prompt(text) {
        return await model.generateText({
          prompt: text,
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 1024,
          topK: options.topK || 40,
          topP: options.topP || 0.95
        }).then(result => result.text || result);
      },
      async write(text) {
        return await this.prompt(`Write text based on: "${text}"`);
      },
      async rewrite(text, config) {
        const tone = config?.tone || 'as-is';
        const length = config?.length || 'as-is';
        return await this.prompt(`Rewrite this text (tone: ${tone}, length: ${length}): "${text}"`);
      },
      async summarize(text) {
        return await this.prompt(`Create a summary of this text: "${text}"`);
      }
    };
  } catch (error) {
    logError(error, `safeCreateSession: ${apiType}`);
    throw new AiApiError(`Failed to create session '${apiType}': ${error.message}`, apiType);
  }
}

/**
 * Формирует контекст из истории и текущей информации.
 * @param {object} config - конфигурация пользователя
 * @param {string} userInput - текущий запрос пользователя
 * @returns {string} форматированный контекст
 */
function buildContext(config, userInput) {
  const context = config.context || {};
  const parts = [];

  // Добавляем последний выделенный текст, если есть
  if (context.lastSelectedText) {
    parts.push(`Контекст (последний выделенный текст): "${context.lastSelectedText}"`);
  }

  // Добавляем текущий запрос
  parts.push(`Запрос: "${userInput}"`);

  return parts.join('\n');
}

/**
 * Применяет нейро-инклюзивные промпт-паттерны в зависимости от настроек.
 * @param {string} neuroFeature - режим (dyslexia, adhd, autism, none)
 * @param {string} basePrompt - базовый промпт
 * @returns {string} обогащённый промпт
 */
function getNeuroPrompt(neuroFeature, basePrompt) {
  switch (neuroFeature) {
    case 'dyslexia':
      return `SYSTEM: Ты помощник для пользователя с дислексией. Твоя главная цель — сделать текст максимально понятным и лёгким для чтения.
- Используй простые, распространённые слова.
- Пиши короткие и прямые предложения.
- Разбивай сложные идеи на маленькие, понятные части.
- Избегай жаргона и сложных конструкций.

USER: ${basePrompt}`;
    case 'adhd':
      return `SYSTEM: Ты помощник для пользователя с СДВГ. Твоя цель — сделать текст захватывающим и лёгким для сканирования.
- Используй заголовки, маркированные и нумерованные списки для структурирования.
- Делай абзацы очень короткими (1-3 предложения).
- Выделяй ключевые фразы жирным.
- Начинай с чёткого резюме или вывода.

USER: ${basePrompt}`;
    case 'autism':
      return `SYSTEM: Ты помощник для пользователя в спектре аутизма. Твоя цель — быть максимально ясным, прямым и однозначным.
- Используй буквальный и конкретный язык.
- Избегай идиом, метафор, сарказма и переносных значений.
- Формулируй главную мысль чётко и явно.
- Будь логичным и структурированным в ответах.

USER: ${basePrompt}`;
    default:
      return basePrompt;
  }
}

// ========== ОСНОВНЫЕ API ФУНКЦИИ ========== //

/**
 * Универсальный prompt через languageModel.
 * @param {object} payload - данные запроса
 * @param {object} config - конфигурация
 * @returns {Promise<string>} результат AI
 */
async function prompt(payload, config) {
  const session = await safeCreateSession('languageModel', { temperature: 0.7, topK: 3 });
  const contextualPrompt = buildContext(config, payload.text);
  const engineeredPrompt = getNeuroPrompt(config.userPreferences?.neuroFeature, contextualPrompt);
  return session.prompt(engineeredPrompt);
}

/**
 * Writer API - генерация текста с нуля.
 * @param {object} payload - данные запроса
 * @param {object} config - конфигурация
 * @returns {Promise<string>} сгенерированный текст
 */
async function writer(payload, config) {
  try {
    const session = await safeCreateSession('writer', { sharedContext: payload.context || '' });
    const contextualPrompt = buildContext(config, payload.text);
    const engineeredPrompt = getNeuroPrompt(config.userPreferences?.neuroFeature, contextualPrompt);
    return session.write(engineeredPrompt);
  } catch (error) {
    // Fallback на languageModel
    logError(error, 'writer fallback');
    const fallbackPrompt = `Напиши текст на основе: "${payload.text}"`;
    return prompt({ text: fallbackPrompt }, config);
  }
}

/**
 * Rewriter API - переписывание текста с изменением тона/длины.
 * @param {object} payload - данные запроса (text, tone, length)
 * @param {object} config - конфигурация
 * @returns {Promise<string>} переписанный текст
 */
async function rewriter(payload, config) {
  try {
    const session = await safeCreateSession('rewriter');
    const engineeredPrompt = getNeuroPrompt(
      config.userPreferences?.neuroFeature,
      `Перепиши следующий текст: "${payload.text}"`
    );
    return session.rewrite(engineeredPrompt, {
      tone: payload.tone || 'as-is',
      length: payload.length || 'as-is'
    });
  } catch (error) {
    // Fallback на languageModel
    logError(error, 'rewriter fallback');
    const fallbackPrompt = `Перепиши этот текст (тон: ${payload.tone || 'нейтральный'}, длина: ${payload.length || 'та же'}): "${payload.text}"`;
    return prompt({ text: fallbackPrompt }, config);
  }
}

/**
 * Summarizer API - создание краткого содержания.
 * @param {object} payload - данные запроса
 * @param {object} config - конфигурация
 * @returns {Promise<string>} резюме текста
 */
async function summarizer(payload, config) {
  try {
    const session = await safeCreateSession('summarizer', {
      type: payload.type || 'key-points',
      format: payload.format || 'plain-text',
      length: payload.length || 'short'
    });
    const engineeredPrompt = getNeuroPrompt(
      config.userPreferences?.neuroFeature,
      `Создай резюме: "${payload.text}"`
    );
    return session.summarize(engineeredPrompt);
  } catch (error) {
    // Fallback на languageModel
    logError(error, 'summarizer fallback');
    const fallbackPrompt = `Создай краткое резюме этого текста: "${payload.text}"`;
    return prompt({ text: fallbackPrompt }, config);
  }
}

/**
 * Proofreader - проверка грамматики, орфографии, пунктуации.
 * @param {object} payload - данные запроса
 * @param {object} config - конфигурация
 * @returns {Promise<string>} исправленный текст
 */
async function proofreader(payload, config) {
  const proofreadPrompt = `Проверь и исправь грамматику, орфографию и пунктуацию в этом тексте. Верни ТОЛЬКО исправленный текст без комментариев.

Текст: "${payload.text}"`;
  const engineeredPrompt = getNeuroPrompt(config.userPreferences?.neuroFeature, proofreadPrompt);
  
  try {
    const session = await safeCreateSession('languageModel', { temperature: 0.3, topK: 1 });
    return session.prompt(engineeredPrompt);
  } catch (error) {
    logError(error, 'proofreader');
    throw new AiApiError('Не удалось выполнить корректуру текста.', 'proofreader');
  }
}

/**
 * Autocomplete - предложение продолжения текста.
 * @param {object} payload - данные запроса (text - текст до курсора)
 * @param {object} config - конфигурация
 * @returns {Promise<string>} предложенное продолжение
 */
async function autocomplete(payload, config) {
  const autocompletePrompt = `Продолжи следующий текст естественным образом (не более 1-2 предложений):

"${payload.text}"`;
  const engineeredPrompt = getNeuroPrompt(config.userPreferences?.neuroFeature, autocompletePrompt);
  
  try {
    const session = await safeCreateSession('languageModel', { temperature: 0.8, topK: 5 });
    const result = await session.prompt(engineeredPrompt);
    // Возвращаем только новую часть (убираем дублирование исходного текста)
    return result.replace(payload.text, '').trim();
  } catch (error) {
    logError(error, 'autocomplete');
    return '';
  }
}

/**
 * Paragraph - генерация нового абзаца на основе контекста.
 * @param {object} payload - данные запроса (text - тема/контекст)
 * @param {object} config - конфигурация
 * @returns {Promise<string>} новый абзац
 */
async function paragraph(payload, config) {
  const paragraphPrompt = `Напиши один связный абзац на тему: "${payload.text}".
Абзац должен быть информативным и хорошо структурированным.`;
  const engineeredPrompt = getNeuroPrompt(config.userPreferences?.neuroFeature, paragraphPrompt);
  
  try {
    const session = await safeCreateSession('languageModel', { temperature: 0.7, topK: 3 });
    return session.prompt(engineeredPrompt);
  } catch (error) {
    logError(error, 'paragraph');
    throw new AiApiError('Не удалось сгенерировать абзац.', 'paragraph');
  }
}

// ========== МАРШРУТИЗАЦИЯ ========== //

const apiMap = {
  prompt,
  writer,
  rewriter,
  summarizer,
  proofreader,
  autocomplete,
  paragraph
};

/**
 * Универсальная функция для вызова любого AI действия.
 * @param {string} type - тип действия (writer, rewriter, proofreader и т.д.)
 * @param {object} payload - данные для AI
 * @param {object} config - конфигурация пользователя
 * @returns {Promise<string>} результат AI обработки
 */
async function getCompletion(type, payload, config) {
  if (!apiMap[type]) {
    throw new AiApiError(`Недопустимый тип действия: ${type}`, type);
  }

  try {
    const result = await apiMap[type](payload, config);
    return result;
  } catch (error) {
    logError(error, `getCompletion: ${type}`);
    
    // Для некоторых ошибок возвращаем понятное сообщение
    if (error instanceof AiApiError) {
      throw error;
    }
    
    throw new AiApiError(`Операция '${type}' не выполнена. ${error.message}`, type);
  }
}
