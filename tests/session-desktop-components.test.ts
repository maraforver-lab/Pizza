import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

describe("Pizza Session desktop refinement components", () => {
  it("adds a shared SessionStepHero for V2 step context", () => {
    const component = source("components/session/SessionStepHero.tsx");

    expect(component).toContain("export function SessionStepHero");
    expect(component).toContain("Step {step} of 10");
    expect(component).toContain("{label}");
    expect(component).toContain("{pageType}");
    expect(component).toContain("{title}");
    expect(component).toContain("{body}");
    expect(component).toContain("desktopAside");
    expect(component).toContain("hideMeta");
    expect(component).toContain("!hideMeta");
    expect(component).toContain("const showMetaRow = !hideMeta || Boolean(level)");
    expect(component).toContain("SessionExperienceLevelBadge");
    expect(component).toContain("getExperienceLevelCornerAccentStyle");
    expect(component).toContain("const levelAccent = level ? getExperienceLevelCornerAccentStyle(level) : undefined");
    expect(component).not.toContain("GuidanceModeBadge");
    expect(component).not.toContain("Pizza Session V2");
  });

  it("adds a passive local-only note that is not rendered as a button", () => {
    const component = source("components/session/SessionLocalOnlyNote.tsx");

    expect(component).toContain("export function SessionLocalOnlyNote");
    expect(component).toContain("children");
    expect(component).toContain("hidden rounded-2xl");
    expect(component).toContain("sm:block");
    expect(component).not.toContain("<button");
    expect(component).not.toContain("role=\"button\"");
  });

  it("adds a shared viewport reset for session route and step openings", () => {
    const component = source("components/session/SessionViewportReset.tsx");
    const emptyState = source("components/session/SessionEmptyState.tsx");
    const routeState = source("components/session/SessionRouteState.tsx");

    expect(component).toContain("export function SessionViewportReset");
    expect(component).toContain("usePathname");
    expect(component).toContain("useSearchParams");
    expect(component).toContain("const routeKey = `${pathname}?${searchParams.toString()}`");
    expect(component).toContain("watchKey");
    expect(component).toContain('window.history.scrollRestoration = "manual"');
    expect(component).toContain("window.scrollTo({ top: 0, left: 0, behavior: \"auto\" })");
    expect(component).toContain("document.scrollingElement?.scrollTo({ top: 0, left: 0, behavior: \"auto\" })");
    expect(component).toContain("window.requestAnimationFrame(reset)");
    expect(component).toContain("}, [routeKey, watchKey])");
    expect(component).not.toContain("}, [pathname, watchKey])");
    expect(emptyState).toContain("SessionRouteState");
    expect(routeState).toContain("SessionViewportReset");
  });

  it("uses one shared downstream route state model without guarding /session/start", () => {
    const routeState = source("components/session/SessionRouteState.tsx");
    const startPage = source("app/session/start/page.tsx");
    const downstreamPages = [
      "app/session/recipe/page.tsx",
      "app/session/shopping/page.tsx",
      "app/session/timeline/page.tsx",
      "app/session/kitchen/page.tsx",
      "app/session/review/page.tsx",
    ].map(source).join("\n");

    expect(routeState).toContain("SESSION_ROUTE_STATE_KINDS");
    expect(routeState).toContain("\"checking\"");
    expect(routeState).toContain("\"active\"");
    expect(routeState).toContain("\"no-session\"");
    expect(routeState).toContain("\"recoverable\"");
    expect(routeState).toContain("\"error\"");
    expect(routeState).toContain("\"step-unavailable\"");
    expect(routeState).toContain("role={isChecking ? \"status\" : isError ? \"alert\" : undefined}");
    expect(routeState).toContain("aria-live={isChecking ? \"polite\" : undefined}");
    expect(routeState).toContain("secondaryAction.href !== action?.href");
    expect(downstreamPages).toContain("variant=\"checking\"");
    expect(downstreamPages).toContain("variant=\"no-session\"");
    expect(downstreamPages).toContain("variant=\"step-unavailable\"");
    expect(downstreamPages).toContain("variant=\"error\"");
    expect(startPage).not.toContain("SessionRouteState");
    expect(startPage).toContain("createPlanningDraftSession");
    expect(startPage).toContain("Create my pizza plan");
  });

  it("keeps Pizza Session viewport reset mounted across route-query step variants", () => {
    const startPage = source("app/session/start/page.tsx");
    const kitchenPage = source("app/session/kitchen/page.tsx");
    const sidebar = source("components/session/SessionProgressSidebar.tsx");

    expect(startPage).toContain("<SessionViewportReset watchKey={step} />");
    expect(kitchenPage).toContain("<SessionViewportReset />");
    expect(kitchenPage).toContain("new URLSearchParams(window.location.search).get(\"from\")");
    expect(sidebar).toContain('href: "/session/kitchen"');
  });

  it("uses the shared desktop step hero on planning/reference steps and keeps Kitchen Mode focused", () => {
    const pages = [
      "app/session/recipe/page.tsx",
      "app/session/timeline/page.tsx",
      "app/session/shopping/page.tsx",
      "app/session/review/page.tsx",
    ];

    for (const pagePath of pages) {
      const page = source(pagePath);
      expect(page).toContain("SessionStepHero");
      expect(page).toContain("level={session.experienceLevel}");
      expect(page).toContain("SessionViewportReset");
    }

    const kitchenPage = source("app/session/kitchen/page.tsx");
    expect(kitchenPage).not.toContain("SessionStepHero");
    expect(kitchenPage).toContain("SessionWorkspaceLayout");
    expect(kitchenPage).toContain("SessionViewportReset");
    expect(kitchenPage).toContain("hideLocalSaveNote");
    expect(source("app/session/timeline/page.tsx")).toContain("<SessionWorkspaceLayout activeStep={8} hideLocalSaveNote>");
    expect(kitchenPage).toContain("<h1 id=\"current-kitchen-task\"");
  });

  it("adds persistent desktop session progress sidebar to steps 6 through 10", () => {
    const sidebar = source("components/session/SessionProgressSidebar.tsx");
    const layout = source("components/session/SessionWorkspaceLayout.tsx");
    const pages = [
      ["app/session/recipe/page.tsx", "activeStep={6}"],
      ["app/session/shopping/page.tsx", "activeStep={7}"],
      ["app/session/timeline/page.tsx", "activeStep={8}"],
      ["app/session/kitchen/page.tsx", "activeStep={9}"],
      ["app/session/review/page.tsx", "activeStep={10}"],
    ];

    expect(sidebar).toContain("export function SessionProgressSidebar");
    expect(sidebar).toContain('import Link from "next/link"');
    expect(sidebar).toContain("Pizza Session journey");
    expect(sidebar).toContain("hidden rounded-[1.75rem]");
    expect(sidebar).toContain("lg:block");
    expect(sidebar).toContain('href: "/session/start?step=path"');
    expect(sidebar).toContain('href: "/session/start?step=preset"');
    expect(sidebar).toContain('href: "/session/start?step=time"');
    expect(sidebar).toContain('href: "/session/start?step=quantity"');
    expect(sidebar).toContain('href: "/session/start?step=flour"');
    expect(sidebar).toContain('href: "/session/recipe"');
    expect(sidebar).toContain('href: "/session/shopping"');
    expect(sidebar).toContain('href: "/session/timeline"');
    expect(sidebar).toContain('href: "/session/kitchen"');
    expect(sidebar).toContain('href: "/session/review"');
    expect(sidebar).toContain('const canNavigate = state === "complete"');
    expect(sidebar).toContain("{canNavigate ? (");
    expect(sidebar).toContain('aria-label={`Go to ${item.label}`}');
    expect(sidebar).toContain("focus-visible:ring-2");
    expect(sidebar).toContain("cursor-pointer transition hover:bg-leaf/15");
    expect(sidebar).toContain("cursor-default select-none");
    expect(sidebar).toContain('aria-disabled={state === "upcoming" ? true : undefined}');
    expect(sidebar).toContain("Current journey step");
    expect(sidebar).toContain("Dough Plan");
    expect(sidebar).toContain("Choose pizzas & Shopping");
    expect(sidebar).toContain("Timeline");
    expect(sidebar).toContain("Kitchen Mode");
    expect(sidebar).toContain("Review");
    expect(layout).toContain("export function SessionWorkspaceLayout");
    expect(layout).toContain("SessionProgressSidebar");

    for (const [pagePath, activeStep] of pages) {
      const page = source(pagePath);
      expect(page).toContain("SessionWorkspaceLayout");
      expect(page).toContain(activeStep);
    }
  });

  it("keeps Pizza Session guidance level visible from the active session value", () => {
    const badge = source("components/session/SessionExperienceLevelBadge.tsx");
    const hero = source("components/session/SessionStepHero.tsx");
    const startPage = source("app/session/start/page.tsx");
    const kitchenPage = source("app/session/kitchen/page.tsx");

    expect(badge).toContain("Pizza Session guidance level: ${config.label}");
    expect(badge).toContain("Guidance: {config.label}");
    expect(badge).toContain("data-session-experience-level={config.id}");
    expect(hero).toContain("{level && <SessionExperienceLevelBadge level={level} />}");
    expect(startPage).toContain("<SessionExperienceLevelBadge level={experienceLevel}");
    expect(kitchenPage).toContain("<SessionExperienceLevelBadge level={session.experienceLevel} />");
    expect(kitchenPage).toContain("getKitchenExperienceGuidance(currentStep, session.experienceLevel, session)");
  });
});
