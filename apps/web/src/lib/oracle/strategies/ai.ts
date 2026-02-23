import { IResolutionStrategy, OracleEvidence } from '../types';

export class AiResolutionStrategy implements IResolutionStrategy {
    private apiKey: string;

    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY || '';
    }

    async resolve(marketId: string, marketQuestion: string, context?: any): Promise<{ outcome: string; evidence: OracleEvidence; bondAmount?: number }> {
        const evidenceText = context?.evidenceText || "Internal Knowledge";

        // 1. Retrieval (Simulated/Mocked)
        const retrievalOutput = {
            searchQuery: marketQuestion,
            sourceCount: 3,
            sources: [
                { title: "Daily Star - Bangladesh News", url: "https://thedailystar.net", snippet: "Recent developments regarding " + marketQuestion },
                { title: "Prothom Alo", url: "https://prothomalo.com", snippet: "Official report on the matter." },
                { title: "BSS News", url: "https://bssnews.net", snippet: "Government agency confirmation." }
            ]
        };

        // 2. Multi-Model Prediction (Simulated)
        const models = ['Gemini-1.5-Flash', 'GPT-4o', 'Claude-3.5-Sonnet'];
        const predictions = await Promise.all(models.map(async (model) => {
            return this.predictWithModel(model, marketQuestion, evidenceText);
        }));

        // 3. Consensus Calculation (Deliberation)
        const consensus = this.calculateConsensus(predictions);

        // 4. Structured Output for Pipeline
        const aiAnalysis = {
            query: { marketId, marketQuestion, context },
            retrieval_output: retrievalOutput,
            synthesis_output: {
                summary: `Analyzed evidence from ${retrievalOutput.sourceCount} sources.`,
                keyPoints: ["Confirmed event timing.", "Identified authoritative source."]
            },
            deliberation_output: {
                predictions,
                consensus,
                modelVersions: models
            },
            explanation_output: {
                reasoning: `Market resolved based on ${consensus.outcome} consensus with ${Math.round(consensus.confidence * 100)}% confidence.`,
                uncertainties: consensus.confidence < 0.9 ? ["Disagreement between models", "Source latency"] : []
            }
        };

        // 5. Escalation Check
        const finalOutcome = consensus.outcome;
        const finalConfidence = consensus.confidence;
        const recommendedAction = finalConfidence >= 0.95 ? 'AUTO_RESOLVE' : 'HUMAN_REVIEW';

        return {
            outcome: finalOutcome,
            evidence: {
                summary: aiAnalysis.explanation_output.reasoning,
                urls: retrievalOutput.sources.map(s => s.url),
                confidence: finalConfidence,
                aiAnalysis: {
                    ...aiAnalysis,
                    recommendedAction
                }
            },
            bondAmount: finalConfidence >= 0.95 ? 100 : 50
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
