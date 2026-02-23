const { fetchBinanceP2PRates, getExchangeRate } = require('./src/lib/realtime/binance-p2p.ts');

async function test() {
    console.log("Testing Binance P2P Rate Fetcher...");
    const rates = await fetchBinanceP2PRates();
    console.log("Rates fetch result:", rates);

    console.log("\Testing getExchangeRate fallback chain...");
    const fallback = await getExchangeRate();
    console.log("Fallback result:", fallback);
}

test();
