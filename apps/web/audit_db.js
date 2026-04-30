const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function runAudit() {
  console.log('Connecting to production database...');
  await client.connect();
  
  console.log('\n--- Running Duplicate Function Audit ---');
  const duplicateQuery = `
    SELECT routine_name, COUNT(*) as count
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    GROUP BY routine_name 
    HAVING COUNT(*) > 1
    ORDER BY count DESC;
  `;
  const duplicateRes = await client.query(duplicateQuery);
  
  if (duplicateRes.rows.length === 0) {
    console.log('✅ No duplicate functions found.');
  } else {
    console.log(`⚠️ Found ${duplicateRes.rows.length} duplicate functions:`);
    console.table(duplicateRes.rows);
  }

  // Also query all custom routines for classification context
  const allQuery = `
    SELECT routine_name, routine_type 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name NOT LIKE 'pg_%';
  `;
  const allRes = await client.query(allQuery);
  console.log(`\nTotal custom routines in public schema: ${allRes.rows.length}`);

  await client.end();
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
