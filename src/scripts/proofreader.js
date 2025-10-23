// proofreader.js - функции для проверки орфографии
async function processTextWithProofreader(userText) {
    try {
        // Проверяем доступность модели
        const available = await Proofreader.availability();
        
        if (available === 'unavailable') {
            return 'Proofreader API недоступен в этом браузере.';
        }

        let proofreader;

        if (available === 'available') {
            proofreader = await Proofreader.create({
                expectedInputLanguages: ["en"]
            });
        } else {
            proofreader = await Proofreader.create({
                expectedInputLanguages: ["en"],
                monitor(m) {
                    m.addEventListener("downloadprogress", e => {
                        console.log(`Загрузка модели: ${(e.loaded / e.total * 100).toFixed(1)}%`);
                    });
                }
            });
        }

        // Выполняем проверку орфографии
        const proofreadResult = await proofreader.proofread(userText);
        
        console.log('Proofread result:', proofreadResult);

        // Используем correctedInput вместо corrected
        if (proofreadResult.correctedInput) {
            return proofreadResult.correctedInput;
        }
        // Или пробуем другие возможные названия свойств
        else if (proofreadResult.corrected) {
            return proofreadResult.corrected;
        }
        // Если свойств нет, собираем текст из corrections
        else if (proofreadResult.corrections && proofreadResult.corrections.length > 0) {
            return applyCorrections(userText, proofreadResult.corrections);
        }
        // Если нет исправлений, возвращаем исходный текст
        else {
            return userText;
        }
        
    } catch (error) {
        console.error('Ошибка проверки орфографии:', error);
        return 'Ошибка при проверке орфографии: ' + error.message;
    }
}

function applyCorrections(text, corrections) {
    let result = '';
    let lastIndex = 0;

    for (const correction of corrections) {
        // Текст до ошибки
        if (correction.startIndex > lastIndex) {
            result += text.substring(lastIndex, correction.startIndex);
        }
        
        // Исправленный текст
        result += correction.suggestion || text.substring(correction.startIndex, correction.endIndex);
        lastIndex = correction.endIndex;
    }

    // Остаток текста
    if (lastIndex < text.length) {
        result += text.substring(lastIndex);
    }

    return result;
}