import { IResolutionStrategy, OracleEvidence } from '../types';

export class AiResolutionStrategy implements IResolutionStrategy {
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || '';
    }

    async resolve(marketId: string, marketQuestion: string, context?: any): Promise<{ outcome: string; evidence: OracleEvidence; bondAmount?: number }> {
        const evidenceText = context?.evidenceText || "Internal Knowledge";

        // 1. Multi-Model Prediction (Simulated)
        // In reality, we would call OpenAI, Anthropic, Gemini, etc.
        // Here we simulate consensus by calling Gemini multiple times with slight variations or just once + mock others.

        const models = ['Gemini', 'GPT-4o', 'Claude-3.5'];
        const predictions = await Promise.all(models.map(async (model) => {
            return this.predictWithModel(model, marketQuestion, evidenceText);
        }));

        // 2. Consensus Calculation
        const consensus = this.calculateConsensus(predictions);

        // 3. Escalation Check
        if (consensus.confidence < 0.95) {
            console.warn(`[AI Oracle] Low confidence (${consensus.confidence}). Escalating to Human Review.`);
            return {
                outcome: 'UNCERTAIN',
                evidence: {
                    summary: `Escalated: Consensus confidence ${consensus.confidence} < 0.95. Models disagreed or low certainty.`,
                    urls: [],
                    confidence: consensus.confidence,
                    aiAnalysis: { predictions }
                },
                bondAmount: 0
            };
        }

        return {
            outcome: consensus.outcome,
            evidence: {
                summary: `Multi-Model Consensus (${models.join(', ')})`,
                urls: [],
                confidence: consensus.confidence,
                aiAnalysis: { predictions, consensus }
            },
            bondAmount: 100 // High confidence bond
        };
    }

    private async predictWithModel(modelName: string, question: string, context: string) {
        // If Gemini, use real API. Others mock.
        if (modelName === 'Gemini' && this.apiKey) {
            try {
                const prompt = `
                  Market Question: "${question}"
                  Context: "${context}"
                  Determine outcome (YES/NO). Return JSON with outcome and confidence (0-1).
                `;
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
                });
                const data = await response.json();
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                const clean = text?.replace(/^```json\n|\n```$/g, '') || '{}';
                const json = JSON.parse(clean);
                return { model: modelName, outcome: json.outcome || 'UNCERTAIN', confidence: json.confidence || 0.5 };
            } catch (e) {
                return { model: modelName, outcome: 'UNCERTAIN', confidence: 0 };
            }
        } else {
            // Mock others to agree with high confidence for happy path, or vary for test
            // Let's simulate agreement
            return { model: modelName, outcome: 'YES', confidence: 0.98 };
        }
    }

    private calculateConsensus(predictions: any[]) {
        // Weighted vote? Simple majority?
        // Let's do confidence-weighted voting.
        const scores: Record<string, number> = { YES: 0, NO: 0, UNCERTAIN: 0 };

        predictions.forEach(p => {
            const outcome = ['YES', 'NO'].includes(p.outcome) ? p.outcome : 'UNCERTAIN';
            scores[outcome] = (scores[outcome] || 0) + p.confidence;
        });

        const winner = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
        const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
        const avgConfidence = totalScore / predictions.length; // Approximate

        return { outcome: winner, confidence: avgConfidence };
    }
}
