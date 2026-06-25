import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import { isIndexingAllowed, robotsPolicy, sitemapEntries } from "@/lib/seo-config";
import { patchHistory } from "@/lib/changelog";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("install app / add to home screen foundation", () => {
  it("defines a conservative web app manifest", () => {
    const data = manifest();

    expect(data.name).toBe("DoughTools");
    expect(data.short_name).toBe("DoughTools");
    expect(data.description).toBe("Practical pizza-making workspace for dough, planning, baking and improvement.");
    expect(data.start_url).toBe("/");
    expect(data.scope).toBe("/");
    expect(data.display).toBe("standalone");
    expect(data.background_color).toBe("#f6f3ea");
    expect(data.theme_color).toBe("#f6f3ea");
    expect(data.icons).toEqual([
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ]);
  });

  it("references only existing local icon assets", () => {
    const data = manifest();
    const icons = Array.isArray(data.icons) ? data.icons : [];

    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
      expect(icon.src).toMatch(/^\//);
      expect(icon.src).not.toMatch(/^https?:\/\//);
      expect(existsSync(join(process.cwd(), "public", icon.src.replace(/^\//, "")))).toBe(true);
    }
  });

  it("keeps the install prompt component client-safe and browser-event based", () => {
    const component = source("components/InstallAppPrompt.tsx");

    expect(component).toContain("\"use client\"");
    expect(component).toContain("beforeinstallprompt");
    expect(component).toContain("preventDefault");
    expect(component).toContain("deferredPrompt");
    expect(component).toContain("prompt()");
    expect(component).toContain("userChoice");
    expect(component).toContain("appinstalled");
    expect(component).toContain("(display-mode: standalone)");
    expect(component).toContain("standalone");
    expect(component).toContain("typeof window === \"undefined\"");
    expect(component).toContain("Install DoughTools");
    expect(component).toContain("Add to Home Screen");
    expect(component).toContain("<button");
    expect(component).not.toMatch(/localStorage|sessionStorage|document\.cookie|gtag|posthog|plausible|trackEvent/i);
    expect(component).not.toMatch(/serviceWorker|PushManager|Notification\.requestPermission/i);
  });

  it("shows honest unsupported-browser and local-first copy", () => {
    const component = source("components/InstallAppPrompt.tsx");

    expect(component).toContain("Open this page in your browser.");
    expect(component).toContain("Tap Share.");
    expect(component).toContain("Choose Add to Home Screen.");
    expect(component).toContain("Safari");
    expect(component).toContain("Installing does not add cloud sync, push notifications, tracking or offline mode");
    expect(component).not.toMatch(/automatic installation|native app|works offline|push reminders/i);
  });

  it("keeps install guidance available from account while the homepage stays minimal", () => {
    const homepage = source("app/page.tsx");
    const account = source("app/account/page.tsx");

    expect(homepage).not.toContain("InstallAppPrompt");
    expect(account).toContain("InstallAppPrompt");
    expect(homepage).toContain("homepageContent.hero.primaryCta.label");
    expect(homepage).not.toContain("homepageContent.workflow.map");
    expect(account).toContain("Saved recipes and local bake notes stay in this browser");
    expect(account).toContain("<InstallAppPrompt");
  });

  it("documents install behavior without claiming offline, push, tracking or indexing launch", () => {
    const doc = source("docs/install-app-pwa.md");

    expect(doc).toContain("Patch 30");
    expect(doc).toContain("beforeinstallprompt");
    expect(doc).toContain("Share");
    expect(doc).toContain("Add to Home Screen");
    expect(doc).toContain("No offline mode is added");
    expect(doc).toContain("No push notifications are added");
    expect(doc).toContain("No analytics, tracking, cookies or install-choice telemetry are added");
    expect(doc).toContain("Google indexing remains disabled");
    expect(doc).toContain("public/icon.svg");
  });

  it("keeps launch safety and avoids adding service worker or push files", () => {
    expect(isIndexingAllowed({ ALLOW_INDEXING: "false", NEXT_PUBLIC_SITE_URL: "https://doughtools.app" })).toBe(false);
    expect(robotsPolicy({ ALLOW_INDEXING: "false", NEXT_PUBLIC_SITE_URL: "https://doughtools.app" })).toMatchObject({
      rules: { userAgent: "*", disallow: "/" },
    });
    expect(sitemapEntries({ NEXT_PUBLIC_SITE_URL: "https://doughtools.app" }).some((entry) => entry.url.includes("/account"))).toBe(false);
    expect(existsSync(join(process.cwd(), "public", "sw.js"))).toBe(false);
    expect(existsSync(join(process.cwd(), "public", "service-worker.js"))).toBe(false);
    expect(existsSync(join(process.cwd(), "app", "sw.ts"))).toBe(false);
  });

  it("adds Patch 30 to public update history with safe copy", () => {
    const patch30 = patchHistory.find((entry) => entry.patch === 30);

    expect(patch30).toBeDefined();
    expect(patch30?.title).toBe("Install DoughTools / Add to Home Screen");
    expect(patch30?.summary).toContain("install");
    expect(patch30?.highlights.join(" ")).toContain("Supported browsers can use the browser install prompt");
    expect(patch30?.details.join(" ")).toContain("homepage and account page");
    expect(patch30?.technicalNote).toContain("did not change dough formulas");
    expect(patch30?.technicalNote).toContain("SEO indexing permissions");
  });
});
