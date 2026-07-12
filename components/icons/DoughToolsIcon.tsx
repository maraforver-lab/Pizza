import { doughToolsIconMap, type DoughToolsIconName } from "@/components/icons/icon-map";

export type DoughToolsIconSize = 16 | 20 | 24 | 32;

type DoughToolsIconProps = {
  "aria-label"?: string;
  className?: string;
  name: DoughToolsIconName;
  size?: DoughToolsIconSize;
  strokeWidth?: number;
};

export function DoughToolsIcon({
  "aria-label": ariaLabel,
  className,
  name,
  size = 20,
  strokeWidth = 2,
}: DoughToolsIconProps) {
  const Icon = doughToolsIconMap[name];
  const accessibleProps = ariaLabel
    ? { "aria-label": ariaLabel, role: "img" as const }
    : { "aria-hidden": true as const };

  return (
    <Icon
      {...accessibleProps}
      className={className}
      color="currentColor"
      focusable="false"
      size={size}
      strokeWidth={strokeWidth}
    />
  );
}
