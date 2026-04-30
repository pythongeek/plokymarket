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
    '20260309100001_core_types.sql',
    '20260309100002_users.sql'
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
      
      // Also register it manually in schema_migrations so Supabase tracks it
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

  await client.end();
  console.log('\nDeployment completed successfully.');
}

runDeploy().catch(err => {
  console.error('Fatal error during deployment:', err);
  process.exit(1);
});
