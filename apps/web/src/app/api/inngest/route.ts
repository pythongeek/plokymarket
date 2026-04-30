import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { helloWorld } from "@/lib/inngest/functions";
import { resolveMarket } from "@/lib/inngest/workflows/market-resolution";
import { aiOracleResolution, challengeResolution } from "@/lib/inngest/workflows/ai-oracle-resolution";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [
        helloWorld,
        resolveMarket,
        aiOracleResolution,
        challengeResolution,
    ],
});
