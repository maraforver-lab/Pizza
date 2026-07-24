"use client";

import { useEffect, useState } from "react";
import { cx } from "@/components/design-system";
import { DoughToolsIcon } from "@/components/icons";
import {
  EXPERIENCE_LEVELS,
  getExperienceLevelCornerAccentStyle,
} from "@/lib/experience-levels";
import { selectPracticalTipLevelGuidance, type PracticalTipLevelGuidanceItem } from "@/lib/practical-tips-guidance";

function LevelGuidanceCard({ item }: { item: PracticalTipLevelGuidanceItem }) {
  const level = EXPERIENCE_LEVELS.find((candidate) => candidate.id === item.level) ?? EXPERIENCE_LEVELS[0];

  return (
    <article
      className={cx("rounded-[1.5rem] border p-5 shadow-soft", level.cardClassName)}
      style={getExperienceLevelCornerAccentStyle(level.id)}
      data-practical-tip-selected-level={item.level}
    >
      <p className="text-xs font-extrabold uppercase tracking-[.18em] text-ink/45">{level.label}</p>
      <h3 className="mt-3 font-display text-2xl font-semibold text-ink">{item.title}</h3>
      <p className="mt-3 text-sm font-bold leading-6 text-ink/66">{item.intro}</p>
      <ul className="mt-4 grid gap-3 text-sm leading-6 text-ink/66">
        {item.steps.map((step) => (
          <li key={step} className="flex gap-2">
            <DoughToolsIcon name="success" size={16} className="mt-1 shrink-0 text-leaf" />
            <span>{step}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export function PracticalTipsLevelGuidance({
  ariaLabel,
  items,
}: {
  ariaLabel: string;
  items: readonly PracticalTipLevelGuidanceItem[];
}) {
  const [selectedItem, setSelectedItem] = useState<PracticalTipLevelGuidanceItem | null>(null);

  useEffect(() => {
    setSelectedItem(selectPracticalTipLevelGuidance(items));
  }, [items]);

  if (!selectedItem) {
    return <div className="grid gap-4" aria-label={ariaLabel} data-practical-tip-level-guidance />;
  }

  return (
    <div
      className="grid gap-4"
      aria-label={ariaLabel}
      data-practical-tip-level-guidance
      data-selected-level={selectedItem.level}
    >
      <LevelGuidanceCard item={selectedItem} />
    </div>
  );
}
