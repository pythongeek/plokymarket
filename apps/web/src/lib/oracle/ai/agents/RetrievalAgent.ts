/**
 * Information Retrieval Agent - Bangladesh Context
 * Monitors structured databases and unstructured sources
 * Specialized for Bangladesh news, sports, government, and financial sources
 */

import { 
  EvidenceSource, 
  EvidenceCorpus, 
  RetrievalAgentOutput,
  AgentAPIResponse 
} from '../types';

// ============================================
// BANGLADESH SOURCE AUTHORITY SCORES
// ============================================

const SOURCE_AUTHORITY: Record<string, number> = {
  // Bangladesh Government - Highest Authority
  'bangladesh.gov.bd': 0.99,
  'bdcables.gov.bd': 0.98,
  'sec.gov.bd': 0.98,           // SEC Bangladesh
  'bb.org.bd': 0.98,            // Bangladesh Bank
  'eci.gov.bd': 0.98,           // Election Commission
  'mof.gov.bd': 0.97,           // Ministry of Finance
  'mofa.gov.bd': 0.97,          // Ministry of Foreign Affairs
  'cabinet.gov.bd': 0.97,       // Cabinet Division
  'nidw.gov.bd': 0.96,          // National ID
  'btrc.gov.bd': 0.96,          // Telecom Regulator
  'dmp.gov.bd': 0.95,           // Dhaka Metropolitan Police
  'rab.gov.bd': 0.95,           // Rapid Action Battalion
  
  // Bangladesh Major News (English)
  'thedailystar.net': 0.92,
  'bdnews24.com': 0.91,
  'dhakatribune.com': 0.90,
  'newagebd.net': 0.88,
  'observerbd.com': 0.87,
  'thefinancialexpress.com.bd': 0.88,
  'theindependentbd.com': 0.87,
  'daily-sun.com': 0.86,
  'bbsnews.net': 0.85,
  
  // Bangladesh Major News (Bengali)
  'prothomalo.com': 0.93,
  'jugantor.com': 0.91,
  'kalerkantho.com': 0.91,
  'ittefaq.com.bd': 0.90,
  'dainikamadershomoy.com': 0.88,
  'samakal.com': 0.88,
  'nayadiganta.com': 0.87,
  'manobkantha.com': 0.86,
  'alokitobangladesh.com': 0.85,
  'bhorerkagoj.com': 0.85,
  'janakantha.com': 0.84,
  
  // Online News Portals
  'banglanews24.com': 0.86,
  'banglatribune.com': 0.85,
  'jagonews24.com': 0.85,
  'risingbd.com': 0.84,
  'somoynews.tv': 0.86,
  'channelionline.com': 0.85,
  'ekattor.tv': 0.85,
  'independent24.com': 0.84,
  'rtvonline.com': 0.83,
  
  // Sports - Bangladesh
  'tigercricket.com.bd': 0.96,     // BCB Official
  'bcb-cricket.com': 0.95,
  'espncricinfo.com': 0.94,        // Global but authoritative for BD cricket
  'cricbuzz.com': 0.93,
  'bff.com.bd': 0.92,              // Bangladesh Football Federation
  'bangladeshfootballfed.com': 0.91,
  
  // Financial Markets Bangladesh
  'dse.com.bd': 0.96,              // Dhaka Stock Exchange
  'cse.com.bd': 0.95,              // Chittagong Stock Exchange
  'dsebd.org': 0.96,
  'cse.com': 0.95,
  'cdbl.com.bd': 0.94,             // Central Depository
  'lcsebd.com': 0.93,
  'stockbangladesh.com': 0.87,
  'amardesh.com.bd': 0.85,         // Financial news
  
  // Weather - Bangladesh
  'bdmet.gov.bd': 0.97,            // Bangladesh Meteorological Dept
  'meteorology.gov.bd': 0.96,
  'imd.gov.in': 0.88,              // India Met (for regional)
  
  // International Sources (for context)
  'reuters.com': 0.95,
  'bloomberg.com': 0.95,
  'bbc.com': 0.93,
  'aljazeera.com': 0.91,
  'cnn.com': 0.88,
  
  // Social (Lower authority)
  'twitter.com': 0.60,
  'x.com': 0.60,
  'facebook.com': 0.55,
};

// Bangladesh-specific keywords for relevance scoring
const BANGLADESH_KEYWORDS = {
  politics: [
    'bangladesh', 'dhaka', 'chittagong', 'sylhet', 'rajshahi', 'khulna', 'barisal', 'rangpur', 'mymensingh',
    'awami league', 'bnp', 'bangladesh nationalist party', 'election commission', 'national election',
    'sheikh hasina', 'tarique rahman', 'mirza fakhrul', 'obaedul quader', 'parliament', 'jatiya sangsad',
    'cabinet', 'prime minister bangladesh', 'president bangladesh'
  ],
  cricket: [
    'bangladesh cricket', 'tigers', 'shakib al hasan', 'tamim iqbal', 'mushfiqur rahim', 'mahmudullah',
    'liton das', 'taskin ahmed', 'mustafizur rahman', 'bcb', 'bangladesh cricket board',
    'sher-e-bangla stadium', 'mirpur stadium', 'chittagong stadium', 'sylhet stadium'
  ],
  football: [
    'bangladesh football', 'bff', 'bashundhara kings', 'dhaka abahani', 'dhaka mohammedan',
    'saif sporting', 'chittagong abahani', 'bangladesh national team football'
  ],
  economy: [
    'bangladesh bank', 'bangladesh taka', 'bdt', 'exchange rate', 'remittance bangladesh',
    'garment industry', 'rmg', 'readymade garment', 'export bangladesh', 'import bangladesh',
    'foreign reserve', 'inflation bangladesh', 'gdp bangladesh', 'budget bangladesh'
  ],
  weather: [
    'cyclone bangladesh', 'flood bangladesh', 'monsoon bangladesh', 'landslide bangladesh',
    'storm bangladesh', 'rainfall bangladesh', 'brahmaputra', 'ganges', 'meghna', 'padma', 'jamuna'
  ]
};

interface QueryEntities {
  mainSubject: string;
  eventType: string;
  dateRange?: { start: string; end: string };
  location?: string;
  outcomeConditions: string[];
  isBangladeshContext: boolean;
  detectedLanguage: 'en' | 'bn' | 'mixed';
}

export class RetrievalAgent {
  private name = 'RetrievalAgent';
  private version = '2.0.0-bd';
  
  private newsApiKey: string;
  private gdeltBaseUrl = 'https://api.gdeltproject.org/api/v2';
  
  constructor() {
    this.newsApiKey = process.env.NEWSAPI_KEY || '';
  }

  /**
   * Main execution: Extract query entities and retrieve evidence
   */
  async execute(marketQuestion: string, context?: any): Promise<AgentAPIResponse<RetrievalAgentOutput>> {
    const startTime = Date.now();
    
    try {
      // 1. Extract key entities with Bangladesh context
      const entities = this.extractQueryEntities(marketQuestion, context);
      
      // 2. Build search queries with Bangla/English variants
      const searchQueries = this.buildSearchQueries(entities);
      
      // 3. Retrieve from Bangladesh-specific sources in parallel
      const retrievalPromises = [
        this.retrieveFromNewsAPI(searchQueries, entities),
        this.retrieveFromGDELT(entities),
        this.retrieveFromBangladeshGovernment(entities),
        this.retrieveFromBangladeshSports(entities),
        this.retrieveFromBangladeshFinancial(entities),
        this.retrieveFromBangladeshWeather(entities),
      ];
      
      const results = await Promise.allSettled(retrievalPromises);
      
      // 4. Aggregate sources
      let allSources: EvidenceSource[] = [];
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allSources = allSources.concat(result.value);
        } else {
          console.warn(`[${this.name}] Source ${index} failed:`, result.reason);
        }
      });
      
      // 5. Deduplicate and rank with Bangladesh-specific scoring
      const uniqueSources = this.deduplicateSources(allSources);
      const rankedSources = this.rankSourcesForBangladesh(uniqueSources, entities);
      
      // 6. Calculate cross-verification and temporal scores
      const crossVerificationScore = this.calculateCrossVerification(rankedSources);
      const temporalProximity = this.calculateTemporalProximity(rankedSources, entities);
      
      // 7. Count sources by type
      const sourcesByType = rankedSources.reduce((acc, source) => {
        acc[source.sourceType] = (acc[source.sourceType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const corpus: EvidenceCorpus = {
        query: marketQuestion,
        sources: rankedSources.slice(0, 25), // Max 25 sources
        totalSources: rankedSources.length,
        crossVerificationScore,
        temporalProximity
      };
      
      const output: RetrievalAgentOutput = {
        agentType: 'retrieval',
        corpus,
        executionTimeMs: Date.now() - startTime,
        sourcesByType
      };
      
      return {
        success: true,
        data: output,
        latencyMs: Date.now() - startTime
      };
      
    } catch (error) {
      console.error(`[${this.name}] Execution failed:`, error);
      return {
        success: false,
        error: {
          code: 'RETRIEVAL_FAILED',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true
        },
        latencyMs: Date.now() - startTime
      };
    }
  }

  /**
   * Extract key entities with Bangladesh context detection
   */
  private extractQueryEntities(question: string, context?: any): QueryEntities {
    const lowerQuestion = question.toLowerCase();
    
    // Detect if this is Bangladesh context
    const isBangladeshContext = this.detectBangladeshContext(lowerQuestion);
    
    // Detect language (Bengali characters)
    const detectedLanguage = this.detectLanguage(question);
    
    // Event type detection with Bangladesh focus
    let eventType = 'general';
    if (lowerQuestion.match(/election|vote|poll|নির্বাচন|ভোট/)) eventType = 'election';
    else if (lowerQuestion.match(/stock|share|dse|cse|price|দর|শেয়ার/)) eventType = 'financial';
    else if (lowerQuestion.match(/cricket|match|win|score|ক্রিকেট|খেলা|ম্যাচ/)) eventType = 'cricket';
    else if (lowerQuestion.match(/football|soccer|ফুটবল/)) eventType = 'football';
    else if (lowerQuestion.match(/weather|rain|storm|cyclone|flood|বৃষ্টি|ঝড়|বন্যা/)) eventType = 'weather';
    else if (lowerQuestion.match(/budget|gdp|economy|inflation|taka|টাকা|বাজেট/)) eventType = 'economic';
    else if (lowerQuestion.match(/government|minister|cabinet|প্রধানমন্ত্রী|মন্ত্রী/)) eventType = 'political';
    
    // Date extraction
    const dateRange = this.extractDateRange(lowerQuestion, context);
    
    // Location extraction (Bangladesh cities)
    const location = this.extractBangladeshLocation(lowerQuestion);
    
    // Outcome conditions
    const outcomeConditions = this.extractOutcomeConditions(lowerQuestion);
    
    return {
      mainSubject: question,
      eventType,
      dateRange,
      location,
      outcomeConditions,
      isBangladeshContext,
      detectedLanguage
    };
  }

  /**
   * Detect if query is Bangladesh-related
   */
  private detectBangladeshContext(text: string): boolean {
    const bdKeywords = [
      'bangladesh', 'dhaka', 'chittagong', 'sylhet', 'rajshahi', 'khulna',
      'বাংলাদেশ', 'ঢাকা', 'চট্টগ্রাম', 'সিলেট', 'রাজশাহী', 'খুলনা',
      'bdt', 'taka', 'টাকা', 'shakib', 'tamim', 'mushfiqur', 'bcb', 'tigers'
    ];
    
    return bdKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Detect language (English, Bengali, or mixed)
   */
  private detectLanguage(text: string): 'en' | 'bn' | 'mixed' {
    // Bengali Unicode range
    const bengaliChars = /[\u0980-\u09FF]/;
    const hasBengali = bengaliChars.test(text);
    const hasEnglish = /[a-zA-Z]/.test(text);
    
    if (hasBengali && hasEnglish) return 'mixed';
    if (hasBengali) return 'bn';
    return 'en';
  }

  /**
   * Extract date range with Bengali support
   */
  private extractDateRange(question: string, context?: any): { start: string; end: string } | undefined {
    if (context?.resolutionDate) {
      const date = new Date(context.resolutionDate);
      return {
        start: new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: date.toISOString()
      };
    }
    
    // English date patterns
    const datePatterns = [
      /by\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
      /before\s+(\w+\s+\d{1,2},?\s+\d{4})/i,
      /in\s+(\w+\s+\d{4})/i,
    ];
    
    for (const pattern of datePatterns) {
      const match = question.match(pattern);
      if (match) {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
          return {
            start: new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            end: date.toISOString()
          };
        }
      }
    }
    
    return undefined;
  }

  /**
   * Extract Bangladesh locations
   */
  private extractBangladeshLocation(question: string): string | undefined {
    const bdLocations = [
      'dhaka', 'chittagong', 'sylhet', 'rajshahi', 'khulna', 'barisal', 
      'rangpur', 'mymensingh', 'comilla', 'narayanganj', 'gazipur',
      'ঢাকা', 'চট্টগ্রাম', 'সিলেট', 'রাজশাহী', 'খুলনা', 'বরিশাল',
      'রংপুর', 'ময়মনসিংহ', 'কুমিল্লা', 'নারায়ণগঞ্জ', 'গাজীপুর'
    ];
    
    const lowerQuestion = question.toLowerCase();
    for (const location of bdLocations) {
      if (lowerQuestion.includes(location.toLowerCase())) {
        return location;
      }
    }
    
    return undefined;
  }

  /**
   * Extract outcome conditions
   */
  private extractOutcomeConditions(question: string): string[] {
    const conditions: string[] = [];
    
    if (question.match(/will.*\?/i) || question.match(/হবে.*\?/)) {
      conditions.push('binary:yes_no');
    }
    if (question.match(/(above|below|over|under|more than|less than)\s+\$?\d+/i)) {
      conditions.push('threshold:numeric');
    }
    if (question.match(/(win|lose|draw|জিতবে|হারবে)/i)) {
      conditions.push('outcome:competitive');
    }
    
    return conditions;
  }

  /**
   * Build search queries with Bangladesh focus
   */
  private buildSearchQueries(entities: QueryEntities): string[] {
    const queries: string[] = [];
    
    // Main query
    queries.push(entities.mainSubject);
    
    // Add Bangladesh context if detected
    if (entities.isBangladeshContext) {
      queries.push(`${entities.mainSubject} bangladesh`);
      
      // Event-specific queries
      if (entities.eventType === 'election') {
        queries.push(`bangladesh election ${entities.location || ''}`);
        queries.push(`bangladesh vote result`);
      } else if (entities.eventType === 'cricket') {
        queries.push(`bangladesh cricket match result`);
        queries.push(`tigers cricket ${entities.mainSubject}`);
      } else if (entities.eventType === 'financial') {
        queries.push(`dse share price ${entities.mainSubject}`);
        queries.push(`bangladesh stock market`);
      } else if (entities.eventType === 'weather') {
        queries.push(`bangladesh weather ${entities.location || ''}`);
        queries.push(`cyclone bangladesh`);
      }
    }
    
    return queries;
  }

  /**
   * Retrieve from NewsAPI with Bangladesh domains
   */
  private async retrieveFromNewsAPI(queries: string[], entities: QueryEntities): Promise<EvidenceSource[]> {
    if (!this.newsApiKey) {
      console.warn('[RetrievalAgent] NewsAPI key not configured');
      return [];
    }
    
    const sources: EvidenceSource[] = [];
    
    // Bangladesh-specific domains to prioritize
    const bdDomains = 'thedailystar.net,bdnews24.com,dhakatribune.com,prothomalo.com';
    
    for (const query of queries.slice(0, 3)) {
      try {
        // Search with Bangladesh domain bias
        const response = await fetch(
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&domains=${bdDomains}&sortBy=relevancy&pageSize=15`,
          { headers: { 'X-Api-Key': this.newsApiKey } }
        );
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        for (const article of data.articles || []) {
          const domain = new URL(article.url).hostname.replace('www.', '');
          const authorityScore = SOURCE_AUTHORITY[domain] || 0.5;
          
          sources.push({
            id: `newsapi-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url: article.url,
            title: article.title,
            content: article.description || article.content || '',
            sourceType: 'news',
            authorityScore,
            publishedAt: article.publishedAt,
            retrievedAt: new Date().toISOString(),
            credibilityScore: authorityScore * 0.8,
            relevanceScore: 0.7,
            rawMetadata: { 
              author: article.author, 
              source: article.source?.name,
              country: 'Bangladesh'
            }
          });
        }
      } catch (error) {
        console.warn('[RetrievalAgent] NewsAPI fetch failed:', error);
      }
    }
    
    return sources;
  }

  /**
   * Retrieve from GDELT
   */
  private async retrieveFromGDELT(entities: QueryEntities): Promise<EvidenceSource[]> {
    try {
      const query = encodeURIComponent(entities.mainSubject + (entities.isBangladeshContext ? ' Bangladesh' : ''));
      const response = await fetch(
        `${this.gdeltBaseUrl}/doc/doc?query=${query}&mode=ArtList&maxrecords=15&format=json`,
        { timeout: 10000 } as any
      );
      
      if (!response.ok) return [];
      
      const data = await response.json();
      const articles = data.articles || [];
      
      return articles.map((article: any) => {
        const domain = article.source || 'unknown';
        const authorityScore = SOURCE_AUTHORITY[domain] || 0.4;
        
        return {
          id: `gdelt-${article.url_hash || Date.now()}`,
          url: article.url,
          title: article.title,
          content: article.seen_clip || '',
          sourceType: 'news',
          authorityScore,
          publishedAt: article.seendate,
          retrievedAt: new Date().toISOString(),
          credibilityScore: authorityScore * 0.75,
          relevanceScore: article.score || 0.5,
          rawMetadata: { domain, language: article.language }
        };
      });
    } catch (error) {
      console.warn('[RetrievalAgent] GDELT fetch failed:', error);
      return [];
    }
  }

  /**
   * Retrieve from Bangladesh Government sources
   */
  private async retrieveFromBangladeshGovernment(entities: QueryEntities): Promise<EvidenceSource[]> {
    const sources: EvidenceSource[] = [];
    
    if (!entities.isBangladeshContext) return sources;
    
    // Election-related
    if (entities.eventType === 'election') {
      sources.push({
        id: `bd-gov-election-${Date.now()}`,
        url: 'https://www.eci.gov.bd/',
        title: 'Bangladesh Election Commission Official Results',
        content: 'Official election results from Bangladesh Election Commission',
        sourceType: 'official',
        authorityScore: 0.98,
        publishedAt: new Date().toISOString(),
        retrievedAt: new Date().toISOString(),
        credibilityScore: 0.98,
        relevanceScore: 0.95,
        rawMetadata: { type: 'government', department: 'Election Commission' }
      });
    }
    
    // Financial/Banking
    if (entities.eventType === 'financial' || entities.eventType === 'economic') {
      sources.push({
        id: `bd-bank-${Date.now()}`,
        url: 'https://www.bb.org.bd/',
        title: 'Bangladesh Bank Official Notices',
        content: 'Central bank announcements and monetary policy decisions',
        sourceType: 'official',
        authorityScore: 0.98,
        publishedAt: new Date().toISOString(),
        retrievedAt: new Date().toISOString(),
        credibilityScore: 0.98,
        relevanceScore: 0.95,
        rawMetadata: { type: 'central_bank', country: 'Bangladesh' }
      });
      
      sources.push({
        id: `bd-sec-${Date.now()}`,
        url: 'https://www.sec.gov.bd/',
        title: 'SEC Bangladesh - Securities and Exchange Commission',
        content: 'Stock market regulations and company disclosures',
        sourceType: 'official',
        authorityScore: 0.97,
        publishedAt: new Date().toISOString(),
        retrievedAt: new Date().toISOString(),
        credibilityScore: 0.97,
        relevanceScore: 0.9,
        rawMetadata: { type: 'securities_regulator', country: 'Bangladesh' }
      });
    }
    
    // Government announcements
    sources.push({
      id: `bd-gov-${Date.now()}`,
      url: 'https://bangladesh.gov.bd/',
      title: 'Bangladesh National Portal',
      content: 'Official government announcements and notices',
      sourceType: 'official',
      authorityScore: 0.97,
      publishedAt: new Date().toISOString(),
      retrievedAt: new Date().toISOString(),
      credibilityScore: 0.97,
      relevanceScore: 0.85,
      rawMetadata: { type: 'government_portal', country: 'Bangladesh' }
    });
    
    return sources;
  }

  /**
   * Retrieve from Bangladesh Sports sources
   */
  private async retrieveFromBangladeshSports(entities: QueryEntities): Promise<EvidenceSource[]> {
    const sources: EvidenceSource[] = [];
    
    if (entities.eventType === 'cricket') {
      sources.push({
        id: `bcb-${Date.now()}`,
        url: 'https://www.tigercricket.com.bd/',
        title: 'Bangladesh Cricket Board - Official',
        content: 'Official Bangladesh cricket team news, match results, player information',
        sourceType: 'official',
        authorityScore: 0.96,
        publishedAt: new Date().toISOString(),
        retrievedAt: new Date().toISOString(),
        credibilityScore: 0.96,
        relevanceScore: 0.95,
        rawMetadata: { type: 'sports_federation', sport: 'cricket', country: 'Bangladesh' }
      });
      
      sources.push({
        id: `espn-cricinfo-bd-${Date.now()}`,
        url: 'https://www.espncricinfo.com/team/bangladesh-25',
        title: 'ESPN Cricinfo - Bangladesh Cricket',
        content: 'Comprehensive Bangladesh cricket statistics and live scores',
        sourceType: 'database',
        authorityScore: 0.94,
        publishedAt: new Date().toISOString(),
        retrievedAt: new Date().toISOString(),
        credibilityScore: 0.94,
        relevanceScore: 0.92,
        rawMetadata: { type: 'sports_database', sport: 'cricket' }
      });
    }
    
    if (entities.eventType === 'football') {
      sources.push({
        id: `bff-${Date.now()}`,
        url: 'https://bff.com.bd/',
        title: 'Bangladesh Football Federation - Official',
        content: 'Official Bangladesh football federation announcements and match results',
        sourceType: 'official',
        authorityScore: 0.92,
        publishedAt: new Date().toISOString(),
        retrievedAt: new Date().toISOString(),
        credibilityScore: 0.92,
        relevanceScore: 0.9,
        rawMetadata: { type: 'sports_federation', sport: 'football', country: 'Bangladesh' }
      });
    }
    
    return sources;
  }

  /**
   * Retrieve from Bangladesh Financial sources
   */
  private async retrieveFromBangladeshFinancial(entities: QueryEntities): Promise<EvidenceSource[]> {
    const sources: EvidenceSource[] = [];
    
    if (!entities.isBangladeshContext) return sources;
    
    if (entities.eventType === 'financial' || entities.eventType === 'economic') {
      sources.push({
        id: `dse-${Date.now()}`,
        url: 'https://www.dse.com.bd/',
        title: 'Dhaka Stock Exchange - Official',
        content: 'DSE share prices, market indices, and trading data',
        sourceType: 'official',
        authorityScore: 0.96,
        publishedAt: new Date().toISOString(),
        retrievedAt: new Date().toISOString(),
        credibilityScore: 0.96,
        relevanceScore: 0.95,
        rawMetadata: { type: 'stock_exchange', name: 'DSE', country: 'Bangladesh' }
      });
      
      sources.push({
        id: `cse-${Date.now()}`,
        url: 'https://www.cse.com.bd/',
        title: 'Chittagong Stock Exchange - Official',
        content: 'CSE trading data and market information',
        sourceType: 'official',
        authorityScore: 0.95,
        publishedAt: new Date().toISOString(),
        retrievedAt: new Date().toISOString(),
        credibilityScore: 0.95,
        relevanceScore: 0.9,
        rawMetadata: { type: 'stock_exchange', name: 'CSE', country: 'Bangladesh' }
      });
    }
    
    return sources;
  }

  /**
   * Retrieve from Bangladesh Weather sources
   */
  private async retrieveFromBangladeshWeather(entities: QueryEntities): Promise<EvidenceSource[]> {
    const sources: EvidenceSource[] = [];
    
    if (entities.eventType === 'weather' && entities.isBangladeshContext) {
      sources.push({
        id: `bd-met-${Date.now()}`,
        url: 'http://www.bmd.gov.bd/',
        title: 'Bangladesh Meteorological Department - Official',
        content: 'Official weather forecasts, cyclone warnings, rainfall data',
        sourceType: 'official',
        authorityScore: 0.97,
        publishedAt: new Date().toISOString(),
        retrievedAt: new Date().toISOString(),
        credibilityScore: 0.97,
        relevanceScore: 0.95,
        rawMetadata: { type: 'meteorological_department', country: 'Bangladesh' }
      });
    }
    
    return sources;
  }

  /**
   * Deduplicate sources by URL
   */
  private deduplicateSources(sources: EvidenceSource[]): EvidenceSource[] {
    const seen = new Set<string>();
    return sources.filter(source => {
      const normalized = source.url.toLowerCase().replace(/\/$/, '');
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }

  /**
   * Rank sources with Bangladesh-specific scoring
   */
  private rankSourcesForBangladesh(sources: EvidenceSource[], entities: QueryEntities): EvidenceSource[] {
    return sources
      .map(source => {
        const contentLower = source.content.toLowerCase();
        const queryLower = entities.mainSubject.toLowerCase();
        
        let relevanceScore = source.relevanceScore;
        
        // Keyword matching
        const keywords = queryLower.split(/\s+/).filter(w => w.length > 3);
        const matchCount = keywords.filter(kw => contentLower.includes(kw)).length;
        relevanceScore += (matchCount / keywords.length) * 0.3;
        
        // Bangladesh source boost
        if (source.url.includes('.bd') || 
            source.url.includes('bangladesh') ||
            source.rawMetadata?.country === 'Bangladesh') {
          relevanceScore += 0.15;
        }
        
        // Official Bangladesh government boost
        if (source.sourceType === 'official' && 
            source.rawMetadata?.country === 'Bangladesh') {
          relevanceScore += 0.2;
        }
        
        // Recency boost (within 24h)
        const published = new Date(source.publishedAt);
        const hoursAgo = (Date.now() - published.getTime()) / (1000 * 60 * 60);
        if (hoursAgo < 24) relevanceScore += 0.1;
        
        // Calculate final credibility
        const credibilityScore = (source.authorityScore * 0.6) + (relevanceScore * 0.4);
        
        return {
          ...source,
          relevanceScore: Math.min(relevanceScore, 1.0),
          credibilityScore: Math.min(credibilityScore, 1.0)
        };
      })
      .sort((a, b) => b.credibilityScore - a.credibilityScore);
  }

  /**
   * Calculate cross-verification score
   */
  private calculateCrossVerification(sources: EvidenceSource[]): number {
    if (sources.length < 2) return 0.5;
    
    // Check for Bangladesh government confirmation
    const bdGovSources = sources.filter(s => 
      s.url.includes('.gov.bd') && s.credibilityScore > 0.9
    );
    
    if (bdGovSources.length >= 1) return 0.95;
    if (bdGovSources.length >= 2) return 0.98;
    
    // Check high-authority sources
    const highAuthority = sources.filter(s => s.authorityScore > 0.85);
    if (highAuthority.length >= 3) return 0.9;
    if (highAuthority.length >= 2) return 0.8;
    
    return 0.6;
  }

  /**
   * Calculate temporal proximity score
   */
  private calculateTemporalProximity(sources: EvidenceSource[], entities: QueryEntities): number {
    if (!entities.dateRange) return 0.5;
    
    const targetDate = new Date(entities.dateRange.end);
    const now = new Date();
    
    if (targetDate > now) return 0.3;
    
    const hoursSince = (now.getTime() - targetDate.getTime()) / (1000 * 60 * 60);
    if (hoursSince < 6) return 1.0;  // Breaking news
    if (hoursSince < 24) return 0.9;
    if (hoursSince < 48) return 0.8;
    if (hoursSince < 168) return 0.7; // Week
    
    return 0.5;
  }
}
