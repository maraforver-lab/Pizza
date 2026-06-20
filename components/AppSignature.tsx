type Props = {
  locale: "en" | "fi";
  dark?: boolean;
};

export default function AppSignature({ locale, dark = false }: Props) {
  const version = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";
  const updatedAt = process.env.NEXT_PUBLIC_LAST_UPDATED ?? new Date().toISOString();
  const updated = new Intl.DateTimeFormat(locale === "fi" ? "fi-FI" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Helsinki",
  }).format(new Date(updatedAt));

  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] ${dark ? "text-white/45" : "text-ink/45"}`}>
      <strong className={dark ? "text-white/70" : "text-ink/65"}>Creator Mara Forever</strong>
      <span aria-hidden="true">•</span>
      <span>{locale === "fi" ? "Versio" : "Version"} {version}</span>
      <span aria-hidden="true">•</span>
      <time dateTime={updatedAt}>{locale === "fi" ? "Päivitetty" : "Updated"} {updated}</time>
    </div>
  );
}
