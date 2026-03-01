/**
 * ============================================================
 * MARKET DETAIL PAGE PATCH — app/(dashboard)/markets/[id]/page.tsx
 * ============================================================
 * Add these imports at the top of the file (after existing imports):
 */

// ─── NEW IMPORTS ───
import { MarketStatsBanner } from '@/components/market/MarketStatsBanner';
import { MarketActions } from '@/components/market/MarketActions';
import { RelatedMarkets } from '@/components/market/RelatedMarkets';
import { ActivityFeed } from '@/components/social/ActivityFeed';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
// ──────────────────


// ─── PATCH 1: Market Header — add thumbnail + MarketStatsBanner + MarketActions ───
// Replace the existing "Market Header" block (around line 80–110) with this:

{/* Market Header */}
<div className="space-y-3">
  {/* Breadcrumb badges row */}
  <div className="flex flex-wrap items-center gap-3">
    <Badge variant="secondary">{market.category}</Badge>
    {isResolved ? (
      <Badge className="bg-purple-500">
        <CheckCircle2 className="h-3 w-3 mr-1" />
        {t('market_detail.resolved')}
      </Badge>
    ) : isClosingSoon ? (
      <Badge variant="destructive">
        <Clock className="h-3 w-3 mr-1" />
        {t('market_detail.closing_soon')}
      </Badge>
    ) : (
      <Badge variant="default" className="bg-green-500">
        <TrendingUp className="h-3 w-3 mr-1" />
        {t('market_detail.active')}
      </Badge>
    )}
  </div>

  {/* ── Gap 7: Thumbnail + title ── */}
  <div className="flex items-start gap-4">
    {/* Round thumbnail — shows image_url if set, otherwise category emoji */}
    <div className="flex-shrink-0 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border border-primary/20 shadow-sm">
      {market.image_url ? (
        <img
          src={market.image_url}
          alt={market.question}
          className="h-full w-full object-cover rounded-full"
        />
      ) : (
        <span className="text-2xl">
          {({
            sports: '🏏', politics: '🏛️', economy: '💰',
            entertainment: '🎬', technology: '💻', international: '🌍',
            social: '👥', weather: '🌦️', crypto: '₿',
          } as Record<string, string>)[market.category] ?? '📊'}
        </span>
      )}
    </div>

    <div className="flex-1 min-w-0">
      <h1 className="text-2xl md:text-3xl font-bold leading-tight">{market.question}</h1>

      {/* ── Gap 4: Volume / Liquidity Banner ── */}
      <MarketStatsBanner market={market} />
    </div>
  </div>

  {market.description && (
    <p className="text-muted-foreground max-w-3xl text-sm leading-relaxed">{market.description}</p>
  )}

  {/* ── Gap 2: Share / Bookmark / Follow actions ── */}
  <MarketActions market={market} />
</div>


// ─── PATCH 2: Replace the bottom "Comments Section" block ───
// Find this in the left column:
//   {/* Comments Section - Enhanced with Threading & Social Features */}
//   <div className="mt-10 pt-10 border-t border-primary/10">
//     <CommentSection eventId={market.event_id || market.id} />
//   </div>
//
// Replace it with the tabbed Activity + Comments block:

{/* ── Gap 3: Activity + Comments Tabs ── */}
<div className="mt-10 pt-8 border-t border-primary/10">
  <Tabs defaultValue="activity">
    <TabsList className="mb-4">
      <TabsTrigger value="activity" className="gap-1.5">
        <span className="text-base">⚡</span> ট্রেড অ্যাক্টিভিটি
      </TabsTrigger>
      <TabsTrigger value="comments" className="gap-1.5">
        <span className="text-base">💬</span> মন্তব্য
      </TabsTrigger>
    </TabsList>

    <TabsContent value="activity" className="mt-0">
      {/* Wire existing ActivityFeed, filtered to this market's trades */}
      <ActivityFeed
        marketId={market.id}
        filterTypes={['trader_activity']}
        maxItems={30}
      />
    </TabsContent>

    <TabsContent value="comments" className="mt-0">
      <CommentSection eventId={market.event_id || market.id} />
    </TabsContent>
  </Tabs>
</div>

{/* ── Gap 5: Related Markets ── */}
<RelatedMarkets
  currentMarketId={market.id}
  category={market.category}
/>


// ─── PATCH 3: Dynamic Creator Badge (Gap 10) ───
// In the info card section where creator is shown, replace static text with:

{market.created_by && (
  <div className="flex justify-between items-center border-b border-primary/5 pb-2">
    <span className="text-muted-foreground font-medium">{t('market_detail.created_by')}:</span>
    <CreatorBadge userId={market.created_by} />
  </div>
)}

// Add this inline component near the top of the file (above the return):
function CreatorBadge({ userId }: { userId: string }) {
  const [creator, setCreator] = useState<{ username?: string; avatar_url?: string } | null>(null);

  useEffect(() => {
    supabase
      .from('user_profiles')
      .select('username, avatar_url')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => setCreator(data));
  }, [userId]);

  if (!creator) return <span className="text-xs text-muted-foreground">—</span>;

  return (
    <Link href={`/profile/${userId}`} className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
      {creator.avatar_url ? (
        <img src={creator.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
      ) : (
        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">
          {creator.username?.[0]?.toUpperCase() ?? '?'}
        </div>
      )}
      <span className="text-xs font-medium text-primary">
        {creator.username ?? 'অ্যাডমিন'}
      </span>
    </Link>
  );
}

// ─── PATCH 4: generateMetadata for SEO (Gap 13) ───
// Add ABOVE the default export client component, at the top level of the file.
// (This requires splitting into a server + client component or using metadata API)
// Add this as a server-side export in a parent layout or use Next.js 13+ generateMetadata:

export async function generateMetadata({ params }: { params: { id: string } }) {
  // You can fetch market data here server-side
  return {
    title: `Plokymarket — Market`,
    description: 'Prediction market on Plokymarket',
    openGraph: {
      type: 'website',
      siteName: 'Plokymarket',
    },
    twitter: { card: 'summary_large_image' },
  };
}
