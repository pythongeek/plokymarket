/**
 * Template Auto-Generation Engine
 * Defines built-in market templates that auto-generate questions, outcomes,
 * oracle config, and resolution sources from admin-provided parameters.
 */

export interface TemplateParameter {
    key: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select' | 'multi-text';
    required: boolean;
    placeholder?: string;
    options?: string[]; // For 'select' type
    helperText?: string;
}

export interface GeneratedMarketData {
    question: string;
    description: string;
    outcomes: { id: string; label: string }[];
    tags: string[];
    category: string;
    oracleConfig: {
        type: string;
        resolutionSource: string;
        resolutionSourceUrl?: string;
        resolutionCriteria: string;
        confidenceThreshold: number;
    };
    marketType: 'binary' | 'categorical' | 'scalar';
}

export interface MarketTemplate {
    id: string;
    name: string;
    nameBn: string;
    description: string;
    icon: string; // emoji
    type: 'binary' | 'categorical' | 'scalar';
    category: string;
    parameters: TemplateParameter[];
    generate: (params: Record<string, any>) => GeneratedMarketData;
}

// ============================================
// BUILT-IN TEMPLATES
// ============================================

const ELECTION_WINNER: MarketTemplate = {
    id: 'ELECTION_WINNER',
    name: 'Election Winner',
    nameBn: 'নির্বাচনের বিজয়ী',
    description: 'Predict the winner of an election. Requires official certification for resolution.',
    icon: '🗳️',
    type: 'categorical',
    category: 'Politics',
    parameters: [
        { key: 'electionName', label: 'Election Name', type: 'text', required: true, placeholder: 'e.g. US Presidential Election 2024' },
        { key: 'candidates', label: 'Candidates (one per line)', type: 'multi-text', required: true, placeholder: 'Joe Biden\nDonald Trump' },
        { key: 'electionDate', label: 'Election Date', type: 'date', required: true },
        { key: 'resolutionSource', label: 'Resolution Source', type: 'select', required: true, options: ['AP Call', 'Official Election Commission', 'FEC Certification', 'Government Gazette'] },
    ],
    generate: (params) => {
        const candidates = (params.candidates as string).split('\n').map(c => c.trim()).filter(Boolean);
        const outcomes = candidates.map((c, i) => ({ id: `candidate-${i}`, label: c }));

        return {
            question: `Who will win the ${params.electionName}?`,
            description: `Predict the winner of ${params.electionName} scheduled for ${params.electionDate}. Resolution is based on ${params.resolutionSource}.`,
            outcomes,
            tags: ['Politics', 'Election', ...candidates],
            category: 'Politics',
            marketType: 'categorical',
            oracleConfig: {
                type: 'AI',
                resolutionSource: params.resolutionSource,
                resolutionCriteria: `Market resolves to the candidate officially declared winner by ${params.resolutionSource}. If the election is cancelled, the market is voided.`,
                confidenceThreshold: 95,
            },
        };
    },
};

const SPORTS_MATCH: MarketTemplate = {
    id: 'SPORTS_MATCH',
    name: 'Sports Match',
    nameBn: 'খেলার ম্যাচ',
    description: 'Predict the outcome of a sports match (Home/Away/Draw).',
    icon: '⚽',
    type: 'categorical',
    category: 'Sports',
    parameters: [
        { key: 'sport', label: 'Sport', type: 'select', required: true, options: ['Cricket', 'Football', 'Tennis', 'Basketball', 'Other'] },
        { key: 'teamA', label: 'Team/Player A (Home)', type: 'text', required: true, placeholder: 'e.g. Bangladesh' },
        { key: 'teamB', label: 'Team/Player B (Away)', type: 'text', required: true, placeholder: 'e.g. India' },
        { key: 'matchDate', label: 'Match Date', type: 'date', required: true },
        { key: 'includeDrawOption', label: 'Include Draw?', type: 'select', required: true, options: ['Yes', 'No'] },
        { key: 'league', label: 'League / Tournament', type: 'text', required: false, placeholder: 'e.g. ICC World Cup' },
    ],
    generate: (params) => {
        const outcomes = [
            { id: 'team-a', label: params.teamA },
            { id: 'team-b', label: params.teamB },
        ];
        if (params.includeDrawOption === 'Yes') {
            outcomes.push({ id: 'draw', label: 'Draw' });
        }

        const leagueTag = params.league ? [params.league] : [];

        return {
            question: `Who will win ${params.teamA} vs ${params.teamB}?`,
            description: `${params.sport} match: ${params.teamA} vs ${params.teamB}${params.league ? ` (${params.league})` : ''} on ${params.matchDate}.`,
            outcomes,
            tags: ['Sports', params.sport, params.teamA, params.teamB, ...leagueTag],
            category: 'Sports',
            marketType: 'categorical',
            oracleConfig: {
                type: 'API',
                resolutionSource: 'Official League Website / ESPN / CricBuzz',
                resolutionSourceUrl: '',
                resolutionCriteria: `Resolves to the team that wins the official match result. If the match is abandoned or cancelled without a result, the market is voided.`,
                confidenceThreshold: 99,
            },
        };
    },
};

const CRYPTO_PRICE: MarketTemplate = {
    id: 'CRYPTO_PRICE',
    name: 'Crypto Price Target',
    nameBn: 'ক্রিপ্টো মূল্য লক্ষ্য',
    description: 'Will a cryptocurrency reach a specific price by a certain date?',
    icon: '₿',
    type: 'binary',
    category: 'Crypto',
    parameters: [
        { key: 'coin', label: 'Cryptocurrency', type: 'select', required: true, options: ['Bitcoin (BTC)', 'Ethereum (ETH)', 'Solana (SOL)', 'BNB', 'XRP', 'Other'] },
        { key: 'targetPrice', label: 'Target Price (USD)', type: 'number', required: true, placeholder: 'e.g. 100000' },
        { key: 'direction', label: 'Direction', type: 'select', required: true, options: ['Above', 'Below'] },
        { key: 'deadline', label: 'By Date', type: 'date', required: true },
        { key: 'priceSource', label: 'Price Source', type: 'select', required: true, options: ['CoinGecko', 'Binance', 'CoinMarketCap'] },
    ],
    generate: (params) => {
        const coinName = params.coin.includes('(') ? params.coin.split('(')[0].trim() : params.coin;
        const symbol = params.coin.includes('(') ? params.coin.match(/\(([^)]+)\)/)?.[1] || '' : params.coin;

        return {
            question: `Will ${coinName} be ${params.direction.toLowerCase()} $${Number(params.targetPrice).toLocaleString()} by ${params.deadline}?`,
            description: `Resolves YES if the price of ${coinName} (${symbol}) is ${params.direction.toLowerCase()} $${Number(params.targetPrice).toLocaleString()} USD at any point before ${params.deadline}, as reported by ${params.priceSource}.`,
            outcomes: [
                { id: 'yes', label: 'Yes' },
                { id: 'no', label: 'No' },
            ],
            tags: ['Crypto', coinName, symbol, 'Price Prediction'],
            category: 'Crypto',
            marketType: 'binary',
            oracleConfig: {
                type: 'API',
                resolutionSource: params.priceSource,
                resolutionSourceUrl: params.priceSource === 'CoinGecko' ? `https://api.coingecko.com/api/v3/simple/price?ids=${coinName.toLowerCase()}&vs_currencies=usd` : '',
                resolutionCriteria: `Resolves YES if ${params.priceSource} shows ${coinName} price ${params.direction.toLowerCase()} $${params.targetPrice} at any point before the deadline. Otherwise resolves NO.`,
                confidenceThreshold: 99,
            },
        };
    },
};

const TV_SHOW_WINNER: MarketTemplate = {
    id: 'TV_SHOW_WINNER',
    name: 'Reality TV Winner',
    nameBn: 'রিয়ালিটি টিভি বিজয়ী',
    description: 'Predict the winner of a reality TV show based on a list of contestants.',
    icon: '📺',
    type: 'categorical',
    category: 'Entertainment',
    parameters: [
        { key: 'showName', label: 'Show Name', type: 'text', required: true, placeholder: "e.g. Bangladesh Idol Season 3" },
        { key: 'contestants', label: 'Contestants (one per line)', type: 'multi-text', required: true, placeholder: 'Contestant 1\nContestant 2\nContestant 3' },
        { key: 'finaleDate', label: 'Finale Date', type: 'date', required: true },
        { key: 'network', label: 'Broadcast Network', type: 'text', required: false, placeholder: 'e.g. Channel i' },
    ],
    generate: (params) => {
        const contestants = (params.contestants as string).split('\n').map(c => c.trim()).filter(Boolean);
        const outcomes = contestants.map((c, i) => ({ id: `contestant-${i}`, label: c }));

        return {
            question: `Who will win ${params.showName}?`,
            description: `Predict the winner of ${params.showName}. Finale is on ${params.finaleDate}${params.network ? ` on ${params.network}` : ''}.`,
            outcomes,
            tags: ['Entertainment', 'TV', params.showName],
            category: 'Entertainment',
            marketType: 'categorical',
            oracleConfig: {
                type: 'MANUAL',
                resolutionSource: `Official announcement by ${params.network || 'the production company'}`,
                resolutionCriteria: `Resolves to the contestant officially announced as the winner of ${params.showName} during the finale episode.`,
                confidenceThreshold: 100,
            },
        };
    },
};

// ============================================
// PUBLIC API
// ============================================

export const BUILT_IN_TEMPLATES: MarketTemplate[] = [
    ELECTION_WINNER,
    SPORTS_MATCH,
    CRYPTO_PRICE,
    TV_SHOW_WINNER,
];

/**
 * Get a template by ID.
 */
export function getTemplate(templateId: string): MarketTemplate | undefined {
    return BUILT_IN_TEMPLATES.find(t => t.id === templateId);
}

/**
 * Generate market data from a template and parameters.
 */
export function generateFromTemplate(templateId: string, params: Record<string, any>): GeneratedMarketData {
    const template = getTemplate(templateId);
    if (!template) throw new Error(`Template '${templateId}' not found`);

    // Validate required params
    for (const param of template.parameters) {
        if (param.required && (!params[param.key] || String(params[param.key]).trim() === '')) {
            throw new Error(`Missing required parameter: ${param.label}`);
        }
    }

    return template.generate(params);
}
