const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  try {
    await client.query("NOTIFY pgrst, 'reload schema'");
    console.log("NOTIFY pgrst reload schema successfully executed.");
  } catch (e) {
    console.error("Error doing NOTIFY pgrst:", e);
  } finally {
    await client.end();
  }
}

run();
