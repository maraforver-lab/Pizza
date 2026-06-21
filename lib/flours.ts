import type { Fermentation, PizzaGoal } from "@/lib/saved-recipes";

export type FlourId = "caputo-classica" | "caputo-pizzeria" | "caputo-nuvola" | "caputo-nuvola-super" | "caputo-cuoco" | "le5-napoletana" | "petra-5037";

export type FlourProfile = {
  id: FlourId;
  brand: string;
  name: string;
  type: string;
  strength: string;
  protein: string;
  hydration: [number, number];
  fermentationHours: [number, number];
  recommendedHydration: number;
  recommendedFermentation: Fermentation;
  styles: PizzaGoal[];
  source: string;
  approximate?: boolean;
};

export const flourProfiles: FlourProfile[] = [
  { id: "caputo-classica", brand: "Caputo", name: "Classica", type: "Tipo 00", strength: "W 220–240", protein: "11.5%", hydration: [55, 63], fermentationHours: [4, 12], recommendedHydration: 60, recommendedFermentation: "6h-room", styles: ["crispy", "balanced"], source: "https://www.mulinocaputo.it/prodotti/classica-5kg/" },
  { id: "caputo-pizzeria", brand: "Caputo", name: "Pizzeria", type: "Tipo 00", strength: "W 260–280", protein: "12.5%", hydration: [60, 68], fermentationHours: [8, 24], recommendedHydration: 64, recommendedFermentation: "12h-room", styles: ["balanced", "crispy"], source: "https://www.mulinocaputo.it/prodotti/pizzeria/" },
  { id: "caputo-nuvola", brand: "Caputo", name: "Nuvola", type: "Tipo 0", strength: "W 270–290", protein: "12.5%", hydration: [65, 72], fermentationHours: [12, 48], recommendedHydration: 68, recommendedFermentation: "24h-cold", styles: ["airy", "pan", "balanced"], source: "https://www.mulinocaputo.it/prodotti/nuvola/" },
  { id: "caputo-nuvola-super", brand: "Caputo", name: "Nuvola Super", type: "Tipo 0", strength: "W 320–340", protein: "13.5%", hydration: [68, 80], fermentationHours: [24, 72], recommendedHydration: 72, recommendedFermentation: "48h-cold", styles: ["airy", "pan"], source: "https://www.mulinocaputo.it/prodotti/nuvola-super-5kg/" },
  { id: "caputo-cuoco", brand: "Caputo", name: "Cuoco / Chef", type: "Tipo 00", strength: "W 300–320", protein: "13%", hydration: [64, 74], fermentationHours: [24, 72], recommendedHydration: 68, recommendedFermentation: "48h-cold", styles: ["balanced", "airy", "pan"], source: "https://www.mulinocaputo.it/" },
  { id: "le5-napoletana", brand: "Le 5 Stagioni", name: "Pizza Napoletana", type: "Tipo 00", strength: "≈ W 300–320", protein: "min. 13%", hydration: [60, 70], fermentationHours: [8, 48], recommendedHydration: 65, recommendedFermentation: "24h-cold", styles: ["balanced", "airy"], source: "https://le5stagioni.com/en/flour/pizza-napoletana/", approximate: true },
  { id: "petra-5037", brand: "Petra", name: "5037", type: "Tipo 0", strength: "≈ W 300–340", protein: "≈ 13%", hydration: [65, 75], fermentationHours: [24, 72], recommendedHydration: 68, recommendedFermentation: "48h-cold", styles: ["balanced", "airy", "pan"], source: "https://www.farinapetra.it/", approximate: true },
];

export const flourIds = flourProfiles.map((flour) => flour.id);

export const flourById = (id: FlourId) => flourProfiles.find((flour) => flour.id === id) ?? flourProfiles[1];
