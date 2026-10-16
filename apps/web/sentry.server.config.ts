import * as Sentry from "@sentry/nextjs";

const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

export default Sentry.init({
  dsn: sentryDsn,
  tracesSampleRate: process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
    ? Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE)
    : 0.1,
  debug: process.env.NEXT_PUBLIC_SENTRY_DEBUG === "true",

  // PII scrubbing: never send request bodies, cookies, or headers with sensitive data
  beforeSend(event) {
    const scrubbed = { ...event };
    if (scrubbed.request) {
      scrubbed.request = {
        ...scrubbed.request,
        headers: undefined,
        cookies: undefined,
        body: undefined,
      };
    }
    if (scrubbed.contexts?.trace) {
      delete scrubbed.contexts.trace.data?.password;
      delete scrubbed.contexts.trace.data?.token;
      delete scrubbed.contexts.trace.data?.flag;
    }
    return scrubbed;
  },

  // Release tagging from git SHA (set via SENTRY_RELEASE at build time)
  release: process.env.SENTRY_RELEASE,

  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
});
