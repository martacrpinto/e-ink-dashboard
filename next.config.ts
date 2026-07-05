import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CJS packages with dynamic requires that Turbopack shouldn't bundle
  serverExternalPackages: ["node-ical", "tsdav", "ical.js"],
  // Vercel's file tracing can miss files inside these packages when they're
  // external, causing "Failed to load external module" at runtime
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/tsdav/**/*",
      "./node_modules/ical.js/**/*",
      "./node_modules/node-ical/**/*",
    ],
  },
};

export default nextConfig;
