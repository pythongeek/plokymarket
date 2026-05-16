import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
  environment: process.env.NODE_ENV || 'development',
  beforeSend(event) {
    if (event.request?.cookies) {
      delete event.request.cookies['sb-access-token'];
      delete event.request.cookies['sb-refresh-token'];
    }
    return event;
  },
});
