const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function audit() {
  await client.connect();

  // 1. All public functions grouped by base name
  console.log('=== ALL PUBLIC FUNCTIONS (grouped by base name) ===');
  const funcs = await client.query(`
    SELECT p.proname as name,
      pg_get_function_arguments(p.oid) as args,
      pg_get_function_result(p.oid) as returns,
      CASE WHEN p.prosecdef THEN 'DEFINER' ELSE 'INVOKER' END as security,
      pg_get_functiondef(p.oid) as definition
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
    ORDER BY p.proname;
  `);
  
  // Group by base name (strip _v2, _v3 suffixes)
  const groups = {};
  funcs.rows.forEach(f => {
    const base = f.name.replace(/_v[0-9]+$/, '');
    if (!groups[base]) groups[base] = [];
    groups[base].push({
      name: f.name,
      args: f.args,
      returns: f.returns,
      security: f.security,
      isWrapper: f.definition.includes('_v2(') || f.definition.includes('_v3('),
      callsV2: f.definition.includes('_v2('),
      callsV3: f.definition.includes('_v3('),
      defSnippet: f.definition.substring(0, 300)
    });
  });

  // Show only groups with multiple versions or where wrapper pattern applies
  const relevantGroups = Object.entries(groups).filter(([_, fns]) => fns.length > 1);
  console.log(`\nFound ${relevantGroups.length} function groups with multiple versions:\n`);
  
  relevantGroups.forEach(([base, fns]) => {
    console.log(`── ${base} (${fns.length} versions) ──`);
    fns.forEach(f => {
      const wrapper = f.isWrapper ? '🔗 WRAPPER' : '🔧 CANONICAL';
      console.log(`  ${f.name}(${f.args.substring(0,60)}${f.args.length > 60 ? '...' : ''}) → ${f.returns} [${f.security}] ${wrapper}`);
    });
    console.log('');
  });

  // 2. Find functions WITHOUT a canonical v2/v3 version (orphans)
  console.log('\n=== ORPHAN FUNCTIONS (no v2/v3 canonical) ===');
  const singleFuncs = Object.entries(groups).filter(([_, fns]) => fns.length === 1 && !fns[0].name.match(/_v[0-9]+$/));
  singleFuncs.forEach(([_, [f]]) => {
    if (!f.name.startsWith('is_') && !f.name.startsWith('update_updated') && !f.name.startsWith('calculate_') && !f.name.startsWith('trg_') && !f.name.startsWith('event_tags')) {
      console.log(`  ${f.name}(${f.args.substring(0,50)}) → ${f.returns}`);
    }
  });

  // 3. Count wrappers vs canonicals
  let wrapperCount = 0, canonicalCount = 0;
  funcs.rows.forEach(f => {
    if (f.definition.includes('_v2(') || f.definition.includes('_v3(')) wrapperCount++;
    if (f.name.match(/_v[0-9]+$/)) canonicalCount++;
  });
  console.log(`\n=== SUMMARY ===`);
  console.log(`  Total functions: ${funcs.rows.length}`);
  console.log(`  Canonical (v2/v3): ${canonicalCount}`);
  console.log(`  Wrappers (delegates to vN): ${wrapperCount}`);
  console.log(`  Function groups: ${Object.keys(groups).length}`);
  console.log(`  Multi-version groups: ${relevantGroups.length}`);

  await client.end();
}

audit().catch(err => { console.error('Audit failed:', err.message); process.exit(1); });
