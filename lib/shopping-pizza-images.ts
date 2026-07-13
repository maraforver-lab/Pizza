import type { PizzaSessionPizzaMixType } from "@/lib/pizza-session";

export type ShoppingPizzaImageDisposition = "retain" | "recrop" | "replace" | "remove" | "retain-outside-shopping";

export type ShoppingPizzaImageAudit = {
  disposition: ShoppingPizzaImageDisposition;
  representedPizza: string;
  realismQuality: "strong" | "acceptable" | "weak";
  styleAccuracy: "accurate" | "acceptable" | "inaccurate";
  mobileSuitability: "strong" | "acceptable" | "weak";
  notes: string;
  noPeopleOrHands: true;
};

export type ShoppingPizzaImage = {
  pizzaType: PizzaSessionPizzaMixType;
  src: `/images/shopping/${string}.webp`;
  alt: string;
  width: 1200;
  height: 900;
  objectPosition: string;
  audit: ShoppingPizzaImageAudit;
};

export const shoppingPizzaImages: Record<PizzaSessionPizzaMixType, ShoppingPizzaImage> = {
  margherita: {
    pizzaType: "margherita",
    src: "/images/shopping/pizza-margherita.webp",
    alt: "Margherita pizza with tomato, mozzarella and basil",
    width: 1200,
    height: 900,
    objectPosition: "50% 50%",
    audit: {
      disposition: "retain",
      representedPizza: "Classic tomato, mozzarella, basil and olive oil.",
      realismQuality: "strong",
      styleAccuracy: "accurate",
      mobileSuitability: "strong",
      notes: "Recognizable Margherita with restrained tomato, believable mozzarella distribution, natural basil placement and complete-pizza crop.",
      noPeopleOrHands: true,
    },
  },
  marinara: {
    pizzaType: "marinara",
    src: "/images/shopping/pizza-marinara.webp",
    alt: "Marinara pizza with tomato, garlic and oregano",
    width: 1200,
    height: 900,
    objectPosition: "50% 50%",
    audit: {
      disposition: "retain",
      representedPizza: "Tomato sauce, garlic, oregano and olive oil. No cheese.",
      realismQuality: "strong",
      styleAccuracy: "accurate",
      mobileSuitability: "strong",
      notes: "Clearly cheese-free with garlic and oregano visible; the full pizza remains identifiable in mobile crops.",
      noPeopleOrHands: true,
    },
  },
  diavola: {
    pizzaType: "diavola",
    src: "/images/shopping/pizza-diavola.webp",
    alt: "Diavola pizza with mozzarella and spicy salami",
    width: 1200,
    height: 900,
    objectPosition: "50% 50%",
    audit: {
      disposition: "retain",
      representedPizza: "Tomato sauce, mozzarella, spicy salami and herbs.",
      realismQuality: "acceptable",
      styleAccuracy: "accurate",
      mobileSuitability: "strong",
      notes: "Spicy salami reads immediately; composition is similar to the family but not reused for another pizza identity.",
      noPeopleOrHands: true,
    },
  },
  funghi: {
    pizzaType: "funghi",
    src: "/images/shopping/pizza-funghi.webp",
    alt: "Funghi pizza with mozzarella and roasted mushrooms",
    width: 1200,
    height: 900,
    objectPosition: "50% 50%",
    audit: {
      disposition: "retain",
      representedPizza: "Tomato sauce, mozzarella, mushrooms and olive oil.",
      realismQuality: "strong",
      styleAccuracy: "accurate",
      mobileSuitability: "strong",
      notes: "Mushrooms are varied and physically plausible, with clear topping recognition and a stable 4:3 crop.",
      noPeopleOrHands: true,
    },
  },
  prosciutto: {
    pizzaType: "prosciutto",
    src: "/images/shopping/pizza-prosciutto.webp",
    alt: "Prosciutto pizza with mozzarella, thin cured ham and arugula",
    width: 1200,
    height: 900,
    objectPosition: "50% 50%",
    audit: {
      disposition: "retain",
      representedPizza: "Tomato sauce, mozzarella, prosciutto, basil or arugula.",
      realismQuality: "acceptable",
      styleAccuracy: "accurate",
      mobileSuitability: "strong",
      notes: "Prosciutto appears as thin post-bake cured ham with arugula; folds are credible enough for menu identification.",
      noPeopleOrHands: true,
    },
  },
  "quattro-formaggi": {
    pizzaType: "quattro-formaggi",
    src: "/images/shopping/pizza-quattro-formaggi.webp",
    alt: "Quattro Formaggi pizza with melted cheeses and blue cheese",
    width: 1200,
    height: 900,
    objectPosition: "50% 50%",
    audit: {
      disposition: "retain",
      representedPizza: "Mozzarella, gorgonzola, parmesan and fontina.",
      realismQuality: "strong",
      styleAccuracy: "accurate",
      mobileSuitability: "strong",
      notes: "Cheese-forward white pizza remains distinct from tomato pizzas and matches the four-cheese plan.",
      noPeopleOrHands: true,
    },
  },
};

export const shoppingPizzaImageList = Object.values(shoppingPizzaImages);

export function getShoppingPizzaImage(pizzaType: PizzaSessionPizzaMixType) {
  return shoppingPizzaImages[pizzaType] ?? shoppingPizzaImages.margherita;
}
