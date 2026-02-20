/**
 * Check which tables/columns exist in production that affect the admin layout loading
 */
const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const client = new Client({
    connectionString: "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x",
    ssl: { rejectUnauthorized: false }
});

async function run() {
    await client.connect();
    console.log('Connected\n');

    // 1. Check user_profiles columns
    const profileCols = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='user_profiles' ORDER BY ordinal_position
  `);
    console.log('=== user_profiles columns ===');
    if (profileCols.rows.length === 0) {
        console.log('❌ TABLE DOES NOT EXIST');
    } else {
        profileCols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));
    }

    // 2. Check admin_audit_log
    const auditCols = await client.query(`
    SELECT column_name, data_type FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='admin_audit_log' ORDER BY ordinal_position
  `);
    console.log('\n=== admin_audit_log columns ===');
    if (auditCols.rows.length === 0) {
        console.log('❌ TABLE DOES NOT EXIST');
    } else {
        auditCols.rows.forEach(r => console.log(`  ${r.column_name} (${r.data_type})`));
    }

    // 3. Check market_creation_drafts
    const draftsCols = await client.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='market_creation_drafts'
  `);
    console.log('\n=== market_creation_drafts ===');
    console.log(draftsCols.rows.length > 0 ? `✅ Exists (${draftsCols.rows.length} cols)` : '❌ DOES NOT EXIST');

    // 4. Check support_tickets
    const ticketsCols = await client.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_schema='public' AND table_name='support_tickets'
  `);
    console.log('\n=== support_tickets ===');
    console.log(ticketsCols.rows.length > 0 ? `✅ Exists (${ticketsCols.rows.length} cols)` : '❌ DOES NOT EXIST');

    // 5. Check if admin user exists in user_profiles
    try {
        const adminUser = await client.query(`
      SELECT id, email, is_admin FROM public.user_profiles LIMIT 5
    `);
        console.log('\n=== user_profiles data (first 5) ===');
        adminUser.rows.forEach(r => console.log(`  ${r.email} | is_admin: ${r.is_admin}`));
    } catch (err) {
        console.log('\n=== user_profiles data error ===');
        console.log(err.message);
    }

    await client.end();
}

run();
