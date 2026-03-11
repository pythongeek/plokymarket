const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString: 'postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function takeSnapshot() {
  console.log('Connecting to production database...');
  await client.connect();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outDir = path.join(__dirname, '..', '..', 'supabase', 'snapshots');

  // 1. Dump all tables with row counts
  console.log('\n📋 Collecting table inventory...');
  const tablesRes = await client.query(`
    SELECT schemaname, tablename, 
      pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as size
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
  `);

  // 2. Dump all functions/routines
  console.log('📋 Collecting function inventory...');
  const funcsRes = await client.query(`
    SELECT routine_name, routine_type, data_type,
      pg_get_functiondef(p.oid) as definition
    FROM information_schema.routines r
    JOIN pg_proc p ON p.proname = r.routine_name
    WHERE r.routine_schema = 'public'
    ORDER BY routine_name;
  `);

  // 3. Dump all custom types/enums
  console.log('📋 Collecting enum types...');
  const enumsRes = await client.query(`
    SELECT t.typname as enum_name, 
      array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY t.typname
    ORDER BY t.typname;
  `);

  // 4. Dump all indexes
  console.log('📋 Collecting indexes...');
  const indexesRes = await client.query(`
    SELECT schemaname, tablename, indexname, indexdef
    FROM pg_indexes 
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `);

  // 5. Dump all RLS policies
  console.log('📋 Collecting RLS policies...');
  const rlsRes = await client.query(`
    SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `);

  // 6. Dump all triggers
  console.log('📋 Collecting triggers...');
  const triggersRes = await client.query(`
    SELECT trigger_name, event_manipulation, event_object_table, action_statement
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name;
  `);

  // 7. Column details for all tables
  console.log('📋 Collecting column details...');
  const columnsRes = await client.query(`
    SELECT table_name, column_name, data_type, column_default, is_nullable, 
      udt_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    ORDER BY table_name, ordinal_position;
  `);

  // 8. Foreign keys
  console.log('📋 Collecting foreign keys...');
  const fkRes = await client.query(`
    SELECT 
      tc.table_name, tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu 
      ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public';
  `);

  // Build snapshot object
  const snapshot = {
    metadata: {
      timestamp: new Date().toISOString(),
      project_ref: 'sltcfmqefujecqfbmkvz',
      project_name: 'supabase-amber-lamp',
      snapshot_type: 'full_schema_snapshot'
    },
    tables: tablesRes.rows,
    columns: columnsRes.rows,
    functions: funcsRes.rows.map(f => ({
      name: f.routine_name,
      type: f.routine_type,
      return_type: f.data_type,
      definition: f.definition
    })),
    enums: enumsRes.rows.map(e => ({
      name: e.enum_name,
      values: e.values
    })),
    indexes: indexesRes.rows,
    rls_policies: rlsRes.rows,
    triggers: triggersRes.rows,
    foreign_keys: fkRes.rows
  };

  // Write snapshot
  const snapshotFile = path.join(outDir, `snapshot_${timestamp}.json`);
  fs.writeFileSync(snapshotFile, JSON.stringify(snapshot, null, 2));
  console.log(`\n✅ Full snapshot saved: ${snapshotFile}`);

  // Print summary
  console.log(`\n--- SNAPSHOT SUMMARY ---`);
  console.log(`Tables:       ${snapshot.tables.length}`);
  console.log(`Columns:      ${snapshot.columns.length}`);
  console.log(`Functions:    ${snapshot.functions.length}`);
  console.log(`Enum Types:   ${snapshot.enums.length}`);
  console.log(`Indexes:      ${snapshot.indexes.length}`);
  console.log(`RLS Policies: ${snapshot.rls_policies.length}`);
  console.log(`Triggers:     ${snapshot.triggers.length}`);
  console.log(`Foreign Keys: ${snapshot.foreign_keys.length}`);

  await client.end();
}

takeSnapshot().catch(err => {
  console.error('Snapshot failed:', err);
  process.exit(1);
});
