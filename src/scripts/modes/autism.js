// autism.js - Clear & Direct Communication Mode
// Uses Rewriter API (literal language) + Proofreader API

const autismMode = {
    name: 'autism',
    displayName: 'Clear & Direct Communication',
    description: 'Removes metaphors and uses concrete, literal language',
    
    // Process text based on action
    async processText(action, text) {
        switch (action) {
            case 'simplify':
                return await this.makeDirectAndLiteral(text);
            case 'expand':
                return await this.addConcreteDetails(text);
            case 'grammar':
                return await this.checkGrammar(text);
            default:
                throw new Error('Unknown action');
        }
    },

    // Make text direct and literal (remove metaphors, idioms, ambiguity)
    async makeDirectAndLiteral(text) {
        try {
            const available = await Rewriter.availability();
            
            if (available === 'unavailable') {
                return this.fallbackLiteral(text);
            }

            const rewriter = await Rewriter.create({
                sharedContext: 'Rewrite this text using literal, concrete language. Remove metaphors, idioms, and ambiguous phrases. Be direct and specific. Suitable for someone who prefers clear, explicit communication.',
                tone: 'formal',
                format: 'plain-text',
                length: 'as-is'
            });

            const result = await rewriter.rewrite(text);
            return result;
        } catch (error) {
            console.error('Autism literal rewrite error:', error);
            return this.fallbackLiteral(text);
        }
    },

    // Add concrete details and examples
    async addConcreteDetails(text) {
        try {
            const available = await Writer.availability();
            
            if (available === 'unavailable') {
                return text + '\n\n[Writer API not available]';
            }

            const writer = await Writer.create({
                sharedContext: 'Expand this text with concrete examples and specific details. Avoid vague language. Be explicit and clear.',
                tone: 'formal',
                format: 'plain-text',
                length: 'medium'
            });

            const result = await writer.write(
                `Add concrete examples and specific details to this text:\n\n${text}`,
                { context: 'Use literal language. Be specific and direct. Avoid metaphors or abstract concepts.' }
            );

            return result;
        } catch (error) {
            console.error('Autism expand error:', error);
            return text + '\n\n[Unable to expand text]';
        }
    },

    // Check grammar and clarity
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
            console.error('Autism grammar check error:', error);
            return text;
        }
    },

    // Fallback: Remove common metaphors and idioms
    fallbackLiteral(text) {
        // Common metaphors/idioms to literal translations
        const replacements = {
            // Idioms
            'piece of cake': 'easy',
            'break a leg': 'good luck',
            'hit the nail on the head': 'exactly correct',
            'raining cats and dogs': 'raining heavily',
            'spill the beans': 'reveal a secret',
            'under the weather': 'sick',
            'costs an arm and a leg': 'very expensive',
            'once in a blue moon': 'rarely',
            'the ball is in your court': 'it is your turn to make a decision',
            'barking up the wrong tree': 'looking in the wrong place',
            
            // Metaphorical phrases
            'at the end of the day': 'ultimately',
            'think outside the box': 'think creatively',
            'on the same page': 'in agreement',
            'touch base': 'contact',
            'circle back': 'return to discuss',
            'low-hanging fruit': 'easy tasks',
            'move the needle': 'make progress',
            'take it offline': 'discuss privately',
            'deep dive': 'detailed examination',
            'game changer': 'significant innovation',
            
            // Vague terms
            'soon': 'in a few hours',
            'later': 'after finishing this task',
            'maybe': 'possibly, but not certain',
            'kind of': 'somewhat',
            'sort of': 'somewhat',
            'basically': '',
            'actually': '',
            'literally': '' // often misused
        };

        let result = text;
        
        for (const [metaphor, literal] of Object.entries(replacements)) {
            const regex = new RegExp(`\\b${metaphor}\\b`, 'gi');
            result = result.replace(regex, literal);
        }

        // Make questions more explicit
        result = result.replace(/could you\s+/gi, 'please ');
        result = result.replace(/would you mind\s+/gi, 'please ');
        
        // Remove filler words
        result = result.replace(/\b(um|uh|like|you know|I mean)\b/gi, '');
        
        // Clean up extra spaces
        result = result.replace(/\s+/g, ' ').trim();

        return result;
    }
};

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = autismMode;
}
