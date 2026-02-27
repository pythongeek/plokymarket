const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const connectionString = "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";
const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function fixSchema() {
    try {
        await client.connect();

        console.log('Ensuring Enums exist...');
        await client.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'withdrawal_status') THEN
                    CREATE TYPE withdrawal_status AS ENUM ('pending', 'processing', 'completed', 'rejected', 'cancelled');
                END IF;
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mfs_provider') THEN
                    CREATE TYPE mfs_provider AS ENUM ('bkash', 'nagad', 'rocket', 'upay');
                END IF;
            END $$;
        `);

        console.log('Ensuring withdrawal_requests table exists...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS public.withdrawal_requests (
              id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
              usdt_amount DECIMAL(12,2) NOT NULL CHECK (usdt_amount > 0),
              bdt_amount DECIMAL(12,2) NOT NULL CHECK (bdt_amount > 0),
              exchange_rate DECIMAL(10,4) NOT NULL,
              mfs_provider mfs_provider NOT NULL,
              recipient_number VARCHAR(20) NOT NULL,
              recipient_name VARCHAR(100),
              status withdrawal_status DEFAULT 'pending' NOT NULL,
              balance_hold_id UUID,
              processed_by UUID REFERENCES auth.users(id),
              processed_at TIMESTAMPTZ,
              admin_notes TEXT,
              transfer_proof_url TEXT,
              cancelled_at TIMESTAMPTZ,
              cancellation_reason TEXT,
              ip_address INET,
              user_agent TEXT,
              created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
              updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
            );
        `);

        console.log('Schema fix completed successfully.');
    } catch (err) {
        console.error('Schema fix failed:', err.message);
    } finally {
        await client.end();
    }
}
fixSchema();
