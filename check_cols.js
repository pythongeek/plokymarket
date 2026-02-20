const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const c = new Client({
    connectionString: 'postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x',
    ssl: { rejectUnauthorized: false }
});
(async () => {
    await c.connect();

    // Check user_profiles columns  
    const r = await c.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='user_profiles' ORDER BY ordinal_position");
    console.log('user_profiles columns:');
    r.rows.forEach(x => console.log('  -', x.column_name));

    const hasSuperAdmin = r.rows.some(x => x.column_name === 'is_super_admin');
    console.log('\nis_super_admin exists:', hasSuperAdmin);

    // Check admin_audit_log columns
    const a = await c.query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='admin_audit_log' ORDER BY ordinal_position");
    console.log('\nadmin_audit_log columns:');
    a.rows.forEach(x => console.log('  -', x.column_name));

    // Check profile data for admin  
    const p = await c.query("SELECT id, email, is_admin FROM public.user_profiles WHERE is_admin = true");
    console.log('\nAdmin profiles:');
    p.rows.forEach(x => console.log('  -', x.email, '| id:', x.id));

    await c.end();
})();
