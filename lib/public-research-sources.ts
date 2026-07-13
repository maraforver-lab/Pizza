export type PublicResearchSourceCategory = "standard" | "expert-guidance" | "food-safety" | "doughtools-adaptation";

export type PublicResearchSource = {
  category: PublicResearchSourceCategory;
  id: string;
  note: string;
  organization: string;
  title: string;
  url?: string;
};

export const publicPizzaSauceSources: PublicResearchSource[] = [
  {
    category: "standard",
    id: "avpn-regulations",
    note: "Traditional Neapolitan pizza standards and production characteristics.",
    organization: "Associazione Verace Pizza Napoletana",
    title: "AVPN International Regulations",
    url: "https://www.pizzanapoletana.org/public/pdf/Disciplinare-2024-ENG.pdf",
  },
  {
    category: "standard",
    id: "avpn-recipe",
    note: "Traditional Pizza Napoletana preparation guidance and high-heat baking context.",
    organization: "Associazione Verace Pizza Napoletana",
    title: "Pizza Napoletana recipe and preparation guide",
    url: "https://www.pizzanapoletana.org/en/ricetta_pizza_napoletana",
  },
  {
    category: "expert-guidance",
    id: "avpn-marinara",
    note: "Traditional Marinara profile: tomato, oil, garlic and oregano.",
    organization: "Associazione Verace Pizza Napoletana",
    title: "Marinara and her sisters",
    url: "https://www.pizzanapoletana.org/en/web_school/55-marinara_and_her_sisters",
  },
  {
    category: "expert-guidance",
    id: "ooni-marinara",
    note: "Practical home-cook Marinara example using tomato, salt, garlic, oregano and extra-virgin olive oil.",
    organization: "Ooni",
    title: "AVPN Standard Pizza Marinara",
    url: "https://ooni.com/blogs/recipes/avpn-standard-pizza-marinara",
  },
  {
    category: "food-safety",
    id: "usda-leftovers",
    note: "General leftover handling guidance used for conservative storage language.",
    organization: "USDA Food Safety and Inspection Service",
    title: "Leftovers and Food Safety",
    url: "https://www.fsis.usda.gov/food-safety/safe-food-handling-and-preparation/food-safety-basics/leftovers-and-food-safety",
  },
  {
    category: "doughtools-adaptation",
    id: "doughtools-sauce",
    note: "DoughTools labels home-oven cooked sauce, salt ratios and sauce quantities as practical starting points, not universal rules.",
    organization: "DoughTools",
    title: "Practical sauce interpretation",
  },
];

export const publicToppingBalanceSources: PublicResearchSource[] = [
  {
    category: "expert-guidance",
    id: "king-arthur-toppings",
    note: "Topping order, restraint and preparation affect the finished pizza more than simply adding more ingredients.",
    organization: "King Arthur Baking",
    title: "How to add pizza toppings — the right way",
    url: "https://www.kingarthurbaking.com/blog/2024/06/07/add-pizza-toppings",
  },
  {
    category: "expert-guidance",
    id: "gozney-homemade-pizza",
    note: "Too much sauce or cheese can contribute to soggy centers, especially when bake style and heat balance are not considered.",
    organization: "Gozney",
    title: "How To Make Homemade Pizza",
    url: "https://www.gozney.com/blogs/news/how-to-make-homemade-pizza-a-complete-guide",
  },
  {
    category: "expert-guidance",
    id: "serious-eats-mozzarella",
    note: "Low-moisture mozzarella and fresh mozzarella behave differently, especially across short and longer bake styles.",
    organization: "Serious Eats",
    title: "The Pizza Lab: The Best Low-Moisture Mozzarella For Pizzas",
    url: "https://www.seriouseats.com/the-pizza-lab-the-best-low-moisture-mozzarella-for-pizzas",
  },
  {
    category: "doughtools-adaptation",
    id: "doughtools-topping-balance",
    note: "DoughTools uses its existing topping calculator as the baseline and adds visual density guidance as a teaching layer.",
    organization: "DoughTools",
    title: "Topping Balance Lab interpretation",
  },
];
