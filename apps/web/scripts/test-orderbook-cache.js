// using native fetch

const BASE_URL = 'https://polymarket-bangladesh.vercel.app';
const MARKET_ID = '11111111-1111-1111-1111-111111111111'; // Use a default/test market id
const TEST_USER = '22222222-2222-2222-2222-222222222222';

async function runTests() {
    console.log(`Starting OrderBook Cache Tests against ${BASE_URL}...`);

    console.log('\n1. Testing Initial GET (Should be MISS)');
    const t1 = Date.now();
    let res = await fetch(`${BASE_URL}/api/orderbook/${MARKET_ID}`);
    const d1 = Date.now() - t1;
    console.log(`Status: ${res.status}, Time: ${d1}ms, Cache: ${res.headers.get('x-cache')}, Cache-Control: ${res.headers.get('cache-control')}`);

    console.log('\n2. Testing Cached GET (Should be HIT and faster)');
    const t2 = Date.now();
    res = await fetch(`${BASE_URL}/api/orderbook/${MARKET_ID}`);
    const d2 = Date.now() - t2;
    console.log(`Status: ${res.status}, Time: ${d2}ms, Cache: ${res.headers.get('x-cache')}`);
    console.log('Headers from Cached GET:');
    res.headers.forEach((value, name) => console.log(`  ${name}: ${value}`));

    console.log('\n3. Placing an Order (Will fail Validation but should test Rate Limiter)...');
    const orderPayload = {
        marketId: MARKET_ID,
        userId: TEST_USER,
        side: 'buy',
        price: 1500000,
        size: 1000000,
        type: 'LIMIT',
        timeInForce: 'GTC'
    };

    console.log('Sending 15 rapid order requests to test Redis RateLimiter...');
    const promises = Array.from({ length: 15 }).map(() =>
        fetch(`${BASE_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        }).then(async r => {
            const result = await r.json();
            return result.error || 'Success';
        })
    );
    const results = await Promise.all(promises);

    const rateLimited = results.filter(r => JSON.stringify(r).includes('RATE')).length;
    const validatedFailed = results.filter(r => JSON.stringify(r).includes('Validation')).length;
    console.log(`Results -> Rate Limited: ${rateLimited}, Validation Errors: ${validatedFailed}, Unknowns: ${15 - rateLimited - validatedFailed}`);

    console.log('\n4. Testing GET after POSTs...');
    const t3 = Date.now();
    res = await fetch(`${BASE_URL}/api/orderbook/${MARKET_ID}`);
    const d3 = Date.now() - t3;
    console.log(`Status: ${res.status}, Time: ${d3}ms, Cache: ${res.headers.get('x-cache')}`);

    console.log('\nTest Completed!');
}

runTests().catch(console.error);
