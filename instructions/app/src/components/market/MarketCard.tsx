import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Clock, BarChart3 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Market } from '@/types';

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const yesPrice = market.yes_price || 0.5;
  const noPrice = market.no_price || 0.5;
  const volume = market.total_volume;
  
  // Calculate probability change (mock)
  // const priceChange = Math.random() * 0.1 - 0.05;

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary/20">
      {/* Image */}
      {market.image_url && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={market.image_url}
            alt={market.question}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <Badge 
            className="absolute top-3 left-3"
            variant="secondary"
          >
            {market.category}
          </Badge>
        </div>
      )}
      
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold line-clamp-2 leading-tight">
          {market.question}
        </h3>
        {market.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {market.description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Price Display */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-green-500/10 p-3">
            <div className="flex items-center gap-1 text-xs text-green-600 mb-1">
              <TrendingUp className="h-3 w-3" />
              YES
            </div>
            <div className="text-xl font-bold text-green-600">
              ৳{yesPrice.toFixed(2)}
            </div>
            <div className="text-xs text-green-600/70">
              {(yesPrice * 100).toFixed(0)}% chance
            </div>
          </div>
          
          <div className="rounded-lg bg-red-500/10 p-3">
            <div className="flex items-center gap-1 text-xs text-red-600 mb-1">
              <TrendingDown className="h-3 w-3" />
              NO
            </div>
            <div className="text-xl font-bold text-red-600">
              ৳{noPrice.toFixed(2)}
            </div>
            <div className="text-xs text-red-600/70">
              {(noPrice * 100).toFixed(0)}% chance
            </div>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <BarChart3 className="h-4 w-4" />
            <span>Vol: ৳{volume.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Closes {formatDistanceToNow(new Date(market.trading_closes_at), { addSuffix: true })}</span>
          </div>
        </div>
        
        {/* CTA */}
        <Link to={`/markets/${market.id}`}>
          <Button className="w-full group/btn">
            Trade Now
            <TrendingUp className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
