import {
  DEFAULT_EXPERIENCE_LEVEL,
  EXPERIENCE_LEVELS,
  normalizeExperienceLevel,
  type ExperienceLevel,
} from "@/lib/experience-levels";

export type SauceQuickAnswer = {
  answer: string;
  bullets: readonly string[];
  level: ExperienceLevel;
  levelLabel: string;
  title: "Which sauce should I use?";
};

export type SauceAmountTeaching = {
  explanation: string;
  level: ExperienceLevel;
  levelLabel: string;
};

const quickAnswerByLevel: Record<ExperienceLevel, Omit<SauceQuickAnswer, "level" | "levelLabel" | "title">> = {
  beginner: {
    answer:
      "Use a simple raw tomato sauce for most pizzas. It is the safest starting point for home pizza and pizza oven baking.",
    bullets: [
      "Choose good canned whole peeled tomatoes.",
      "Crush or blend lightly.",
      "Use a small amount so the pizza does not turn wet.",
    ],
  },
  enthusiast: {
    answer:
      "Raw tomato sauce is the default choice for most pizzas. Use cooked sauce only when you want a thicker, sweeter result or a home-oven style that benefits from lower moisture.",
    bullets: [
      "Raw sauce suits Neapolitan-style and most fast bakes.",
      "Cooked sauce can help when you want a denser, more reduced texture.",
      "The wetter the cheese and toppings, the lighter the sauce should be.",
    ],
  },
  pizza_nerd: {
    answer:
      "Choose sauce style by bake profile and moisture budget. Raw sauce preserves brightness and suits fast, high-heat baking. Cooked sauce trades freshness for reduced water and a denser texture.",
    bullets: [
      "Fast, hot bake: usually raw sauce.",
      "Longer bake or high-moisture topping set: consider a more reduced sauce.",
      "Balance tomato water, cheese moisture, topping load, and bake time together.",
    ],
  },
};

const amountTeachingByLevel: Record<ExperienceLevel, string> = {
  beginner:
    "Start with the recommended amount. It gives clear tomato flavour without making the pizza heavy or wet.",
  enthusiast:
    "Use slightly less sauce with wet mozzarella or moisture-heavy toppings. A longer bake or drier topping set may tolerate slightly more.",
  pizza_nerd:
    "Treat the result as a moisture-budget baseline. Tomato water content, cheese moisture, topping load, bake temperature and bake time determine the final adjustment.",
};

export function getSauceQuickAnswer(level: unknown = DEFAULT_EXPERIENCE_LEVEL): SauceQuickAnswer {
  const normalized = normalizeExperienceLevel(level);
  const config = EXPERIENCE_LEVELS.find((item) => item.id === normalized) ?? EXPERIENCE_LEVELS[0];
  const answer = quickAnswerByLevel[normalized];

  return {
    ...answer,
    level: normalized,
    levelLabel: config.label,
    title: "Which sauce should I use?",
  };
}

export function getSauceAmountTeaching(level: unknown = DEFAULT_EXPERIENCE_LEVEL): SauceAmountTeaching {
  const normalized = normalizeExperienceLevel(level);
  const config = EXPERIENCE_LEVELS.find((item) => item.id === normalized) ?? EXPERIENCE_LEVELS[0];

  return {
    explanation: amountTeachingByLevel[normalized],
    level: normalized,
    levelLabel: config.label,
  };
}
