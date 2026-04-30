const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString: 'postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function pullSchema() {
  console.log('Connecting to production database...');
  await client.connect();

  let ddl = '-- ============================================\n';
  ddl += '-- PRODUCTION SCHEMA PULL\n';
  ddl += `-- Generated: ${new Date().toISOString()}\n`;
  ddl += '-- Project: sltcfmqefujecqfbmkvz (supabase-amber-lamp)\n';
  ddl += '-- ============================================\n\n';

  // 1. Enums
  console.log('Pulling enums...');
  const enums = await client.query(`
    SELECT n.nspname as schema, t.typname as name,
      array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    GROUP BY n.nspname, t.typname
    ORDER BY t.typname;
  `);
  ddl += '-- ======== ENUM TYPES ========\n';
  for (const en of enums.rows) {
    const rawVals = en.values;
    const valsArray = Array.isArray(rawVals) ? rawVals : (typeof rawVals === 'string' ? rawVals.replace(/[{}]/g, '').split(',') : []);
    const vals = valsArray.map(v => `'${String(v).trim()}'`).join(', ');
    ddl += `CREATE TYPE public.${en.name} AS ENUM (${vals});\n`;
  }

  // 2. Tables with columns
  console.log('Pulling tables...');
  const tables = await client.query(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
  `);

  ddl += '\n-- ======== TABLES ========\n';
  for (const t of tables.rows) {
    const cols = await client.query(`
      SELECT column_name, data_type, column_default, is_nullable, udt_name,
        character_maximum_length, numeric_precision
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [t.tablename]);

    ddl += `\n-- Table: ${t.tablename}\nCREATE TABLE IF NOT EXISTS public.${t.tablename} (\n`;
    const colDefs = cols.rows.map(c => {
      let dtype = c.data_type === 'USER-DEFINED' ? c.udt_name : c.data_type;
      if (c.character_maximum_length) dtype += `(${c.character_maximum_length})`;
      let def = `  ${c.column_name} ${dtype}`;
      if (c.column_default) def += ` DEFAULT ${c.column_default}`;
      if (c.is_nullable === 'NO') def += ' NOT NULL';
      return def;
    });
    ddl += colDefs.join(',\n');
    ddl += '\n);\n';
  }

  // 3. Indexes
  console.log('Pulling indexes...');
  const indexes = await client.query(`
    SELECT indexdef FROM pg_indexes 
    WHERE schemaname = 'public' 
    ORDER BY tablename, indexname;
  `);
  ddl += '\n-- ======== INDEXES ========\n';
  for (const idx of indexes.rows) {
    ddl += `${idx.indexdef};\n`;
  }

  // 4. Functions
  console.log('Pulling functions...');
  const funcs = await client.query(`
    SELECT pg_get_functiondef(p.oid) as definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    ORDER BY p.proname;
  `);
  ddl += '\n-- ======== FUNCTIONS ========\n';
  for (const f of funcs.rows) {
    ddl += `${f.definition};\n\n`;
  }

  // 5. RLS Policies
  console.log('Pulling RLS policies...');
  const rls = await client.query(`
    SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `);
  ddl += '\n-- ======== RLS POLICIES ========\n';
  for (const p of rls.rows) {
    const permissive = p.permissive === 'PERMISSIVE' ? 'PERMISSIVE' : 'RESTRICTIVE';
    ddl += `CREATE POLICY "${p.policyname}" ON public.${p.tablename}\n`;
    ddl += `  AS ${permissive} FOR ${p.cmd}\n`;
    const rolesStr = Array.isArray(p.roles) ? p.roles.join(', ') : String(p.roles || 'public');
    ddl += `  TO ${rolesStr}\n`;
    if (p.qual) ddl += `  USING (${p.qual})\n`;
    if (p.with_check) ddl += `  WITH CHECK (${p.with_check})\n`;
    ddl += ';\n';
  }

  // 6. Triggers
  console.log('Pulling triggers...');
  const triggers = await client.query(`
    SELECT trigger_name, event_manipulation, event_object_table, 
      action_timing, action_statement, action_orientation
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    ORDER BY event_object_table, trigger_name;
  `);
  ddl += '\n-- ======== TRIGGERS ========\n';
  for (const tr of triggers.rows) {
    ddl += `CREATE TRIGGER ${tr.trigger_name}\n`;
    ddl += `  ${tr.action_timing} ${tr.event_manipulation} ON public.${tr.event_object_table}\n`;
    ddl += `  FOR EACH ${tr.action_orientation}\n`;
    ddl += `  ${tr.action_statement};\n\n`;
  }

  // Write out
  const outFile = path.join(__dirname, '..', '..', 'supabase', 'snapshots', 'production_schema_pull.sql');
  fs.writeFileSync(outFile, ddl);
  console.log(`\n✅ Schema pulled to: ${outFile}`);
  console.log(`   Total size: ${(Buffer.byteLength(ddl) / 1024).toFixed(1)} KB`);

  await client.end();
}

pullSchema().catch(err => {
  console.error('Schema pull failed:', err);
  process.exit(1);
});
