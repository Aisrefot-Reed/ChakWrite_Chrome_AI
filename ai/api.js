import { AiApiError, logError } from '../utils/errors.js';

/**
 * Checks if the main AI capability is available.
 * @returns {boolean} True if window.ai is available.
 */
function isAiAvailable() {
  return typeof window !== 'undefined' && window.ai;
}

/**
 * A generic wrapper for creating a session with a specific AI model.
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

// --- Specific API Functions ---

async function prompt(payload) {
  const session = await createSession('languageModel');
  return session.prompt(payload.text);
}

async function writer(payload) {
  const session = await createSession('writer');
  return session.prompt(payload.text);
}

async function rewriter(payload) {
  const session = await createSession('rewriter');
  // Rewriter might need more context, e.g., length, tone
  return session.rewrite(payload.text, { tone: payload.tone || 'neutral' });
}

async function summarizer(payload) {
  const session = await createSession('summarizer');
  return session.summarize(payload.text);
}

async function translator(payload) {
  const session = await createSession('translator');
  return session.translate(payload.text, { targetLanguage: payload.targetLang || 'en' });
}

async function proofreader(payload) {
  const session = await createSession('languageDetector'); // Note: API name is languageDetector
  const detected = await session.detect(payload.text);
  // This is just language detection. True proofreading would be a more complex flow.
  return `Detected language: ${detected.language}`;
}

// --- Main Router ---

const apiMap = {
  prompt,
  writer,
  rewriter,
  summarizer,
  translator,
  proofreader
};

/**
 * Generic completion function that routes to the correct AI API.
 * @param {string} type - The key for the desired AI function (e.g., 'writer').
 * @param {object} payload - The data to be processed by the AI.
 * @param {object} config - The user's configuration from storage.
 * @returns {Promise<string>} The result from the AI.
 */
export async function getCompletion(type, payload, config) {
  if (!apiMap[type]) {
    throw new AiApiError(`Invalid AI action type: ${type}`, type);
  }

  // Here you can enrich the payload with user settings from config
  // For example, applying neuro-inclusive text adaptations post-generation
  const neuroFeature = config.userPreferences?.neuroFeature;
  if (neuroFeature && neuroFeature !== 'none') {
    payload.text += `\n\n(Please adapt the response for a user with ${neuroFeature})`
  }

  try {
    const result = await apiMap[type](payload);
    // Post-processing can happen here based on neuro-inclusive settings
    return result;
  } catch (error) {
    logError(error, `getCompletion: ${type}`);
    // Provide a user-friendly fallback message
    return `The ${type} operation failed. Please try again.`;
  }
}
