import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // CJS packages with dynamic requires that Turbopack shouldn't bundle
  serverExternalPackages: ["node-ical", "tsdav", "ical.js"],
};

export default nextConfig;
