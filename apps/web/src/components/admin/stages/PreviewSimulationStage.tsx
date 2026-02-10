'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  TrendingUp,
  Users,
  DollarSign,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Check,
  BarChart3,
  Activity
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import type { MarketDraft } from '@/lib/market-creation/service';

interface PreviewSimulationStageProps {
  draft: MarketDraft;
  onSave: (data: Record<string, any>) => Promise<boolean>;
  onBack?: () => void;
  isSaving: boolean;
  errors: string[];
}

// Mock simulation data
const generateSimulationData = () => ({
  estimatedVolume: Math.floor(Math.random() * 50000) + 10000,
  estimatedTraders: Math.floor(Math.random() * 500) + 50,
  priceDiscovery: {
    initialPrice: 0.5,
    projectedRange: [0.3, 0.7],
    volatility: Math.random() * 0.2 + 0.1
  },
  liquidityDepth: {
    yes: Array.from({ length: 10 }, (_, i) => ({
      price: 0.5 + i * 0.05,
      size: Math.floor(Math.random() * 1000) + 100
    })),
    no: Array.from({ length: 10 }, (_, i) => ({
      price: 0.5 - i * 0.05,
      size: Math.floor(Math.random() * 1000) + 100
    }))
  },
  fees: {
    platform: 2,
    estimatedDaily: Math.floor(Math.random() * 500) + 100
  }
});

export function PreviewSimulationStage({
  draft,
  onSave,
  onBack,
  isSaving,
  errors
}: PreviewSimulationStageProps) {
  const { t } = useTranslation();
  const [simulationData, setSimulationData] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = async () => {
    setIsSimulating(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSimulationData(generateSimulationData());
    setIsSimulating(false);
  };

  const handleSubmit = async () => {
    await onSave({
      simulation_results: simulationData
    });
  };

  if (!simulationData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Play className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">
            Virtual Market Simulation
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Run a simulation to estimate trading volume, price discovery, and liquidity depth 
            before deploying your market.
          </p>
          <Button 
            onClick={runSimulation} 
            disabled={isSimulating}
            size="lg"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Running Simulation...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Simulation
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="font-medium">Price Discovery</p>
            <p className="text-xs text-muted-foreground">
              Estimate fair price based on category and question type
            </p>
          </Card>
          <Card className="p-4 text-center">
            <Users className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="font-medium">Trader Estimates</p>
            <p className="text-xs text-muted-foreground">
              Projected number of unique traders
            </p>
          </Card>
          <Card className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="font-medium">Volume Forecast</p>
            <p className="text-xs text-muted-foreground">
              Expected trading volume over market lifetime
            </p>
          </Card>
        </div>

        <div className="flex justify-between pt-6 border-t">
          <Button variant="outline" onClick={onBack} disabled={isSimulating}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button onClick={handleSubmit} disabled={isSimulating} variant="outline">
            Skip Simulation
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simulation Complete */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-medium text-green-900 dark:text-green-100">
              Simulation Complete
            </p>
            <p className="text-sm text-green-700 dark:text-green-300">
              Market viability: Good - Proceed with deployment
            </p>
          </div>
        </div>
      </motion.div>

      {/* Simulation Results */}
      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
          <TabsTrigger value="prices">Prices</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Est. Volume</p>
              <p className="text-2xl font-bold">${simulationData.estimatedVolume.toLocaleString()}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Est. Traders</p>
              <p className="text-2xl font-bold">{simulationData.estimatedTraders}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Initial Price</p>
              <p className="text-2xl font-bold">${simulationData.priceDiscovery.initialPrice.toFixed(2)}</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-muted-foreground">Volatility</p>
              <p className="text-2xl font-bold">{(simulationData.priceDiscovery.volatility * 100).toFixed(1)}%</p>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Price Discovery Projection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-32 flex items-end gap-1">
                {Array.from({ length: 20 }, (_, i) => {
                  const height = 30 + Math.random() * 50;
                  return (
                    <div
                      key={i}
                      className="flex-1 bg-primary/20 rounded-t"
                      style={{ height: `${height}%` }}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Launch</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>Resolution</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="liquidity" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">YES Side Depth</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {simulationData.liquidityDepth.yes.slice(0, 5).map((level: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm w-12">${level.price.toFixed(2)}</span>
                    <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                      <div 
                        className="h-full bg-green-500"
                        style={{ width: `${Math.min(level.size / 10, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{level.size}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">NO Side Depth</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {simulationData.liquidityDepth.no.slice(0, 5).map((level: any, i: number) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm w-12">${level.price.toFixed(2)}</span>
                    <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden">
                      <div 
                        className="h-full bg-red-500"
                        style={{ width: `${Math.min(level.size / 10, 100)}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{level.size}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="prices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Projected Price Range</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between py-8">
                <div className="text-center">
                  <p className="text-3xl font-bold text-red-500">
                    ${simulationData.priceDiscovery.projectedRange[0].toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Low</p>
                </div>
                <div className="flex-1 px-8">
                  <div className="h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full relative">
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-primary rounded-full"
                      style={{ left: '50%' }}
                    />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-500">
                    ${simulationData.priceDiscovery.projectedRange[1].toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">High</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Platform Fee</p>
                  <p className="text-2xl font-bold">{simulationData.fees.platform}%</p>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Est. Daily Fees</p>
                  <p className="text-2xl font-bold">${simulationData.fees.estimatedDaily}</p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack} disabled={isSaving}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button variant="outline" onClick={runSimulation} disabled={isSaving || isSimulating}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Re-run
          </Button>
        </div>
        <Button onClick={handleSubmit} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              Continue to Deployment
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
