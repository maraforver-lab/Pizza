"use client";

import { useEffect, useState } from "react";
import ExperienceLevelSelector from "@/components/ExperienceLevelSelector";
import {
  getDefaultExperienceLevel,
  readExperienceLevelPreference,
  type ExperienceLevel,
} from "@/lib/experience-levels";

export default function HomepageGuidanceLevelSection() {
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(getDefaultExperienceLevel());

  useEffect(() => {
    setExperienceLevel(readExperienceLevelPreference());
  }, []);

  return (
    <ExperienceLevelSelector
      value={experienceLevel}
      onChange={setExperienceLevel}
      compact
      title="How much guidance do you want?"
      intro="You can change this anytime."
      className="h-full"
    />
  );
}
