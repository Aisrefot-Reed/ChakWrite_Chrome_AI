// app.js - основной файл с переключением режимов
document.addEventListener('DOMContentLoaded', function() {
    const modeSelect = document.getElementById('modeSelect');
    const submitBtn = document.getElementById('submitBtn');
    const userInput = document.getElementById('userInput');
    const outputElement = document.getElementById('output');

    submitBtn.addEventListener('click', handleSubmit);

    // Функция для определения текущего режима
    function getCurrentMode() {
        return modeSelect.value;
    }

    async function handleSubmit() {
        const userText = userInput.value.trim();
        
        if (!userText) {
            outputElement.textContent = 'Пожалуйста, введите текст';
            return;
        }

        outputElement.textContent = 'Обработка...';
        submitBtn.disabled = true;
        
        try {
            let result;
            const mode = getCurrentMode();
            
            switch(mode) {
                case 'rewrite':
                    if (typeof processTextWithRewriter === 'function') {
                        result = await processTextWithRewriter(userText);
                    } else {
                        result = 'Функция rewrite не доступна';
                    }
                    break;
                case 'write':
                    if (typeof processTextWithWriter === 'function') {
                        result = await processTextWithWriter(userText);
                    } else {
                        result = 'Функция write не доступна';
                    }
                    break;
                case 'proofread':
                    if (typeof processTextWithProofreader === 'function') {
                        result = await processTextWithProofreader(userText);
                    } else {
                        result = 'Функция proofread не доступна';
                    }
                    break;
                case 'summarize':
                    if (typeof processTextWithSummarizer === 'function') {
                        result = await processTextWithSummarizer(userText);
                    } else {
                        result = 'Функция summarize не доступна';
                    }
                    break;
                default:
                    result = 'Неизвестный режим';
            }
            
            outputElement.textContent = result || 'Результат не получен';
            
        } catch (error) {
            console.error('Ошибка:', error);
            outputElement.textContent = 'Ошибка: ' + error.message;
        } finally {
            submitBtn.disabled = false;
        }
    }
});