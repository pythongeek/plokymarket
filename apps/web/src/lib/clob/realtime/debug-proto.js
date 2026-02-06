
const protobuf = require('protobufjs');

const PROTO_SCHEMA = `
syntax = "proto3";
package market;
enum Level { L1 = 0; L2 = 1; L3 = 2; }
message MarketUpdate {
    Level level = 4;
}
message RealtimeMessage {
    oneof content {
        MarketUpdate update = 2;
    }
}
`;

const root = protobuf.parse(PROTO_SCHEMA).root;
const RealtimeMessage = root.lookupType("market.RealtimeMessage");

const payload = {
    update: {
        level: 0 // L1
    }
};

const errMsg = RealtimeMessage.verify(payload);
if (errMsg) console.error('Verify Error:', errMsg);

const buffer = RealtimeMessage.encode(RealtimeMessage.create(payload)).finish();
console.log('Buffer length:', buffer.length);

const decoded = RealtimeMessage.decode(buffer);
const obj = RealtimeMessage.toObject(decoded, { enums: String, longs: Number, defaults: true });

console.log('Decoded Object:', JSON.stringify(obj, null, 2));
console.log('Level Type:', typeof obj.update.level);
console.log('Level Value:', obj.update.level);
