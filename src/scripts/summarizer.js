// summarizer.js - функции для суммаризации текста
async function processTextWithSummarizer(userText) {
    try {
        // Проверяем поддержку API
        if (!('Summarizer' in self)) {
            return 'Summarizer API не поддерживается в этом браузере.';
        }

        // Проверяем доступность модели
        const availability = await Summarizer.availability();
        
        if (availability === 'unavailable') {
            return 'Summarizer API недоступен в этом браузере.';
        }

        let summarizer;
        const options = {
            type: 'key-points',
            format: 'plain-text',
            length: 'medium',
            sharedContext: 'Это текст для суммаризации'
        };

        if (availability === 'available') {
            // Модель готова к использованию
            summarizer = await Summarizer.create(options);
        } else {
            // Модель требует загрузки
            summarizer = await Summarizer.create({
                ...options,
                monitor(m) {
                    m.addEventListener('downloadprogress', (e) => {
                        const progress = (e.loaded / e.total * 100).toFixed(1);
                        console.log(`Загрузка модели суммаризации: ${progress}%`);
                    });
                }
            });
        }

        // Выполняем суммаризацию
        const summary = await summarizer.summarize(userText, {
            context: 'Пользователь запросил суммаризацию этого текста.'
        });

        return summary;
        
    } catch (error) {
        console.error('Ошибка суммаризации:', error);
        return 'Ошибка при суммаризации: ' + error.message;
    }
}

// Функция для суммаризации с настройками
async function processTextWithSummarizerAdvanced(userText, settings = {}) {
    try {
        if (!('Summarizer' in self)) {
            return 'Summarizer API не поддерживается.';
        }

        const availability = await Summarizer.availability();
        
        if (availability === 'unavailable') {
            return 'Summarizer API недоступен.';
        }

        const defaultOptions = {
            type: settings.type || 'key-points',
            format: settings.format || 'plain-text',
            length: settings.length || 'medium',
            sharedContext: settings.sharedContext || 'Общий контекст для суммаризации'
        };

        // Добавляем настройки языков если нужно
        if (settings.expectedInputLanguages) {
            defaultOptions.expectedInputLanguages = settings.expectedInputLanguages;
        }
        if (settings.outputLanguage) {
            defaultOptions.outputLanguage = settings.outputLanguage;
        }

        const summarizer = await Summarizer.create(defaultOptions);

        const summary = await summarizer.summarize(userText, {
            context: settings.context || 'Контекст для улучшения суммаризации'
        });

        return summary;
        
    } catch (error) {
        return 'Ошибка: ' + error.message;
    }
}

// Функция для проверки доступности Summarizer
async function checkSummarizerAvailability() {
    try {
        if (!('Summarizer' in self)) {
            return 'not-supported';
        }
        const available = await Summarizer.availability();
        return available;
    } catch (error) {
        return 'unavailable';
    }
}