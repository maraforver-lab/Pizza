import { getExperienceLevelConfig } from "@/lib/experience-levels";

type SessionExperienceLevelBadgeProps = {
  level: unknown;
  className?: string;
  compact?: boolean;
};

export function SessionExperienceLevelBadge({ level, className = "", compact = false }: SessionExperienceLevelBadgeProps) {
  const config = getExperienceLevelConfig(level);

  return (
    <span
      className={`inline-flex w-fit items-center gap-2 rounded-full text-xs font-extrabold ring-1 ${compact ? "px-2.5 py-2" : "px-3 py-2"} ${config.badgeClassName} ${className}`}
      aria-label={`Pizza plan guidance level: ${config.label}`}
      data-session-experience-level={config.id}
    >
      <span className={`h-2.5 w-2.5 rounded-full ${config.markerClassName}`} aria-hidden="true" />
      <span className={compact ? "sr-only" : ""}>Guidance: {config.label}</span>
    </span>
  );
}
