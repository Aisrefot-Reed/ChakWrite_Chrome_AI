// writer.js - функции для режима Write
async function processTextWithWriter(userText) {
    const options = {
        sharedContext: 'This is an email to Associates about an upcoming event.',
        tone: 'casual',
        format: 'plain-text',
        length: 'medium',
    };

    const available = await Writer.availability();

    if (available === 'unavailable') {
        return 'Writer API unavailable.';
    } else if (available === 'available') {
        let writer;
        writer = await Writer.create(options);

        const result = await writer.write(
            userText,
            {
                context: "I'm a seasoned customer.",
            },
        );
        return result;
    } else {
        const writer = await Writer.create({
            ...options,
            tone: "formal",
            expectedInputLanguages: ["en", "ja", "es"],
            expectedContextLanguages: ["en", "ja", "es"],
            outputLanguage: "es",
            sharedContext: "These are requests to write messages to teachers in a Spanish language program, by students who may speak Spanish, Japanese, or English. Staff expect questions to be written in Spanish."
        });

        const result = await writer.write(
            userText,
            {
                context: "I'm a seasoned customer.",
            },
        );
        return result;
    }
}