// rewriter.js - функции для режима Rewrite
async function processTextWithRewriter(userText) {
    const options = {
        sharedContext: 'This is an email to acquaintances about an upcoming event.',
        tone: 'more-casual',
        format: 'plain-text',
        length: 'shorter',
    };

    const available = await Rewriter.availability();
    let rewriter;

    if (available === 'unavailable') {
        return 'Rewriter API недоступен в этом браузере.';
    }

    if (available === 'available') {
        rewriter = await Rewriter.create(options);
    } else {
        rewriter = await Rewriter.create(options);
        rewriter.addEventListener('downloadprogress', (e) => {
            console.log(`Загружено: ${e.loaded} из ${e.total}`);
        });
    }

    // Выполняем перезапись текста
    const result = await rewriter.rewrite(userText);
    return result;
}