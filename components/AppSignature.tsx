import Link from "next/link";
import { trustFooterLinks } from "@/lib/trust-pages";

type Props = {
  locale?: "en" | "fi" | "sv";
  dark?: boolean;
};

export default function AppSignature({ locale, dark = false }: Props) {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";
  const buildId = process.env.NEXT_PUBLIC_BUILD_ID ?? "local";
  const updatedAt = process.env.NEXT_PUBLIC_LAST_UPDATED ?? new Date().toISOString();
  const updated = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Europe/Helsinki",
  }).format(new Date(updatedAt));

  return (
    <div className={`text-[11px] ${dark ? "text-white/45" : "text-ink/45"}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <strong className={dark ? "text-white/70" : "text-ink/65"}>Creator Mara Forever</strong>
        <span aria-hidden="true">•</span>
        <span>Version {version}</span>
        <span className="font-mono">build {buildId}</span>
        <span aria-hidden="true">•</span>
        <time dateTime={updatedAt}>Updated {updated}</time>
        <Link href="/updates" className={`rounded-sm font-bold underline underline-offset-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${dark ? "hover:text-white" : "hover:text-tomato"}`}>View updates</Link>
      </div>
      <nav aria-label="DoughTools support links" className="mt-3 flex flex-wrap gap-x-3 gap-y-2">
        {trustFooterLinks.map((item) => (
          <Link key={item.href} href={item.href} className={`rounded-sm font-bold underline-offset-2 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato ${dark ? "hover:text-white" : "hover:text-tomato"}`}>
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
