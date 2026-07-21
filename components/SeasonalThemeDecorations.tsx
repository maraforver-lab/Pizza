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

function EasterGraphics() {
  return (
    <>
      <svg className="seasonal-theme-decoration__spring-leaf seasonal-theme-decoration__spring-leaf--primary" viewBox="0 0 180 220" focusable="false">
        <path d="M87 207C49 164 25 121 15 76c34 8 64 26 90 55 24 26 42 57 55 92-23-9-47-14-73-16Z" />
        <path d="M87 207c-1-46 5-91 18-137" />
        <path d="M91 172c-20-11-38-25-54-43" />
        <path d="M101 142c-17-9-32-21-45-35" />
      </svg>
      <svg className="seasonal-theme-decoration__spring-leaf seasonal-theme-decoration__spring-leaf--secondary" viewBox="0 0 150 180" focusable="false">
        <path d="M71 166C39 134 19 99 10 63c28 6 54 20 76 42 20 21 35 46 46 75-20-8-40-12-61-14Z" />
        <path d="M71 166c2-35 9-70 21-105" />
      </svg>
      <span className="seasonal-theme-decoration__easter-oval seasonal-theme-decoration__easter-oval--primary" />
      <span className="seasonal-theme-decoration__easter-oval seasonal-theme-decoration__easter-oval--secondary" />
    </>
  );
}

function HarvestGraphics() {
  return (
    <>
      <svg className="seasonal-theme-decoration__grain seasonal-theme-decoration__grain--primary" viewBox="0 0 170 260" focusable="false">
        <path d="M85 244V34" />
        <path d="M85 72c-28 4-45 18-50 42 25-2 42-16 50-42Z" />
        <path d="M86 104c31 5 50 22 55 50-30-3-48-20-55-50Z" />
        <path d="M85 136c-31 4-51 21-58 49 30-2 49-19 58-49Z" />
        <path d="M86 168c28 6 45 23 50 49-27-5-43-22-50-49Z" />
      </svg>
      <svg className="seasonal-theme-decoration__grain seasonal-theme-decoration__grain--secondary" viewBox="0 0 140 220" focusable="false">
        <path d="M70 205V28" />
        <path d="M70 66c-22 4-36 15-41 35 22-2 35-14 41-35Z" />
        <path d="M71 96c24 4 39 17 43 39-24-2-38-16-43-39Z" />
        <path d="M70 128c-24 4-39 17-44 39 24-2 38-16 44-39Z" />
      </svg>
      <span className="seasonal-theme-decoration__seed seasonal-theme-decoration__seed--one" />
      <span className="seasonal-theme-decoration__seed seasonal-theme-decoration__seed--two" />
      <span className="seasonal-theme-decoration__flour-dust" />
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
      <EasterGraphics />
      <HarvestGraphics />
    </div>
  );
}
