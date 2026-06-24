import type { NextConfig } from "next";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { securityHeaders } from "./lib/security-headers";

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

const hasSafeProductionSiteUrl = (value?: string) => {
  try {
    const url = new URL(value ?? "");
    const hostname = url.hostname.toLowerCase();

    return (
      ["http:", "https:"].includes(url.protocol)
      && hostname !== "localhost"
      && hostname !== "127.0.0.1"
      && hostname !== "0.0.0.0"
      && !hostname.endsWith(".local")
      && !hostname.endsWith(".vercel.app")
    );
  } catch {
    return false;
  }
};

const allowIndexing = (
  process.env.ALLOW_INDEXING === "true"
  && hasSafeProductionSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)
  && process.env.VERCEL_ENV !== "preview"
);

const noIndexHeader = {
  key: "X-Robots-Tag",
  // TEMPORARY PRE-LAUNCH INDEXING BLOCK:
  // Controlled by ALLOW_INDEXING and a safe NEXT_PUBLIC_SITE_URL before public launch.
  value: "noindex, nofollow, noarchive",
};

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    if (allowIndexing) {
      return [
        {
          source: "/:path*",
          headers: securityHeaders,
        },
        {
          source: "/account/:path*",
          headers: [noIndexHeader],
        },
        {
          source: "/auth/:path*",
          headers: [noIndexHeader],
        },
      ];
    }

    return [
      {
        source: "/:path*",
        headers: [
          ...securityHeaders,
          noIndexHeader,
        ],
      },
    ];
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: packageVersion,
    NEXT_PUBLIC_BUILD_ID: buildId,
    NEXT_PUBLIC_LAST_UPDATED: lastUpdated,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "",
    NEXT_PUBLIC_ALLOW_INDEXING: allowIndexing ? "true" : "false",
  },
};

export default nextConfig;
