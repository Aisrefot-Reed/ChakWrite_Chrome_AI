

/**
 * Проверяет доступность AI в текущем контексте.
 * Важно: window.ai доступен в оффскрин/страницах UI, но не в content script.
 * @returns {boolean}
 */
function isAiAvailable() {
  return typeof window !== 'undefined' && window.ai;
}

/**
 * Создаёт сессию AI указанного типа (например, languageModel/rewriter) при наличии API.
 * Выполняется в контексте, где есть window.ai (offscreen, popup, options).
 * @param {string} apiType
 * @param {object} options
 */
async function createSession(apiType, options = {}) {
  if (!isAiAvailable() || !window.ai[apiType]) {
    throw new AiApiError(`Chrome AI API '${apiType}' недоступен.`, apiType);
  }
  try {
    return await window.ai[apiType](options);
  } catch (error) {
    logError(error, `createSession: ${apiType}`);
    throw new AiApiError(`Не удалось создать сессию '${apiType}'.`, apiType);
  }
}

// --- Neuro-inclusive Prompt Engineering --- //

function getNeuroPrompt(neuroFeature, basePrompt) {
  switch (neuroFeature) {
    case 'dyslexia':
      return `SYSTEM: You are an assistant for a user with dyslexia. Your primary goal is to make text clear and easy to read.
      - Use simple, common vocabulary.
      - Keep sentences short and direct.
      - Break down complex ideas into smaller, digestible parts.
      - Avoid jargon and complex sentence structures.
      USER: ${basePrompt}`;
    case 'adhd':
      return `SYSTEM: You are an assistant for a user with ADHD. Your goal is to make text engaging and easy to scan.
      - Use headings, bullet points, and numbered lists to structure information.
      - Keep paragraphs very short (1-3 sentences).
      - Use bold text to highlight key phrases.
      - Start with a clear summary or conclusion.
      USER: ${basePrompt}`;
    case 'autism':
      return `SYSTEM: You are an assistant for a user on the autism spectrum. Your goal is to be clear, direct, and unambiguous.
      - Use literal and concrete language.
      - Avoid idioms, metaphors, sarcasm, and figurative language.
      - State the main point clearly and explicitly.
      - Be logical and structured in your response.
      USER: ${basePrompt}`;
    default:
      return basePrompt;
  }
}


// --- Specific API Functions (to be called from background script) --- //

async function prompt(payload, config) {
  const ctx = buildContext(config, payload.context);
  const session = await safeCreate(['languageModel', 'prompt']);
  const engineeredPrompt = getNeuroPrompt(config.userPreferences?.neuroFeature, ctx + payload.text);
  return session.prompt(engineeredPrompt);
}

async function writer(payload, config) {
  const ctx = buildContext(config, payload.context);
  // Prefer dedicated writer if available, else fallback to languageModel
  const session = await safeCreate(['writer', 'languageModel']);
  const engineeredPrompt = getNeuroPrompt(config.userPreferences?.neuroFeature, ctx + payload.text);
  return session.prompt(engineeredPrompt);
}

async function rewriter(payload, config) {
  const ctx = buildContext(config, payload.context);
  const session = await safeCreate(['rewriter', 'languageModel']);
  const engineeredPrompt = getNeuroPrompt(
    config.userPreferences?.neuroFeature,
    `${ctx}Rewrite this: \"${payload.text}\"`
  );
  if (session.rewrite) {
    return session.rewrite(engineeredPrompt, {
      tone: payload.tone || 'neutral',
      length: payload.length || 'same' // 'shorter', 'longer'
    });
  } else {
    return session.prompt(engineeredPrompt);
  }
}

async function summarizer(payload, config) {
  const ctx = buildContext(config, payload.context);
  const session = await safeCreate(['summarizer', 'languageModel']);
  const engineeredPrompt = getNeuroPrompt(
    config.userPreferences?.neuroFeature,
    `${ctx}Summarize this: \"${payload.text}\"`
  );
  return session.summarize ? session.summarize(engineeredPrompt) : session.prompt(engineeredPrompt);
}

// Simulated Proofreader using the prompt API
async function proofreader(payload, config) {
  const ctx = buildContext(config, payload.context);
  const proofreadPrompt = `Proofread the following text. Correct any grammar, spelling, and punctuation errors. Only return the corrected text, without any extra comments.
  Text to proofread: \"${payload.text}\"`;
  const engineeredPrompt = getNeuroPrompt(config.userPreferences?.neuroFeature, ctx + proofreadPrompt);
  const session = await safeCreate(['proofreader', 'languageModel']);
  return session.proofread ? session.proofread(engineeredPrompt) : session.prompt(engineeredPrompt);
}

// Autocomplete next words for current sentence
async function autocomplete(payload, config) {
  const ctx = buildContext(config, payload.context);
  const promptText = `${ctx}Continue the following text succinctly and naturally. Only return the direct continuation without quotes.\n\n${payload.text}`;
  const session = await safeCreate(['prompt', 'languageModel']);
  return session.prompt(promptText);
}

// Paragraph generation based on context
async function paragraph(payload, config) {
  const ctx = buildContext(config, payload.context);
  const promptText = `${ctx}Write a coherent paragraph expanding on: \"${payload.text}\"`;
  const session = await safeCreate(['writer', 'languageModel']);
  return session.prompt(promptText);
}


// --- Main Router --- //

const apiMap = {
  prompt,
  writer,
  rewriter,
  summarizer,
  proofreader,
  autocomplete,
  paragraph
  // Translator and other APIs can be added here following the same pattern
};

/**
 * Generic completion function that routes to the correct AI API.
 * This function is designed to be called from the background script.
 * @param {string} type - The key for the desired AI function (e.g., 'writer').
 * @param {object} payload - The data to be processed by the AI.
 * @param {object} config - The user's configuration from storage.
 * @returns {Promise<string>} The result from the AI.
 */
async function getCompletion(type, payload, config) {
  if (!apiMap[type]) {
    throw new AiApiError(`Invalid AI action type: ${type}`, type);
  }

  try {
    const result = await apiMap[type](payload, config);
    return result;
  } catch (error) {
    logError(error, `getCompletion: ${type}`);
    return `The ${type} operation failed. The AI model may not be available or an error occurred.`;
  }
}

// Вспомогательные функции
function buildContext(config, extra) {
  const ctx = config?.context?.lastSelectedText ? `Контекст: ${config.context.lastSelectedText}\n\n` : '';
  return (extra ? `${extra}\n` : '') + ctx;
}

// Безопасное создание сессии: пробуем предпочитаемые API, иначе languageModel
async function safeCreate(preferredApis = []) {
  for (const api of preferredApis) {
    try {
      if (isAiAvailable() && window.ai[api]) {
        return await window.ai[api]();
      }
    } catch (_) { /* пробуем следующий */ }
  }
  if (isAiAvailable() && window.ai.languageModel) {
    return await window.ai.languageModel();
  }
  throw new AiApiError('Нет подходящего Chrome AI API.', preferredApis[0] || 'languageModel');
}
