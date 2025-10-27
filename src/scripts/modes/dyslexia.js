// dyslexia.js - Dyslexia-Friendly Writing Mode
// Uses Rewriter API (simplify) + Writer API (easier vocabulary)

const dyslexiaMode = {
    name: 'dyslexia',
    displayName: 'Dyslexia-Friendly Writing',
    description: 'Simplifies text with shorter sentences and common words',
    font: 'OpenDyslexic',
    
    // Process text based on action
    async processText(action, text) {
        switch (action) {
            case 'simplify':
                return await this.simplify(text);
            case 'expand':
                return await this.expand(text);
            case 'grammar':
                return await this.checkGrammar(text);
            default:
                throw new Error('Unknown action');
        }
    },

    // Simplify text for dyslexia (break long sentences, use common words)
    async simplify(text) {
        try {
            // Use Rewriter API with specific options for simplification
            const available = await Rewriter.availability();
            
            if (available === 'unavailable') {
                return this.fallbackSimplify(text);
            }

            const rewriter = await Rewriter.create({
                sharedContext: 'Simplify this text for someone with dyslexia. Use short sentences, common words, and clear structure.',
                tone: 'casual',
                format: 'plain-text',
                length: 'shorter'
            });

            const result = await rewriter.rewrite(text);
            return result;
        } catch (error) {
            console.error('Dyslexia simplify error:', error);
            return this.fallbackSimplify(text);
        }
    },

    // Expand text with context
    async expand(text) {
        try {
            const available = await Writer.availability();
            
            if (available === 'unavailable') {
                return text + '\n\n[Writer API not available]';
            }

            const writer = await Writer.create({
                sharedContext: 'Expand this text with more details and examples, using simple language suitable for someone with dyslexia.',
                tone: 'casual',
                format: 'plain-text',
                length: 'medium'
            });

            const result = await writer.write(
                `Expand this text with more details: ${text}`,
                { context: 'Use short sentences and common words.' }
            );

            return result;
        } catch (error) {
            console.error('Dyslexia expand error:', error);
            return text + '\n\n[Unable to expand text]';
        }
    },

    // Check grammar
    async checkGrammar(text) {
        try {
            const available = await Proofreader.availability();
            
            if (available === 'unavailable') {
                return text + '\n\n[Proofreader not available]';
            }

            const proofreader = await Proofreader.create({
                expectedInputLanguages: ['en']
            });

            const result = await proofreader.proofread(text);
            
            if (result.correctedInput) {
                return result.correctedInput;
            } else if (result.corrected) {
                return result.corrected;
            } else {
                return text;
            }
        } catch (error) {
            console.error('Dyslexia grammar check error:', error);
            return text;
        }
    },

    // Fallback simplification (no API)
    fallbackSimplify(text) {
        // Break long sentences
        let result = text.replace(/([.!?])\s+/g, '$1\n\n');
        
        // Replace complex words with simpler alternatives
        const replacements = {
            'utilize': 'use',
            'demonstrate': 'show',
            'accomplish': 'do',
            'subsequently': 'then',
            'furthermore': 'also',
            'nevertheless': 'but',
            'therefore': 'so',
            'approximately': 'about',
            'sufficient': 'enough',
            'assistance': 'help'
        };

        for (const [complex, simple] of Object.entries(replacements)) {
            const regex = new RegExp(`\\b${complex}\\b`, 'gi');
            result = result.replace(regex, simple);
        }

        return result;
    }
};

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = dyslexiaMode;
}
