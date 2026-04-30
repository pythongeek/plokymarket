const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString: 'postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function runDeploy() {
  console.log('Connecting to production database...');
  await client.connect();
  
  const files = [
    '20260312100003_events.sql',
    '20260312100004_markets.sql',
    '20260312100005_wrappers_events.sql'
  ];

  for (const file of files) {
    const filePath = path.join(__dirname, '..', '..', 'supabase', 'migrations', file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Migration file not found: ${filePath}`);
    }

    console.log(`\n--- Executing ${file} ---`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    try {
      await client.query('BEGIN');
      await client.query(sql);
      
      const version = file.split('_')[0];
      const name = file.replace(`${version}_`, '').replace('.sql', '');
      await client.query(`
        INSERT INTO supabase_migrations.schema_migrations (version, statements, name) 
        VALUES ($1, $2, $3)
        ON CONFLICT (version) DO NOTHING;
      `, [version, [sql], name]);
      
      await client.query('COMMIT');
      console.log(`✅ Successfully applied ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`❌ Failed to apply ${file}:`);
      console.error(err.message);
      throw err;
    }
  }

  // Phase 2 verification queries
  console.log('\n\n--- PHASE 2 VERIFICATION ---');
  
  const colCheck = await client.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'events' AND column_name IN ('title','tags','answer_type')
    ORDER BY column_name;
  `);
  console.log(`Events columns (title, tags, answer_type): ${colCheck.rows.map(r => r.column_name).join(', ')}`);
  console.log(colCheck.rows.length === 3 ? '✅ All 3 columns verified' : '❌ Missing columns!');

  const rpcCheck = await client.query(`
    SELECT routine_name FROM information_schema.routines 
    WHERE routine_schema = 'public' AND routine_name IN ('create_event_complete_v3', 'create_market_v2', 'create_event_complete', 'create_event_complete_v2')
    ORDER BY routine_name;
  `);
  console.log(`\nRPCs deployed: ${rpcCheck.rows.map(r => r.routine_name).join(', ')}`);
  
  const migCheck = await client.query(`
    SELECT version, name FROM supabase_migrations.schema_migrations ORDER BY version;
  `);
  console.log(`\nMigration history:`);
  migCheck.rows.forEach(r => console.log(`  ${r.version} — ${r.name || '(unnamed)'}`));

  await client.end();
  console.log('\n✅ Phase 2 deployment completed successfully.');
}

runDeploy().catch(err => {
  console.error('Fatal error during deployment:', err);
  process.exit(1);
});
