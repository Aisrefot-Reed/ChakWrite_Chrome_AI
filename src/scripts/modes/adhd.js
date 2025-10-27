// adhd.js - ADHD Focus Mode
// Uses Summarizer API + Writer API (short paragraphs, bullet points)

const adhdMode = {
    name: 'adhd',
    displayName: 'ADHD Focus Mode',
    description: 'Breaks text into bullet points and highlights key information',
    
    // Process text based on action
    async processText(action, text) {
        switch (action) {
            case 'simplify':
                return await this.breakIntoBullets(text);
            case 'expand':
                return await this.addStructure(text);
            case 'grammar':
                return await this.checkGrammar(text);
            default:
                throw new Error('Unknown action');
        }
    },

    // Break text into bullet points with key information
    async breakIntoBullets(text) {
        try {
            const available = await Summarizer.availability();
            
            if (available === 'unavailable') {
                return this.fallbackBullets(text);
            }

            const summarizer = await Summarizer.create({
                type: 'key-points',
                format: 'plain-text',
                length: 'short',
                sharedContext: 'Extract key points from this text and format them as short, clear bullet points for someone with ADHD.'
            });

            const summary = await summarizer.summarize(text);
            
            // Format as bullet points if not already
            if (!summary.includes('•') && !summary.includes('*') && !summary.includes('-')) {
                const sentences = summary.split(/[.!?]+/).filter(s => s.trim());
                return sentences.map(s => `• ${s.trim()}`).join('\n');
            }
            
            return summary;
        } catch (error) {
            console.error('ADHD bullet points error:', error);
            return this.fallbackBullets(text);
        }
    },

    // Add structure and transitions
    async addStructure(text) {
        try {
            const available = await Writer.availability();
            
            if (available === 'unavailable') {
                return text + '\n\n[Writer API not available]';
            }

            const writer = await Writer.create({
                sharedContext: 'Restructure this text with clear headings, short paragraphs, and transition words. Make it easy to scan for someone with ADHD.',
                tone: 'casual',
                format: 'plain-text',
                length: 'medium'
            });

            const result = await writer.write(
                `Restructure this text with clear sections and transitions:\n\n${text}`,
                { context: 'Use short paragraphs, bullet points, and clear transitions between ideas.' }
            );

            return result;
        } catch (error) {
            console.error('ADHD structure error:', error);
            return this.fallbackStructure(text);
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
            console.error('ADHD grammar check error:', error);
            return text;
        }
    },

    // Fallback: Convert to bullet points
    fallbackBullets(text) {
        // Split into sentences
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        
        // Take first 5 key sentences
        const keyPoints = sentences.slice(0, Math.min(5, sentences.length));
        
        return keyPoints.map(s => `• ${s.trim()}`).join('\n');
    },

    // Fallback: Add basic structure
    fallbackStructure(text) {
        // Split into paragraphs
        const paragraphs = text.split(/\n\n+/);
        
        // Add transitions between paragraphs
        const transitions = ['First:', 'Then:', 'Next:', 'Also:', 'Finally:'];
        
        let result = '';
        paragraphs.forEach((para, index) => {
            if (index < transitions.length) {
                result += `${transitions[index]} ${para}\n\n`;
            } else {
                result += `${para}\n\n`;
            }
        });
        
        return result.trim();
    }
};

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = adhdMode;
}
