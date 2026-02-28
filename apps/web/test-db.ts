import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
    const { data, error } = await supabase
        .from("markets")
        .select(`*, events(name)`)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("SUPABASE ERROR:", error);
    } else {
        console.log("Success! Fetched", data?.length, "markets.");
        console.log("Sample:", data?.[0]?.events);
    }
})();
