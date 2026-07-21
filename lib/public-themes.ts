export const PUBLIC_THEME_IDS = [
  "default",
  "valentine",
  "easter",
  "summer",
  "harvest",
  "halloween",
  "christmas",
] as const;

export type PublicThemeId = (typeof PUBLIC_THEME_IDS)[number];

export type PublicThemeDefinition = {
  id: PublicThemeId;
  name: string;
  description: string;
  shortDescription: string;
  rootClassName: string;
  themeColor: string;
  previewSwatches: readonly string[];
  designStatus: "foundation" | "final";
};

export type ThemeCampaignStatus = "active" | "scheduled" | "expired" | "disabled";

export type ThemeCampaignSummary = {
  id: string;
  themeId: PublicThemeId;
  enabled: boolean;
  startsAt: string;
  endsAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  status: ThemeCampaignStatus;
};

const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/i;

export const DEFAULT_PUBLIC_THEME_ID: PublicThemeId = "default";

export const PUBLIC_THEME_DEFINITIONS = [
  {
    id: "default",
    name: "Default",
    description: "The year-round DoughTools appearance and fallback for every missing, expired or invalid campaign.",
    shortDescription: "Year-round DoughTools identity.",
    rootClassName: "theme-default",
    themeColor: "#FFF8F1",
    previewSwatches: ["#FFF8F1", "#FFFFFF", "#E94B2E", "#0F3D2E"],
    designStatus: "final",
  },
  {
    id: "valentine",
    name: "Valentine",
    description: "A warm, restrained rose appearance built around sharing pizza without changing DoughTools into a greeting-card experience.",
    shortDescription: "Warm rose cream for shared pizza nights.",
    rootClassName: "theme-valentine",
    themeColor: "#FFF3F1",
    previewSwatches: ["#FFF3F1", "#FFFBFA", "#D94238", "#7A2D2C"],
    designStatus: "final",
  },
  {
    id: "easter",
    name: "Easter",
    description: "A fresh, light spring appearance with broad non-religious oval and leaf cues that keeps DoughTools practical.",
    shortDescription: "Fresh spring warmth with clean green accents.",
    rootClassName: "theme-easter",
    themeColor: "#FFF9DE",
    previewSwatches: ["#FFF9DE", "#FFFDF5", "#5F8F3A", "#E0B84A"],
    designStatus: "final",
  },
  {
    id: "summer",
    name: "Summer",
    description: "A warm Mediterranean terrace appearance with sunlit surfaces, strong outdoor-readable text and restrained tile rhythm.",
    shortDescription: "Sunlit terrace warmth with readable teal accents.",
    rootClassName: "theme-summer",
    themeColor: "#FFF4D8",
    previewSwatches: ["#FFF4D8", "#FFF9EC", "#D88A24", "#126D7A"],
    designStatus: "final",
  },
  {
    id: "harvest",
    name: "Harvest",
    description: "An autumn ingredient-harvest foundation using warm orange, earthy brown and restrained olive.",
    shortDescription: "Warm orange, olive and autumn grain.",
    rootClassName: "theme-harvest",
    themeColor: "#FFF1DF",
    previewSwatches: ["#FFF1DF", "#E8B05F", "#7A4A24", "#6D7A3A"],
    designStatus: "foundation",
  },
  {
    id: "halloween",
    name: "Halloween",
    description: "A darker seasonal foundation with orange, restrained purple and warm charcoal accents.",
    shortDescription: "Dark orange with restrained purple.",
    rootClassName: "theme-halloween",
    themeColor: "#211915",
    previewSwatches: ["#211915", "#F0782A", "#5C3A72", "#FFF3E2"],
    designStatus: "foundation",
  },
  {
    id: "christmas",
    name: "Christmas",
    description: "A festive but quiet foundation using deep red, forest green and warm cream.",
    shortDescription: "Deep red, forest green and warm cream.",
    rootClassName: "theme-christmas",
    themeColor: "#F8F1E6",
    previewSwatches: ["#F8F1E6", "#8F2626", "#0F3D2E", "#E8C98A"],
    designStatus: "foundation",
  },
] as const satisfies readonly PublicThemeDefinition[];

export const PUBLIC_THEME_BY_ID = PUBLIC_THEME_DEFINITIONS.reduce(
  (themes, theme) => ({ ...themes, [theme.id]: theme }),
  {} as Record<PublicThemeId, PublicThemeDefinition>,
);

export function isPublicThemeId(value: unknown): value is PublicThemeId {
  return typeof value === "string" && (PUBLIC_THEME_IDS as readonly string[]).includes(value);
}

export function normalizePublicThemeId(value: unknown): PublicThemeId {
  return isPublicThemeId(value) ? value : DEFAULT_PUBLIC_THEME_ID;
}

export function publicThemeDefinitionFor(value: unknown): PublicThemeDefinition {
  return PUBLIC_THEME_BY_ID[normalizePublicThemeId(value)];
}

export function publicThemeDefinitionIsSafe(theme: PublicThemeDefinition): boolean {
  return (
    PUBLIC_THEME_IDS.includes(theme.id)
    && theme.rootClassName === `theme-${theme.id}`
    && HEX_COLOR_PATTERN.test(theme.themeColor)
    && theme.previewSwatches.every((swatch) => HEX_COLOR_PATTERN.test(swatch))
    && !/<[^>]+>|javascript:|https?:\/\//i.test(JSON.stringify(theme))
  );
}

export function deriveThemeCampaignStatus(
  campaign: Pick<ThemeCampaignSummary, "enabled" | "startsAt" | "endsAt">,
  now: Date = new Date(),
): ThemeCampaignStatus {
  if (!campaign.enabled) return "disabled";

  const startsAt = new Date(campaign.startsAt).getTime();
  const endsAt = campaign.endsAt ? new Date(campaign.endsAt).getTime() : null;
  const nowMs = now.getTime();

  if (Number.isFinite(endsAt) && endsAt !== null && nowMs >= endsAt) return "expired";
  if (Number.isFinite(startsAt) && nowMs < startsAt) return "scheduled";
  return "active";
}

export function normalizeThemeCampaignRow(row: Record<string, unknown>, now: Date = new Date()): ThemeCampaignSummary {
  const campaign = {
    id: String(row.id ?? ""),
    themeId: normalizePublicThemeId(row.theme_id ?? row.themeId),
    enabled: row.enabled !== false,
    startsAt: String(row.starts_at ?? row.startsAt ?? ""),
    endsAt: typeof (row.ends_at ?? row.endsAt) === "string" ? String(row.ends_at ?? row.endsAt) : null,
    version: Number(row.version ?? 1),
    createdAt: String(row.created_at ?? row.createdAt ?? ""),
    updatedAt: String(row.updated_at ?? row.updatedAt ?? ""),
    status: "disabled" as ThemeCampaignStatus,
  };

  return {
    ...campaign,
    status: deriveThemeCampaignStatus(campaign, now),
  };
}
