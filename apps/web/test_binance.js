const https = require('https');
const zlib = require('zlib');

const payload = JSON.stringify({
    fiat: "BDT",
    page: 1,
    rows: 1,
    tradeType: "BUY",
    asset: "USDT",
    countries: [],
    proMerchantAds: false,
    shieldMerchantAds: false,
    publisherType: null,
    payTypes: [],
    classifies: ["mass", "profession"]
});

const options = {
    hostname: 'p2p.binance.com',
    port: 443,
    path: '/bapi/c2c/v2/friendly/c2c/adv/search',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': payload.length,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Encoding': 'gzip, deflate'
    }
};

const req = https.request(options, (res) => {
    let chunks = [];
    res.on('data', chunk => chunks.push(chunk));

    res.on('end', () => {
        let buffer = Buffer.concat(chunks);
        let encoding = res.headers['content-encoding'];

        if (encoding === 'gzip') {
            buffer = zlib.gunzipSync(buffer);
        } else if (encoding === 'deflate') {
            buffer = zlib.inflateSync(buffer);
        }

        try {
            const json = JSON.parse(buffer.toString());
            console.log(JSON.stringify(json.data[0], null, 2));
        } catch (e) {
            console.error("JSON Parse Error:", e);
            console.log(buffer.toString().substring(0, 500));
        }
    });
});

req.on('error', (e) => {
    console.error("Request Error:", e);
});

req.write(payload);
req.end();
