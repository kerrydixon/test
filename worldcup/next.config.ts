import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // This app lives in a subdirectory of the repo; pin the Turbopack root so Next
  // doesn't pick up the sibling project's lockfile.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
