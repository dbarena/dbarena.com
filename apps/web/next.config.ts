import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(import.meta.dirname, "../.."),
  },
  experimental: {
    inlineCss: true,
    optimizePackageImports: [
      "@base-ui/react",
      "cmdk",
      "lucide-react",
      "motion",
    ],
  },
  outputFileTracingIncludes: {
    "/compare": ["./content/notes/*.md"],
    "/methodology": ["./content/methodology.md"],
  },
  async redirects() {
    return [
      {
        source: "/",
        has: [{ type: "query", key: "cols" }],
        destination: "/compare",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
