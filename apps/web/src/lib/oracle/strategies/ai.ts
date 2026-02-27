import { IResolutionStrategy, OracleEvidence } from '../types';
import { executeWithRotation } from '@/lib/ai';

export class AiResolutionStrategy implements IResolutionStrategy {
    constructor() { }

    async resolve(marketId: string, marketQuestion: string, context?: any): Promise<{ outcome: string; evidence: OracleEvidence; bondAmount?: number }> {
        const evidenceText = context?.evidenceText || "Internal Knowledge";

        // 1. Retrieval (Simulated/Mocked - usually these flows fetch news first)
        const retrievalOutput = {
            searchQuery: marketQuestion,
            sourceCount: 3,
            sources: [
                { title: "Daily Star - Bangladesh News", url: "https://thedailystar.net", snippet: "Recent developments regarding " + marketQuestion },
                { title: "Prothom Alo", url: "https://prothomalo.com", snippet: "Official report on the matter." },
                { title: "BSS News", url: "https://bssnews.net", snippet: "Government agency confirmation." }
            ]
        };

        // 2. Multi-Model Prediction using AIRotationSystem (Combine Mode)
        const prompt = `
          Analyze the following market question and evidence to determine the final outcome.
          
          Market Question: "${marketQuestion}"
          Evidence: "${evidenceText}"
          
          You must return a valid JSON object with:
          - outcome: "YES" or "NO"
          - confidence: a number between 0 and 1
          - reasoning: a brief explanation in English
          - reasoningBn: a brief explanation in Bengali
        `;

        const response = await executeWithRotation(prompt, {
            mode: 'combine',
            timeoutMs: 30000,
            useBanglaContext: true
        });

        const aiData = response.data || {};
        const finalOutcome = aiData.outcome || 'UNCERTAIN';
        const finalConfidence = aiData.confidence || response.confidence / 100;
        const reasoning = aiData.reasoning || "Consensus reached via AI Rotation System.";
        const reasoningBn = aiData.reasoningBn || "এআই রোটেশন সিস্টেমের মাধ্যমে ঐকমত্যে পৌঁছেছে।";

        // 3. Structured Output for Pipeline
        const aiAnalysis = {
            query: { marketId, marketQuestion, context },
            retrieval_output: retrievalOutput,
            synthesis_output: {
                summary: `Analyzed evidence using AI Rotation System (Provider: ${response.provider}).`,
                keyPoints: [reasoning]
            },
            deliberation_output: {
                predictions: [{ model: response.provider, outcome: finalOutcome, confidence: finalConfidence }],
                consensus: { outcome: finalOutcome, confidence: finalConfidence },
                modelVersions: [response.provider]
            },
            explanation_output: {
                reasoning: reasoning,
                reasoningBn: reasoningBn,
                uncertainties: finalConfidence < 0.8 ? ["Low consensus confidence"] : []
            }
        };

        const recommendedAction = finalConfidence >= 0.9 ? 'AUTO_RESOLVE' : 'HUMAN_REVIEW';

        return {
            outcome: finalOutcome,
            evidence: {
                summary: reasoning,
                urls: retrievalOutput.sources.map(s => s.url),
                confidence: finalConfidence,
                aiAnalysis: {
                    ...aiAnalysis,
                    recommendedAction
                }
            },
            bondAmount: finalConfidence >= 0.9 ? 100 : 50
        };
    }
}
