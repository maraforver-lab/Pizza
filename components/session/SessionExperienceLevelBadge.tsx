import { getExperienceLevelConfig } from "@/lib/experience-levels";

type SessionExperienceLevelBadgeProps = {
  level: unknown;
  className?: string;
};

export function SessionExperienceLevelBadge({ level, className = "" }: SessionExperienceLevelBadgeProps) {
  const config = getExperienceLevelConfig(level);

  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-extrabold ring-1 ${config.badgeClassName} ${className}`}
      aria-label={`Pizza Session guidance level: ${config.label}`}
      data-session-experience-level={config.id}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${config.markerClassName}`} aria-hidden="true" />
      Guidance: {config.label}
    </span>
  );
}
