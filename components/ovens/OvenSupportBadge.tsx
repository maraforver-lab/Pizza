import { DoughToolsIcon } from "@/components/icons";
import type { OvenPlannerSupport } from "@/lib/oven-education";

export default function OvenSupportBadge({
  support,
  note,
}: {
  support: OvenPlannerSupport;
  note: string;
}) {
  const supported = support === "supported";

  return (
    <span
      className={`inline-flex min-h-9 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-extrabold ${
        supported
          ? "border-leaf/25 bg-leaf/10 text-forest"
          : "border-ink/10 bg-white/75 text-ink/60"
      }`}
    >
      <DoughToolsIcon name={supported ? "success" : "information"} size={16} />
      {note}
    </span>
  );
}
