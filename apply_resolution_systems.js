const { Client } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = 'postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x';

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const sql = `
CREATE TABLE IF NOT EXISTS "public"."resolution_systems" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "market_id" "uuid",
    "primary_method" character varying(50) DEFAULT 'manual_admin'::character varying NOT NULL,
    "confidence_threshold" integer DEFAULT 85,
    "ai_keywords" "text"[] DEFAULT '{}'::"text"[],
    "ai_sources" "text"[] DEFAULT '{}'::"text"[],
    "resolver_reference" "text",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "proposed_outcome" integer,
    "final_outcome" integer,
    "resolution_notes" "text",
    "evidence_urls" "text"[],
    "scheduled_resolution_at" timestamp with time zone,
    "resolved_at" timestamp with time zone,
    "resolved_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "resolution_systems_pkey" PRIMARY KEY ("id")
);
`;

async function run() {
    try {
        await client.connect();
        console.log('Connected to remote database!');

        await client.query(sql);
        console.log('Table created successfully!');

        // Verify
        const r = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'resolution_systems'");
        console.log('Verification - Tables found:', r.rows);

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

run();
