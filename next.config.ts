import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Old booking addresses. Query strings (e.g. ?template=…) are passed through.
  async redirects() {
    return [
      { source: "/book/pages", destination: "/book", permanent: true },
      // Ready-made and design-your-own pages are paused for now.
      { source: "/create", destination: "/collage", permanent: false },
      { source: "/templates", destination: "/collage", permanent: false },
      { source: "/templates/:path*", destination: "/collage", permanent: false },
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
