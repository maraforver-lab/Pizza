"use client";

import { usePathname } from "next/navigation";

type DecorationIntensity = "expressive" | "restrained" | "minimal";

function decorationIntensityForPath(pathname: string): DecorationIntensity {
  if (
    pathname === "/"
    || pathname === "/about"
    || pathname === "/guide"
    || pathname.startsWith("/guide/")
    || pathname.startsWith("/guides/")
  ) {
    return "expressive";
  }

  if (
    pathname === "/privacy"
    || pathname === "/terms"
    || pathname === "/timer"
    || pathname === "/tools/bake-timer"
    || pathname === "/session/kitchen"
  ) {
    return "minimal";
  }

  return "restrained";
}

function SummerGraphics() {
  return (
    <>
      <svg className="seasonal-theme-decoration__summer-leaf seasonal-theme-decoration__summer-leaf--primary" viewBox="0 0 220 260" focusable="false">
        <path d="M111 246C62 194 32 142 22 91 60 97 96 116 128 149c28 29 50 62 66 99-27-4-55-5-83-2Z" />
        <path d="M111 246c-2-58 4-112 18-162" />
        <path d="M114 207c-25-13-47-31-66-54" />
        <path d="M122 177c-22-8-42-20-61-36" />
        <path d="M132 148c-18-8-35-18-50-30" />
      </svg>
      <svg className="seasonal-theme-decoration__summer-leaf seasonal-theme-decoration__summer-leaf--secondary" viewBox="0 0 180 220" focusable="false">
        <path d="M82 207C42 167 18 125 11 82c29 4 58 18 84 42 24 22 43 49 58 81-23-2-47-2-71 2Z" />
        <path d="M82 207c1-45 8-89 22-133" />
      </svg>
      <span className="seasonal-theme-decoration__sun" />
    </>
  );
}
function ValentineGraphics() {
  return (
    <>
      <span className="seasonal-theme-decoration__heart seasonal-theme-decoration__heart--primary" />
      <span className="seasonal-theme-decoration__heart seasonal-theme-decoration__heart--secondary" />
      <span className="seasonal-theme-decoration__soft-dot seasonal-theme-decoration__soft-dot--one" />
      <span className="seasonal-theme-decoration__soft-dot seasonal-theme-decoration__soft-dot--two" />
    </>
  );
}

export function SeasonalThemeDecorations() {
  const pathname = usePathname() ?? "/";
  const intensity = decorationIntensityForPath(pathname);

  return (
    <div
      className="seasonal-theme-decoration"
      data-seasonal-theme-decoration
      data-seasonal-intensity={intensity}
      aria-hidden="true"
    >
      <SummerGraphics />
      <ValentineGraphics />
    </div>
  );
}
