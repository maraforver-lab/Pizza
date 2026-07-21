"use client";

import { usePathname } from "next/navigation";

type DecorationIntensity = "expressive" | "restrained" | "minimal";

function decorationIntensityForPath(pathname: string): DecorationIntensity {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return "minimal";
  }

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
      <svg className="seasonal-theme-decoration__summer-palm seasonal-theme-decoration__summer-palm--primary" viewBox="0 0 220 240" focusable="false">
        <path d="M104 220c8-66 7-124-3-174" />
        <path d="M101 50C70 25 38 14 8 18c28 22 58 36 92 42Z" />
        <path d="M103 58c-39 2-70 15-93 40 36 4 67-8 93-40Z" />
        <path d="M105 66c-31 19-52 45-64 78 36-8 58-32 64-78Z" />
        <path d="M108 53c25-28 54-43 88-46-19 31-48 47-88 46Z" />
        <path d="M109 62c39 5 70 23 94 54-38 2-70-16-94-54Z" />
        <path d="M109 72c30 21 49 49 58 84-33-12-52-40-58-84Z" />
      </svg>
      <svg className="seasonal-theme-decoration__summer-palm seasonal-theme-decoration__summer-palm--secondary" viewBox="0 0 180 210" focusable="false">
        <path d="M86 196c5-52 2-101-9-146" />
        <path d="M78 54C53 34 27 26 5 31c24 17 48 28 74 32Z" />
        <path d="M81 62C51 66 28 78 10 98c29 1 53-11 71-36Z" />
        <path d="M84 57c21-25 46-38 75-40-16 26-41 40-75 40Z" />
        <path d="M86 65c31 5 56 20 75 44-32 1-57-13-75-44Z" />
      </svg>
      <span className="seasonal-theme-decoration__sun" />
      <span className="seasonal-theme-decoration__lemon" />
    </>
  );
}
function ValentineGraphics() {
  return (
    <>
      <span className="seasonal-theme-decoration__heart seasonal-theme-decoration__heart--primary" />
      <span className="seasonal-theme-decoration__heart seasonal-theme-decoration__heart--secondary" />
      <svg className="seasonal-theme-decoration__cupid-arrow" viewBox="0 0 260 80" focusable="false">
        <path d="M18 58c55-31 116-45 184-42" />
        <path d="m201 16 33 12-29 19" />
        <path d="M35 49 16 28M50 43 31 22" />
      </svg>
    </>
  );
}

function EasterGraphics() {
  return (
    <>
      <svg className="seasonal-theme-decoration__easter-egg seasonal-theme-decoration__easter-egg--primary" viewBox="0 0 130 170" focusable="false">
        <path className="egg-shell" d="M65 158c35 0 55-23 55-58 0-39-28-88-55-88S10 61 10 100c0 35 20 58 55 58Z" />
        <path d="M24 76c14 9 25 9 39 0s25-9 43 0" />
        <path d="M23 102h84" />
        <path d="M33 126c10-8 22-8 32 0s22 8 32 0" />
      </svg>
      <svg className="seasonal-theme-decoration__easter-egg seasonal-theme-decoration__easter-egg--secondary" viewBox="0 0 120 160" focusable="false">
        <path className="egg-shell" d="M60 148c31 0 49-21 49-52 0-36-25-84-49-84S11 60 11 96c0 31 18 52 49 52Z" />
        <path d="M24 72h72" />
        <path d="M27 96c11 8 21 8 32 0s21-8 32 0" />
      </svg>
      <svg className="seasonal-theme-decoration__spring-flower" viewBox="0 0 120 120" focusable="false">
        <path d="M60 61c-12-18-12-34 0-48 12 14 12 30 0 48Z" />
        <path d="M60 61c18-12 34-12 48 0-14 12-30 12-48 0Z" />
        <path d="M60 61c12 18 12 34 0 48-12-14-12-30 0-48Z" />
        <path d="M60 61c-18 12-34 12-48 0 14-12 30-12 48 0Z" />
        <circle cx="60" cy="61" r="10" />
      </svg>
      <span className="seasonal-theme-decoration__bunny-ears" />
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
      <svg className="seasonal-theme-decoration__olive-branch" viewBox="0 0 190 120" focusable="false">
        <path d="M18 97c47-38 96-59 154-75" />
        <path d="M61 71c-20-9-34-8-45 4 18 11 33 10 45-4Z" />
        <path d="M88 56c-8-20-6-34 7-43 9 18 7 32-7 43Z" />
        <path d="M117 45c17-13 31-15 44-5-14 14-29 16-44 5Z" />
        <path d="M136 35c-6-18-3-31 10-39 7 16 4 29-10 39Z" />
      </svg>
      <span className="seasonal-theme-decoration__tomato-detail" />
    </>
  );
}

function HalloweenGraphics() {
  return (
    <>
      <span className="seasonal-theme-decoration__moon" />
      <svg className="seasonal-theme-decoration__web" viewBox="0 0 220 220" focusable="false">
        <path d="M18 18h184v184" />
        <path d="M18 18l184 184" />
        <path d="M18 18c58 8 110 30 154 66" />
        <path d="M18 18c32 48 55 99 69 154" />
        <path d="M57 57c36 5 69 19 97 42" />
        <path d="M57 57c20 30 34 63 43 97" />
        <path d="M95 95c18 3 34 10 48 22" />
        <path d="M95 95c10 15 17 32 21 49" />
      </svg>
      <svg className="seasonal-theme-decoration__bat seasonal-theme-decoration__bat--one" viewBox="0 0 140 70" focusable="false">
        <path d="M70 34c-12-16-30-24-54-24 7 7 9 16 5 27 17-8 32-5 49 10 17-15 32-18 49-10-4-11-2-20 5-27-24 0-42 8-54 24Z" />
      </svg>
      <svg className="seasonal-theme-decoration__bat seasonal-theme-decoration__bat--two" viewBox="0 0 120 60" focusable="false">
        <path d="M60 29C50 16 35 9 14 9c6 6 8 14 4 23 15-7 28-4 42 9 14-13 27-16 42-9-4-9-2-17 4-23-21 0-36 7-46 20Z" />
      </svg>
      <span className="seasonal-theme-decoration__pumpkin seasonal-theme-decoration__pumpkin--primary" />
    </>
  );
}

function ChristmasGraphics() {
  return (
    <>
      <svg className="seasonal-theme-decoration__fir seasonal-theme-decoration__fir--primary" viewBox="0 0 190 250" focusable="false">
        <path d="M96 232V36" />
        <path d="M96 68 52 112h34l-49 50h42l-53 54" />
        <path d="M96 68 140 112h-34l49 50h-42l53 54" />
      </svg>
      <svg className="seasonal-theme-decoration__fir seasonal-theme-decoration__fir--secondary" viewBox="0 0 160 210" focusable="false">
        <path d="M81 196V30" />
        <path d="M81 58 44 95h29l-41 42h35l-45 45" />
        <path d="M81 58 118 95H89l41 42H95l45 45" />
      </svg>
      <span className="seasonal-theme-decoration__star seasonal-theme-decoration__star--primary" />
      <span className="seasonal-theme-decoration__star seasonal-theme-decoration__star--secondary" />
      <span className="seasonal-theme-decoration__ornament seasonal-theme-decoration__ornament--one" />
      <span className="seasonal-theme-decoration__ornament seasonal-theme-decoration__ornament--two" />
      <span className="seasonal-theme-decoration__snowflake" />
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
      <HalloweenGraphics />
      <ChristmasGraphics />
    </div>
  );
}
