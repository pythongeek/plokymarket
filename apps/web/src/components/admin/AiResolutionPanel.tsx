'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Brain, CheckCircle, XCircle, ExternalLink, Globe, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface Market {
  id: string;
  question: string;
  category: string;
  ends_at: string;
  resolution_method?: string;
}

interface SearchResult {
  facts: string[];
  sources: Array<{ title: string; url: string; snippet: string }>;
  keyEvents: string[];
  conflictingInfo: string[];
}

interface Resolution {
  outcome: 'YES' | 'NO' | 'UNRESOLVED';
  confidence: number;
  reasoning: string;
  reasoningBn: string;
  sources: Array<{ name: string; url?: string; tier: number }>;
  recommendedAction: 'AUTO_RESOLVE' | 'HUMAN_REVIEW' | 'ESCALATE';
  certaintyLevel: string;
  certaintyBn: string;
}

interface PipelineResult {
  success: boolean;
  searchResults: SearchResult;
  resolution: Resolution;
  executionTimeMs: number;
  error?: string;
}

export function AiResolutionPanel({ markets, onResolve }: { markets: Market[]; onResolve: (marketId: string, outcome: boolean) => void }) {
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [stage, setStage] = useState<'idle' | 'searching' | 'reasoning' | 'done'>('idle');
  const [result, setResult] = useState<PipelineResult | null>(null);

  const handleRunAI = async () => {
    if (!selectedMarket) return;
    setIsRunning(true);
    setStage('searching');
    setResult(null);

    try {
      const res = await fetch('/api/admin/resolution/ai-resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId: selectedMarket.id,
          marketQuestion: selectedMarket.question,
          category: selectedMarket.category,
        }),
      });

      // Switch stage after initial response headers
      setStage('reasoning');

      const data = await res.json();
      setResult(data);
      setStage(data.success ? 'done' : 'idle');

      if (data.success) {
        toast.success(`AI resolution complete: ${data.resolution.outcome} (${(data.resolution.confidence * 100).toFixed(0)}%)`);
      } else {
        toast.error(data.error || 'AI resolution failed');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error');
      setStage('idle');
    } finally {
      setIsRunning(false);
    }
  };

  const outcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'YES': return 'bg-emerald-600 text-white';
      case 'NO': return 'bg-red-600 text-white';
      case 'UNRESOLVED': return 'bg-amber-600 text-white';
      default: return 'bg-zinc-600 text-white';
    }
  };

  const actionColor = (action: string) => {
    switch (action) {
      case 'AUTO_RESOLVE': return 'text-emerald-400 border-emerald-600';
      case 'HUMAN_REVIEW': return 'text-amber-400 border-amber-600';
      case 'ESCALATE': return 'text-red-400 border-red-600';
      default: return 'text-zinc-400 border-zinc-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Market Selector */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-purple-400" /> Gemini + MiniMax AI Oracle
          </CardTitle>
          <CardDescription>
            Real-time web search via Gemini → Reasoned resolution via MiniMax-M2.7
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-zinc-300 mb-2 block">Select Market to Resolve</label>
            <select
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={selectedMarket?.id || ''}
              onChange={(e) => {
                const m = markets.find((m) => m.id === e.target.value);
                setSelectedMarket(m || null);
                setResult(null);
                setStage('idle');
              }}
            >
              <option value="">-- Choose a market --</option>
              {markets.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.question} [{m.category}]
                </option>
              ))}
            </select>
          </div>

          {selectedMarket && (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleRunAI}
                disabled={isRunning}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {stage === 'searching' ? 'Gemini Searching Web...' : 'MiniMax Reasoning...'}
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Run Gemini + MiniMax Resolution
                  </>
                )}
              </Button>
              {isRunning && (
                <span className="text-xs text-zinc-500">This takes ~20-30 seconds...</span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Resolution Decision Card */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" /> AI Resolution Decision
              </CardTitle>
              <CardDescription>
                Completed in {(result.executionTimeMs / 1000).toFixed(1)}s • {result.searchResults.facts.length} facts • {result.searchResults.sources.length} sources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Outcome Row */}
              <div className="flex items-center gap-4">
                <Badge className={`${outcomeColor(result.resolution.outcome)} text-lg px-4 py-1`}>
                  {result.resolution.outcome}
                </Badge>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-400">Confidence</span>
                    <span className="text-sm font-medium text-white">{(result.resolution.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full transition-all"
                      style={{ width: `${result.resolution.confidence * 100}%` }}
                    />
                  </div>
                </div>
                <Badge variant="outline" className={`${actionColor(result.resolution.recommendedAction)}`}>
                  {result.resolution.recommendedAction}
                </Badge>
              </div>

              {/* Reasoning */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-zinc-300">Reasoning (English)</h4>
                <p className="text-sm text-zinc-400 bg-zinc-950 p-3 rounded-md border border-zinc-800">
                  {result.resolution.reasoning}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-zinc-300">হেতুয়া (Bengali)</h4>
                <p className="text-sm text-zinc-400 bg-zinc-950 p-3 rounded-md border border-zinc-800">
                  {result.resolution.reasoningBn}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-zinc-300">নির্ণয় নিশ্নতা (Certainty)</h4>
                <p className="text-sm text-amber-400 bg-zinc-950 p-3 rounded-md border border-zinc-800">
                  {result.resolution.certaintyBn}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                  disabled={result.resolution.recommendedAction !== 'AUTO_RESOLVE' && result.resolution.confidence < 0.75}
                  onClick={() => onResolve(selectedMarket!.id, result.resolution.outcome === 'YES')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Accept & Resolve {result.resolution.outcome === 'YES' ? 'YES' : 'NO'}
                </Button>
                <Button
                  variant="outline"
                  className="border-amber-600 text-amber-400 flex-1"
                  onClick={() => toast.info('Sent to human review queue')}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Send to Human Review
                </Button>
                <Button
                  variant="outline"
                  className="border-red-600 text-red-400"
                  onClick={() => { setResult(null); setStage('idle'); }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Discard
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search Evidence Card */}
          <Card className="bg-zinc-900/50 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-400" /> Gemini Search Evidence
              </CardTitle>
              <CardDescription>Raw facts extracted from real-time web search</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Facts */}
              {result.searchResults.facts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-zinc-300">Key Facts</h4>
                  <ul className="space-y-1">
                    {result.searchResults.facts.map((fact, i) => (
                      <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5">•</span>
                        {fact}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sources */}
              {result.searchResults.sources.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-zinc-300">Sources</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {result.searchResults.sources.map((src, i) => (
                      <a
                        key={i}
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-zinc-400 bg-zinc-950 p-2 rounded-md border border-zinc-800 hover:border-blue-600 transition-colors flex items-start gap-2 group"
                      >
                        <ExternalLink className="w-3 h-3 mt-0.5 text-zinc-600 group-hover:text-blue-400 shrink-0" />
                        <div>
                          <span className="text-blue-400 font-medium">{src.title}</span>
                          <p className="text-xs text-zinc-500 mt-0.5">{src.snippet}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Events */}
              {result.searchResults.keyEvents.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-zinc-300">Key Events</h4>
                  <ul className="space-y-1">
                    {result.searchResults.keyEvents.map((evt, i) => (
                      <li key={i} className="text-sm text-zinc-400 flex items-start gap-2">
                        <span className="text-purple-500 mt-0.5">▸</span>
                        {evt}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Conflicts */}
              {result.searchResults.conflictingInfo.length > 0 && (
                <Alert className="bg-amber-950/30 border-amber-800">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <AlertDescription className="text-amber-400 text-sm">
                    <strong>Conflicting information detected:</strong>
                    <ul className="mt-1 space-y-0.5">
                      {result.searchResults.conflictingInfo.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
