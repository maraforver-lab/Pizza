import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const source = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("legacy /start redirect", () => {
  it("keeps the legacy route as a server-side redirect to the Pizza Session start form", () => {
    const pagePath = join(process.cwd(), "app", "start", "page.tsx");
    const pageSource = source("app/start/page.tsx");

    expect(existsSync(pagePath)).toBe(true);
    expect(pageSource).toContain('import { permanentRedirect } from "next/navigation"');
    expect(pageSource).toContain('permanentRedirect("/session/start")');
    expect(pageSource).not.toContain('"use client"');
    expect(pageSource).not.toContain("useEffect");
    expect(pageSource).not.toContain("router.push");
  });

  it("removes the old Start Here beta UI and route-specific data", () => {
    const pageSource = source("app/start/page.tsx");

    expect(existsSync(join(process.cwd(), "app", "start", "layout.tsx"))).toBe(false);
    expect(existsSync(join(process.cwd(), "lib", "start-here.ts"))).toBe(false);
    expect(pageSource).not.toContain("Start Here");
    expect(pageSource).not.toContain("Make your first good pizza without guessing every setting");
    expect(pageSource).not.toContain("ExperienceLevelSelector");
    expect(pageSource).not.toContain("startHerePaths");
    expect(pageSource).not.toContain("SiteFooter");
  });

  it("points normal internal planning links at /session/start instead of /start", () => {
    const homepage = source("lib/homepage.ts");
    const navigation = source("lib/navigation.ts");
    const footer = source("components/SiteFooter.tsx");

    expect(homepage).toContain('href: "/session/start"');
    expect(navigation).toContain('href: "/session/start"');
    expect(footer).toContain('href: "/session/start"');
    expect([homepage, navigation, footer].join("\n")).not.toContain('href: "/start"');
    expect([homepage, navigation, footer].join("\n")).not.toContain('href="/start"');
  });
});
