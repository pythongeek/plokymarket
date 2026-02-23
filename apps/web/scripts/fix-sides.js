const fs = require('fs');
const files = [
    'src/lib/clob/ds/DepthManager.ts',
    'src/lib/clob/OrderBookEngine.ts',
    'src/lib/clob/service.ts'
];

for (const f of files) {
    let content = fs.readFileSync(f, 'utf8');
    content = content.replace(/'bid'/g, "'buy'");
    content = content.replace(/'ask'/g, "'sell'");

    if (f === 'src/lib/clob/OrderBookEngine.ts' && !content.includes('public getOrder')) {
        content = content.replace('    async placeOrder(', '    public getOrder(orderId: string): Order | undefined {\n        return this.orderMap.get(orderId);\n    }\n\n    async placeOrder(');
    }

    fs.writeFileSync(f, content);
    console.log('Fixed', f);
}
