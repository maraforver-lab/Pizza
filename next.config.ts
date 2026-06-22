import type { NextConfig } from "next";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const gitValue = (args: string[], fallback: string) => {
  try {
    return execFileSync("git", args, { cwd: process.cwd(), encoding: "utf8" }).trim();
  } catch {
    return fallback;
  }
};

const packageVersion = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")).version as string;
const buildId = (process.env.VERCEL_GIT_COMMIT_SHA ?? gitValue(["rev-parse", "--short=7", "HEAD"], "local")).slice(0, 7);
const lastUpdated = gitValue(["log", "-1", "--format=%cI"], new Date().toISOString());

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_APP_VERSION: packageVersion,
    NEXT_PUBLIC_BUILD_ID: buildId,
    NEXT_PUBLIC_LAST_UPDATED: lastUpdated,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "https://pizza-maraforver.vercel.app",
  },
};

export default nextConfig;
