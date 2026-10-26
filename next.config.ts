import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Orders, prices, and taxes are tenant-specific and must be read on each request.
  // Cache Components stay off so bill totals are never served from a static shell.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
