import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only node-ical needs to stay external (it breaks the Turbopack bundler).
  // tsdav/ical.js bundle fine and must NOT be external: tsdav's dual ESM/CJS
  // exports map trips Turbopack's external-module loader at runtime
  // ("Cannot use import statement outside a module").
  serverExternalPackages: ["node-ical"],
  // Vercel's file tracing can miss files inside node-ical when it's external,
  // causing "Failed to load external module" at runtime
  outputFileTracingIncludes: {
    "/*": ["./node_modules/node-ical/**/*"],
  },
};

export default nextConfig;
