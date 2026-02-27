
const { Client } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function checkUsersTable() {
    try {
        await client.connect();
        console.log('Connected to Production DB.');

        console.log('Checking users table columns...');
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY column_name;
        `);
        console.log('Columns in users table:');
        res.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));

        console.log('\nChecking user_profiles table columns...');
        const res2 = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user_profiles'
            ORDER BY column_name;
        `);
        console.log('Columns in user_profiles table:');
        res2.rows.forEach(row => console.log(`- ${row.column_name}: ${row.data_type}`));

    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        await client.end();
    }
}

checkUsersTable();
