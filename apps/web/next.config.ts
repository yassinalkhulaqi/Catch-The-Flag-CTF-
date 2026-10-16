import type { NextConfig } from "next";
import withSentryConfig from "@sentry/nextjs/with-sentry-config";

const nextConfig: NextConfig = {
  /* config options here */
};

const sentryWebpackPluginOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Release tagging from git SHA
  release: process.env.SENTRY_RELEASE,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
