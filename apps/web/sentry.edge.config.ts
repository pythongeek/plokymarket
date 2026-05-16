import * as Sentry from "@sentry/nextjs";

Sentry.init({
    dsn: "https://f1eb4ade6c87dbbdc963eb7c4ca5a59f@o4510975612420096.ingest.us.sentry.io/4510975614844928",

    // Adds request headers and IP for users
    sendDefaultPii: true,
    enabled: false, // DISABLED — performance overhead too high for Bangladesh users
    tracesSampleRate: 0,
});
