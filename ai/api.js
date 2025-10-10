import { AiApiError, logError } from '../utils/errors.js';

/**
 * Checks if the main AI capability is available.
 * @returns {boolean} True if window.ai is available.
 */
function isAiAvailable() {
  // In a content script, window.ai is not directly available.
  // We rely on the background script to have access.
  // This check is more for popup/options pages.
  return typeof window !== 'undefined' && window.ai;
}

/**
 * A generic wrapper for creating a session with a specific AI model.
 * This function is intended to be run in a context where `window.ai` is available (like the popup or background).
 * @param {string} apiType - The type of AI model to create (e.g., 'languageModel', 'writer').
 * @param {object} options - Configuration options for the session.
 * @returns {Promise<object>} The created AI session.
 * @throws {AiApiError} If the API is not available or session creation fails.
 */
async function createSession(apiType, options = {}) {
  if (!isAiAvailable() || !window.ai[apiType]) {
    throw new AiApiError(`Chrome AI API '${apiType}' is not available.`, apiType);
  }
  try {
    return await window.ai[apiType](options);
  } catch (error) {
    logError(error, `createSession: ${apiType}`);
    throw new AiApiError(`Failed to create '${apiType}' session.`, apiType);
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
  const session = await createSession('languageModel');
  const engineeredPrompt = getNeuroPrompt(config.userPreferences?.neuroFeature, payload.text);
  return session.prompt(engineeredPrompt);
}

async function writer(payload, config) {
  const session = await createSession('writer');
  const engineeredPrompt = getNeuroPrompt(config.userPreferences?.neuroFeature, payload.text);
  return session.prompt(engineeredPrompt);
}

async function rewriter(payload, config) {
  const session = await createSession('rewriter');
  const engineeredPrompt = getNeuroPrompt(config.userPreferences?.neuroFeature, `Rewrite this: "${payload.text}"`);
  return session.rewrite(engineeredPrompt, {
    tone: payload.tone || 'neutral',
    length: payload.length || 'same' // 'shorter', 'longer'
  });
}

async function summarizer(payload, config) {
  const session = await createSession('summarizer');
  const engineeredPrompt = getNeuroPrompt(config.userPreferences?.neuroFeature, `Summarize this: "${payload.text}"`);
  return session.summarize(engineeredPrompt);
}

// Simulated Proofreader using the prompt API
async function proofreader(payload, config) {
  const proofreadPrompt = `Proofread the following text. Correct any grammar, spelling, and punctuation errors. Only return the corrected text, without any extra comments.
  Text to proofread: "${payload.text}"`;
  const engineeredPrompt = getNeuroPrompt(config.userPreferences?.neuroFeature, proofreadPrompt);
  const session = await createSession('languageModel');
  return session.prompt(engineeredPrompt);
}


// --- Main Router --- //

const apiMap = {
  prompt,
  writer,
  rewriter,
  summarizer,
  proofreader
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
export async function getCompletion(type, payload, config) {
  if (!apiMap[type]) {
    throw new AiApiError(`Invalid AI action type: ${type}`, type);
  }

  try {
    // The 'window.ai' object is only available in a specific context (e.g., popup, options).
    // Content scripts and background service workers need to operate differently.
    // This implementation assumes this code will be executed in a context with `window.ai`.
    // For a service worker, you'd need to use `self.ai`.
    const result = await apiMap[type](payload, config);
    return result;
  } catch (error) {
    logError(error, `getCompletion: ${type}`);
    return `The ${type} operation failed. The AI model may not be available or an error occurred.`;
  }
}