import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Old booking addresses. Query strings (e.g. ?template=…) are passed through.
  async redirects() {
    return [
      { source: "/book/pages", destination: "/book", permanent: true },
      { source: "/create", destination: "/book?mode=custom", permanent: true },
    ];
  },
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
