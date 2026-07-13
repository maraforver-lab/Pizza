import { EditorialLearningHero } from "@/components/page-hero/PageHeroSystem";

export default function PizzaStyleHero() {
  return (
    <EditorialLearningHero
      actions={[
        { href: "#style-gallery", label: "Compare pizza styles" },
        { href: "#planner-support", label: "See what DoughTools supports", variant: "secondary" },
      ]}
      body="Explore realistic examples and compare crust, structure, sauce, cheese, heat and baking method without treating every pizza as a variation of the same recipe."
      eyebrow="Pizza Style Atlas"
      icon="pizza"
      title="Why every pizza style behaves differently."
    />
  );
}
