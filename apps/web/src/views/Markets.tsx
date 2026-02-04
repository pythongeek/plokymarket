import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { MarketCard } from '@/components/market/MarketCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  SlidersHorizontal, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  X
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// import type { Market } from '@/types';

type SortOption = 'volume' | 'newest' | 'closing' | 'price';
type FilterStatus = 'all' | 'active' | 'closing' | 'resolved';

export function Markets() {
  const { markets, fetchMarkets } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('volume');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('active');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  // Get unique categories
  const categories = Array.from(new Set(markets.map(m => m.category)));

  // Filter and sort markets
  const filteredMarkets = markets.filter((market) => {
    // Search filter
    if (searchQuery && !market.question.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Category filter
    if (selectedCategory && market.category !== selectedCategory) {
      return false;
    }
    
    // Status filter
    if (filterStatus === 'active' && market.status !== 'active') {
      return false;
    }
    if (filterStatus === 'closing' && market.status !== 'active') {
      const closesAt = new Date(market.trading_closes_at);
      const now = new Date();
      const daysUntilClose = (closesAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      if (daysUntilClose > 7) return false;
    }
    if (filterStatus === 'resolved' && market.status !== 'resolved') {
      return false;
    }
    
    return true;
  });

  // Sort markets
  const sortedMarkets = [...filteredMarkets].sort((a, b) => {
    switch (sortBy) {
      case 'volume':
        return b.total_volume - a.total_volume;
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'closing':
        return new Date(a.trading_closes_at).getTime() - new Date(b.trading_closes_at).getTime();
      case 'price':
        return (b.yes_price || 0.5) - (a.yes_price || 0.5);
      default:
        return 0;
    }
  });

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory(null);
    setFilterStatus('active');
    setSortBy('volume');
  };

  const hasActiveFilters = searchQuery || selectedCategory || filterStatus !== 'active' || sortBy !== 'volume';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Markets</h1>
          <p className="text-muted-foreground">
            Trade on {markets.length}+ prediction markets
          </p>
        </div>
        
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search markets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-primary/10' : ''}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                Active
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 rounded-lg bg-muted space-y-4">
          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                    selectedCategory === null
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background hover:bg-background/80'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                      selectedCategory === cat
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-background/80'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <div className="flex flex-wrap gap-2">
                {(['all', 'active', 'closing', 'resolved'] as FilterStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1 ${
                      filterStatus === status
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-background hover:bg-background/80'
                    }`}
                  >
                    {status === 'active' && <TrendingUp className="h-3 w-3" />}
                    {status === 'closing' && <Clock className="h-3 w-3" />}
                    {status === 'resolved' && <CheckCircle2 className="h-3 w-3" />}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-background">
                    {sortBy === 'volume' && 'Volume'}
                    {sortBy === 'newest' && 'Newest'}
                    {sortBy === 'closing' && 'Closing Soon'}
                    {sortBy === 'price' && 'Price'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortBy('volume')}>
                    Volume
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('newest')}>
                    Newest
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('closing')}>
                    Closing Soon
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('price')}>
                    Price
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              Clear all filters
            </Button>
          )}
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && !showFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedCategory && (
            <Badge variant="secondary" className="gap-1">
              {selectedCategory}
              <button onClick={() => setSelectedCategory(null)}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filterStatus !== 'active' && (
            <Badge variant="secondary" className="gap-1">
              {filterStatus}
              <button onClick={() => setFilterStatus('active')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {sortBy !== 'volume' && (
            <Badge variant="secondary" className="gap-1">
              Sort: {sortBy}
              <button onClick={() => setSortBy('volume')}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {sortedMarkets.length} of {markets.length} markets
      </div>

      {/* Markets Grid */}
      {sortedMarkets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedMarkets.map((market) => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No markets found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or search query
          </p>
          {hasActiveFilters && (
            <Button onClick={clearFilters}>Clear Filters</Button>
          )}
        </div>
      )}
    </div>
  );
}