// At the beginning of modes.js keep all definitions as-is, but at the end add:
export {
    dyslexiaMode,
    adhdMode,
    autismMode
}; // modes.js - Consolidated neurotype modes
// Combines dyslexia, ADHD, and autism modes into a single file

// Dyslexia-Friendly Mode
const dyslexiaMode = {
    name: 'dyslexia',
    displayName: 'Dyslexia-Friendly Writing',
    description: 'Simplifies text with shorter sentences and common words',
    font: 'OpenDyslexic',
    
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

    async simplify(text) {
        try {
            const available = await self.ai?.rewriter?.capabilities();
            
            if (!available || available.available === 'no') {
                return this.fallbackSimplify(text);
            }

            const rewriter = await self.ai.rewriter.create({
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

    async expand(text) {
        try {
            const available = await self.ai?.writer?.capabilities();
            
            if (!available || available.available === 'no') {
                return text + '\n\n[Writer API not available]';
            }

            const writer = await self.ai.writer.create({
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

    async checkGrammar(text) {
        try {
            const available = await self.ai?.languageModel?.capabilities();
            
            if (!available || available.available === 'no') {
                return text + '\n\n[Grammar checker not available]';
            }

            const session = await self.ai.languageModel.create();
            const result = await session.prompt(`Check and correct grammar in this text:\n\n${text}`);
            
            return result || text;
        } catch (error) {
            console.error('Dyslexia grammar check error:', error);
            return text;
        }
    },

    fallbackSimplify(text) {
        let result = text.replace(/([.!?])\s+/g, '$1\n\n');
        
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

// ADHD Focus Mode
const adhdMode = {
    name: 'adhd',
    displayName: 'ADHD Focus Mode',
    description: 'Breaks text into bullet points and highlights key information',
    
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

    async breakIntoBullets(text) {
        try {
            const available = await self.ai?.summarizer?.capabilities();
            
            if (!available || available.available === 'no') {
                return this.fallbackBullets(text);
            }

            const summarizer = await self.ai.summarizer.create({
                type: 'key-points',
                format: 'plain-text',
                length: 'short',
                sharedContext: 'Extract key points from this text and format them as short, clear bullet points for someone with ADHD.'
            });

            const summary = await summarizer.summarize(text);
            
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

    async addStructure(text) {
        try {
            const available = await self.ai?.writer?.capabilities();
            
            if (!available || available.available === 'no') {
                return this.fallbackStructure(text);
            }

            const writer = await self.ai.writer.create({
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

    async checkGrammar(text) {
        try {
            const available = await self.ai?.languageModel?.capabilities();
            
            if (!available || available.available === 'no') {
                return text + '\n\n[Grammar checker not available]';
            }

            const session = await self.ai.languageModel.create();
            const result = await session.prompt(`Check and correct grammar in this text:\n\n${text}`);
            
            return result || text;
        } catch (error) {
            console.error('ADHD grammar check error:', error);
            return text;
        }
    },

    fallbackBullets(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim());
        const keyPoints = sentences.slice(0, Math.min(5, sentences.length));
        return keyPoints.map(s => `• ${s.trim()}`).join('\n');
    },

    fallbackStructure(text) {
        const paragraphs = text.split(/\n\n+/);
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

// Clear & Direct Communication Mode (Autism)
const autismMode = {
    name: 'autism',
    displayName: 'Clear & Direct Communication',
    description: 'Removes metaphors and uses concrete, literal language',
    
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

    async makeDirectAndLiteral(text) {
        try {
            const available = await self.ai?.rewriter?.capabilities();
            
            if (!available || available.available === 'no') {
                return this.fallbackLiteral(text);
            }

            const rewriter = await self.ai.rewriter.create({
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

    async addConcreteDetails(text) {
        try {
            const available = await self.ai?.writer?.capabilities();
            
            if (!available || available.available === 'no') {
                return text + '\n\n[Writer API not available]';
            }

            const writer = await self.ai.writer.create({
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

    async checkGrammar(text) {
        try {
            const available = await self.ai?.languageModel?.capabilities();
            
            if (!available || available.available === 'no') {
                return text + '\n\n[Grammar checker not available]';
            }

            const session = await self.ai.languageModel.create();
            const result = await session.prompt(`Check and correct grammar in this text:\n\n${text}`);
            
            return result || text;
        } catch (error) {
            console.error('Autism grammar check error:', error);
            return text;
        }
    },

    fallbackLiteral(text) {
        const replacements = {
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
            'soon': 'in a few hours',
            'later': 'after finishing this task',
            'maybe': 'possibly, but not certain',
            'kind of': 'somewhat',
            'sort of': 'somewhat',
            'basically': '',
            'actually': '',
            'literally': ''
        };

        let result = text;
        
        for (const [metaphor, literal] of Object.entries(replacements)) {
            const regex = new RegExp(`\\b${metaphor}\\b`, 'gi');
            result = result.replace(regex, literal);
        }

        result = result.replace(/could you\s+/gi, 'please ');
        result = result.replace(/would you mind\s+/gi, 'please ');
        result = result.replace(/\b(um|uh|like|you know|I mean)\b/gi, '');
        result = result.replace(/\s+/g, ' ').trim();

        return result;
    }
};

// Modes are already globally available in Service Worker context
// (const declarations at top level are accessible)

console.log('ChakWrite modes loaded successfully');
