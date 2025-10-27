// prompt.js - Prompt API integration with Gemini Nano
// System prompt configuration
const SYSTEM_PROMPT = `You are a helpful and friendly assistant specialized in writing assistance.
You help users with:
- Creating new content
- Rewriting text in different styles
- Checking grammar and spelling
- Summarizing long texts

Always provide clear, concise, and helpful responses.`;

let currentSession = null;

// Check if Prompt API is available
async function checkPromptAPIAvailability() {
    try {
        if (!('LanguageModel' in self)) {
            console.warn('Prompt API не поддерживается в этом браузере');
            return 'unavailable';
        }
        
        const availability = await LanguageModel.availability();
        console.log('Prompt API availability:', availability);
        return availability;
    } catch (error) {
        console.error('Ошибка проверки доступности Prompt API:', error);
        return 'unavailable';
    }
}

// Create a new session with system prompt
async function createPromptSession(options = {}) {
    try {
        const availability = await checkPromptAPIAvailability();
        
        if (availability === 'unavailable') {
            throw new Error('Prompt API недоступен');
        }
        
        const params = await LanguageModel.params();
        console.log('Model params:', params);
        
        const sessionOptions = {
            temperature: options.temperature || params.defaultTemperature,
            topK: options.topK || params.defaultTopK,
            initialPrompts: [
                { role: 'system', content: SYSTEM_PROMPT }
            ]
        };
        
        // Handle download progress if needed
        if (availability === 'downloadable' || availability === 'downloading') {
            sessionOptions.monitor = (m) => {
                m.addEventListener('downloadprogress', (e) => {
                    const progress = (e.loaded / e.total * 100).toFixed(1);
                    console.log(`Загрузка модели: ${progress}%`);
                });
            };
        }
        
        const session = await LanguageModel.create(sessionOptions);
        console.log('Session created successfully');
        return session;
    } catch (error) {
        console.error('Ошибка создания сессии:', error);
        throw error;
    }
}

// Get or create session
async function getSession() {
    if (!currentSession) {
        currentSession = await createPromptSession();
    }
    return currentSession;
}

// Prompt with non-streamed output
async function promptWithAPI(userText, options = {}) {
    try {
        const session = await getSession();
        
        console.log(`Input usage: ${session.inputUsage}/${session.inputQuota}`);
        
        const result = await session.prompt(userText, options);
        return result;
    } catch (error) {
        console.error('Ошибка при промпте:', error);
        throw error;
    }
}

// Prompt with streamed output
async function promptStreamingWithAPI(userText, options = {}) {
    try {
        const session = await getSession();
        
        console.log(`Input usage: ${session.inputUsage}/${session.inputQuota}`);
        
        const stream = session.promptStreaming(userText, options);
        return stream;
    } catch (error) {
        console.error('Ошибка при стриминг-промпте:', error);
        throw error;
    }
}

// Destroy current session
function destroySession() {
    if (currentSession) {
        currentSession.destroy();
        currentSession = null;
        console.log('Session destroyed');
    }
}

// Clone current session
async function cloneSession(options = {}) {
    try {
        if (!currentSession) {
            throw new Error('Нет активной сессии для клонирования');
        }
        
        const cloned = await currentSession.clone(options);
        console.log('Session cloned successfully');
        return cloned;
    } catch (error) {
        console.error('Ошибка при клонировании сессии:', error);
        throw error;
    }
}

// Main function for processing text with Prompt API
async function processTextWithPromptAPI(userText) {
    try {
        const availability = await checkPromptAPIAvailability();
        
        if (availability === 'unavailable') {
            return 'Prompt API недоступен в этом браузере. Попробуйте использовать другие режимы.';
        }
        
        // Use non-streamed for simplicity, can switch to streaming if needed
        const result = await promptWithAPI(userText);
        return result || 'Результат не получен';
    } catch (error) {
        console.error('Ошибка обработки текста:', error);
        return `Ошибка: ${error.message}`;
    }
}

// Export functions for use in other scripts
if (typeof window !== 'undefined') {
    window.promptAPI = {
        checkAvailability: checkPromptAPIAvailability,
        createSession: createPromptSession,
        getSession: getSession,
        prompt: promptWithAPI,
        promptStreaming: promptStreamingWithAPI,
        destroySession: destroySession,
        cloneSession: cloneSession,
        processText: processTextWithPromptAPI
    };
}
