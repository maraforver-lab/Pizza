import type { NextConfig } from "next";
import { execFileSync } from "node:child_process";

const gitValue = (args: string[], fallback: string) => {
  try {
    return execFileSync("git", args, { cwd: process.cwd(), encoding: "utf8" }).trim();
  } catch {
    return fallback;
  }
};

const commitCount = gitValue(["rev-list", "--count", "HEAD"], "0");
const lastUpdated = gitValue(["log", "-1", "--format=%cI"], new Date().toISOString());

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: `1.0.${commitCount}`,
    NEXT_PUBLIC_LAST_UPDATED: lastUpdated,
  },
};

export default nextConfig;
