import type { OvenType, PizzaStyleId } from "@/lib/saved-recipes";

export type CheeseType = "fior-di-latte" | "buffalo" | "low-moisture" | "none";
export type DrainState = "undrained" | "under-1h" | "1-3h" | "4-8h" | "overnight";
export type PreparationState = "raw" | "prepared";
export type ToppingId = "mushroom" | "onion" | "pepper" | "zucchini" | "spinach" | "fresh-tomato" | "pineapple" | "pepperoni" | "sausage" | "olives" | "basil" | "prosciutto" | "arugula" | "burrata";
export type PizzaGeometry = { shape: "round"; diameter: number; rim: number } | { shape: "rectangle"; width: number; length: number; rim: number };
export type ToppingSelection = { grams: number; preparation: PreparationState };

export type ToppingProfile = {
  id: ToppingId; icon: string; nameFi: string; nameEn: string; defaultGrams: number;
  moistureRaw: 0 | 1 | 2 | 3; moisturePrepared: 0 | 1 | 2 | 3; fat: 0 | 1 | 2;
  prepRecommended: boolean; stage: "before" | "after";
  prepFi: string; prepEn: string; whyFi: string; whyEn: string; mistakeFi: string; mistakeEn: string;
};

export const toppingProfiles: ToppingProfile[] = [
  { id: "mushroom", icon: "🍄", nameFi: "Sienet", nameEn: "Mushrooms", defaultGrams: 35, moistureRaw: 3, moisturePrepared: 0, fat: 0, prepRecommended: true, stage: "before", prepFi: "Viipaloi ohuesti. Paista kuumalla kuivalla pannulla, kunnes neste haihtuu. Jäähdytä.", prepEn: "Slice thinly. Cook in a hot dry pan until the liquid evaporates. Cool.", whyFi: "Sieni luovuttaa vettä nopeammin kuin lyhyessä paistossa ehtii haihtua.", whyEn: "Mushrooms release water faster than a short bake can evaporate it.", mistakeFi: "Paksut raa'at viipaleet tekevät keskustasta märän.", mistakeEn: "Thick raw slices make the centre wet." },
  { id: "onion", icon: "🧅", nameFi: "Sipuli", nameEn: "Onion", defaultGrams: 20, moistureRaw: 1, moisturePrepared: 0, fat: 0, prepRecommended: false, stage: "before", prepFi: "Leikkaa läpikuultavan ohueksi. Pehmennä paksut tai runsaat palat pannulla.", prepEn: "Slice paper-thin. Soften thick or generous pieces in a pan.", whyFi: "Ohut sipuli kypsyy pizzan tahdissa; paksu jää helposti raa'aksi.", whyEn: "Thin onion cooks with the pizza; thick pieces remain raw.", mistakeFi: "Paksu kerros estää alla olevaa juustoa kuivumasta.", mistakeEn: "A thick layer traps moisture over the cheese." },
  { id: "pepper", icon: "🫑", nameFi: "Paprika", nameEn: "Sweet pepper", defaultGrams: 30, moistureRaw: 2, moisturePrepared: 0, fat: 0, prepRecommended: true, stage: "before", prepFi: "Suikaloi ohuesti. Paahda tai kuullota, jos käytät enemmän kuin vähän. Jäähdytä.", prepEn: "Slice thinly. Roast or sauté if using more than a little. Cool.", whyFi: "Esikypsennys poistaa vettä ja tiivistää makeutta.", whyEn: "Pre-cooking removes water and concentrates sweetness.", mistakeFi: "Märkä, paksu paprika höyrystää täytteet.", mistakeEn: "Wet, thick pepper steams the toppings." },
  { id: "zucchini", icon: "🥒", nameFi: "Kesäkurpitsa", nameEn: "Courgette", defaultGrams: 30, moistureRaw: 3, moisturePrepared: 0, fat: 0, prepRecommended: true, stage: "before", prepFi: "Viipaloi, suolaa 15–20 min ja kuivaa — tai grillaa nopeasti. Jäähdytä.", prepEn: "Slice, salt for 15–20 min and blot — or grill briefly. Cool.", whyFi: "Suola tai grillaus poistaa vettä ennen pizzaa.", whyEn: "Salt or grilling removes water before topping.", mistakeFi: "Älä kasaa raakaa kesäkurpitsaa.", mistakeEn: "Do not pile on raw courgette." },
  { id: "spinach", icon: "🌿", nameFi: "Pinaatti", nameEn: "Spinach", defaultGrams: 20, moistureRaw: 3, moisturePrepared: 0, fat: 0, prepRecommended: true, stage: "before", prepFi: "Kuullota, jäähdytä ja purista vesi pois. Irrottele pieniksi kasoiksi.", prepEn: "Wilt, cool and squeeze out the water. Separate into small tufts.", whyFi: "Pinaatista vapautuu kuumennuksessa paljon vettä.", whyEn: "Spinach releases a great deal of water when heated.", mistakeFi: "Märkä paakku tekee paikallisen lätäkön.", mistakeEn: "A wet clump creates a local puddle." },
  { id: "fresh-tomato", icon: "🍅", nameFi: "Tuore tomaatti", nameEn: "Fresh tomato", defaultGrams: 35, moistureRaw: 3, moisturePrepared: 1, fat: 0, prepRecommended: true, stage: "before", prepFi: "Poista siemenosa, suolaa kevyesti siivilässä ja kuivaa pinta.", prepEn: "Remove the seed pulp, salt lightly in a sieve and blot dry.", whyFi: "Tomaatti lisää kastikkeen päälle uuden vesilähteen.", whyEn: "Tomato adds another water source on top of sauce.", mistakeFi: "Älä lisää märkiä viipaleita kastikkeen ja tuoreen mozzarellan päälle.", mistakeEn: "Do not add wet slices over sauce and fresh mozzarella." },
  { id: "pineapple", icon: "🍍", nameFi: "Ananas", nameEn: "Pineapple", defaultGrams: 35, moistureRaw: 3, moisturePrepared: 1, fat: 0, prepRecommended: true, stage: "before", prepFi: "Valuta, purista kevyesti ja taputtele palat kuiviksi.", prepEn: "Drain, press gently and blot the pieces dry.", whyFi: "Säilykeliemi ei ehdi haihtua paistossa.", whyEn: "Packing juice cannot evaporate during the bake.", mistakeFi: "Suoraan purkista nostettu ananas tuo ylimääräisen liemen.", mistakeEn: "Pineapple straight from the tin carries excess liquid." },
  { id: "pepperoni", icon: "🔴", nameFi: "Pepperoni", nameEn: "Pepperoni", defaultGrams: 35, moistureRaw: 0, moisturePrepared: 0, fat: 2, prepRecommended: false, stage: "before", prepFi: "Levitä yhteen kerrokseen. Käytä hyvin rasvaista tuotetta maltillisesti.", prepEn: "Spread in one layer. Use very fatty pepperoni sparingly.", whyFi: "Rasva on makua, mutta suuri määrä pehmentää pohjaa.", whyEn: "Fat carries flavour, but too much softens the base.", mistakeFi: "Reunasta reunaan ladottu kerros tekee pizzasta raskaan.", mistakeEn: "An edge-to-edge layer makes the pizza heavy." },
  { id: "sausage", icon: "🥩", nameFi: "Raakamakkara tai jauheliha", nameEn: "Raw sausage or minced meat", defaultGrams: 45, moistureRaw: 1, moisturePrepared: 0, fat: 2, prepRecommended: true, stage: "before", prepFi: "Kypsennä muruna täysin kypsäksi, valuta rasva ja jäähdytä.", prepEn: "Cook crumbled meat through, drain the fat and cool.", whyFi: "Esikypsennys varmistaa turvallisuuden sekä hallitsee rasvaa.", whyEn: "Pre-cooking ensures safety and controls fat.", mistakeFi: "Älä luota paksujen raakojen palojen kypsymiseen lyhyessä paistossa.", mistakeEn: "Do not rely on a short bake to cook thick raw pieces." },
  { id: "olives", icon: "🫒", nameFi: "Oliivit", nameEn: "Olives", defaultGrams: 20, moistureRaw: 2, moisturePrepared: 0, fat: 1, prepRecommended: true, stage: "before", prepFi: "Valuta, taputtele kuivaksi ja viipaloi.", prepEn: "Drain, blot dry and slice.", whyFi: "Suolaliemi lisää kosteutta ja suolaisuutta.", whyEn: "Brine adds moisture and saltiness.", mistakeFi: "Älä lisää suolaliemisiä oliiveja suoraan purkista.", mistakeEn: "Do not add brine-wet olives straight from the jar." },
  { id: "basil", icon: "🌱", nameFi: "Basilika", nameEn: "Basil", defaultGrams: 3, moistureRaw: 0, moisturePrepared: 0, fat: 0, prepRecommended: false, stage: "after", prepFi: "Kuivaa lehdet ja lisää sähköuunipizzaan paiston jälkeen. Napolilaisessa lehden voi suojata juustolla.", prepEn: "Dry the leaves and add after an electric-oven bake. On Neapolitan pizza, protect it with cheese.", whyFi: "Pitkä paisto tummentaa lehdet ja hävittää tuoksua.", whyEn: "A long bake darkens the leaves and drives off aroma.", mistakeFi: "Märät lehdet ja pitkä paisto eivät anna raikasta makua.", mistakeEn: "Wet leaves and a long bake do not taste fresh." },
  { id: "prosciutto", icon: "🥓", nameFi: "Prosciutto", nameEn: "Prosciutto", defaultGrams: 30, moistureRaw: 0, moisturePrepared: 0, fat: 1, prepRecommended: false, stage: "after", prepFi: "Revi ohuiksi suikaleiksi ja lisää kuumalle pizzalle paiston jälkeen.", prepEn: "Tear into thin ribbons and add to the hot pizza after baking.", whyFi: "Jälkilämpö pehmentää lihan polttamatta sen herkkää makua.", whyEn: "Residual heat softens it without cooking away its delicate flavour.", mistakeFi: "Pitkä paisto kuivattaa prosciutton kovaksi ja suolaiseksi.", mistakeEn: "A long bake makes prosciutto hard and overly salty." },
  { id: "arugula", icon: "🥬", nameFi: "Rucola", nameEn: "Rocket", defaultGrams: 15, moistureRaw: 0, moisturePrepared: 0, fat: 0, prepRecommended: false, stage: "after", prepFi: "Pese, kuivaa erittäin hyvin ja lisää vasta paiston jälkeen.", prepEn: "Wash, dry thoroughly and add only after baking.", whyFi: "Rucolan raikas pippurisuus säilyy ilman uunipaistoa.", whyEn: "Rocket keeps its fresh peppery character without baking.", mistakeFi: "Märkä tai paistettu rucola nuupahtaa ja voi maistua kitkerältä.", mistakeEn: "Wet or baked rocket wilts and may taste bitter." },
  { id: "burrata", icon: "⚪", nameFi: "Burrata", nameEn: "Burrata", defaultGrams: 60, moistureRaw: 3, moisturePrepared: 1, fat: 2, prepRecommended: true, stage: "after", prepFi: "Valuta, taputtele pinta ja lisää paloina paistetulle pizzalle juuri ennen tarjoilua.", prepEn: "Drain, blot and add in pieces to the baked pizza just before serving.", whyFi: "Erittäin kostea sisus kuuluu viimeistelyksi, ei pohjan päälle paistumaan.", whyEn: "Its very moist centre belongs as a finish, not baking over the base.", mistakeFi: "Uunissa burrata vapauttaa paljon vettä ja menettää rakenteensa.", mistakeEn: "In the oven, burrata releases water and loses its texture." },
];

const styleDefaults: Record<PizzaStyleId, { cheese: CheeseType; cheeseGrams: number; sauceGrams: number; geometry: PizzaGeometry; family: "neapolitan" | "thin" | "pan" }> = {
  neapolitan: { cheese: "fior-di-latte", cheeseGrams: 88, sauceGrams: 75, geometry: { shape: "round", diameter: 32, rim: 2 }, family: "neapolitan" },
  contemporary: { cheese: "fior-di-latte", cheeseGrams: 88, sauceGrams: 75, geometry: { shape: "round", diameter: 32, rim: 2 }, family: "neapolitan" },
  "new-york": { cheese: "low-moisture", cheeseGrams: 158, sauceGrams: 85, geometry: { shape: "round", diameter: 35.5, rim: 1.5 }, family: "thin" },
  "roman-thin": { cheese: "low-moisture", cheeseGrams: 105, sauceGrams: 65, geometry: { shape: "round", diameter: 32, rim: 1.5 }, family: "thin" },
  detroit: { cheese: "low-moisture", cheeseGrams: 175, sauceGrams: 120, geometry: { shape: "rectangle", width: 20, length: 25, rim: 0 }, family: "pan" },
  sicilian: { cheese: "low-moisture", cheeseGrams: 260, sauceGrams: 120, geometry: { shape: "rectangle", width: 30, length: 40, rim: 0 }, family: "pan" },
};

const loadThresholds = { neapolitan: [22, 32, 38], thin: [28, 45, 55], pan: [45, 75, 95] } as const;
const cheeseCoefficients = { neapolitan: { fresh: .11, low: .13 }, thin: { fresh: .14, low: .16 }, pan: { fresh: .30, low: .35 } } as const;

export function toppingDefaults(style: PizzaStyleId) { return styleDefaults[style]; }
export function pizzaArea(geometry: PizzaGeometry) { return geometry.shape === "round" ? Math.PI * (geometry.diameter / 2) ** 2 : geometry.width * geometry.length; }
export function toppingArea(geometry: PizzaGeometry) { return geometry.shape === "round" ? Math.PI * (Math.max(1, geometry.diameter - 2 * geometry.rim) / 2) ** 2 : Math.max(1, geometry.width - 2 * geometry.rim) * Math.max(1, geometry.length - 2 * geometry.rim); }
export function recommendedCheese(style: PizzaStyleId, cheese: CheeseType, geometry: PizzaGeometry) {
  if (cheese === "none") return 0;
  const family = styleDefaults[style].family;
  const kind = cheese === "low-moisture" ? "low" : "fresh";
  return Math.round(pizzaArea(geometry) * cheeseCoefficients[family][kind]);
}

export function calculateToppingLoad(input: { style: PizzaStyleId; oven: OvenType; geometry: PizzaGeometry; sauceGrams: number; cheeseType: CheeseType; cheeseGrams: number; drainState: DrainState; toppings: Partial<Record<ToppingId, ToppingSelection>> }) {
  const selected = toppingProfiles.flatMap(profile => input.toppings[profile.id] ? [{ profile, selection: input.toppings[profile.id]! }] : []);
  const beforeBake = selected.filter(item => item.profile.stage === "before");
  const toppingGrams = selected.reduce((sum, item) => sum + item.selection.grams, 0);
  const preBakeToppingGrams = beforeBake.reduce((sum, item) => sum + item.selection.grams, 0);
  const total = input.sauceGrams + (input.cheeseType === "none" ? 0 : input.cheeseGrams) + preBakeToppingGrams;
  const area = toppingArea(input.geometry);
  const loadPer100 = Math.round(total / area * 1000) / 10;
  const [lightMax, balancedMax, heavyMax] = loadThresholds[styleDefaults[input.style].family];
  const load = loadPer100 < lightMax ? "light" as const : loadPer100 <= balancedMax ? "balanced" as const : loadPer100 <= heavyMax ? "heavy" as const : "overloaded" as const;
  const drainRisk: Record<DrainState, number> = { undrained: 3, "under-1h": 2, "1-3h": 1, "4-8h": 0, overnight: 0 };
  let moisturePoints = input.cheeseType === "fior-di-latte" || input.cheeseType === "buffalo" ? drainRisk[input.drainState] : 0;
  const reasons: string[] = [];
  if ((input.cheeseType === "fior-di-latte" || input.cheeseType === "buffalo") && drainRisk[input.drainState] > 0) reasons.push("cheese-drain");
  if (input.cheeseType === "buffalo") { moisturePoints += 1; reasons.push("buffalo"); }
  if (input.oven === "home" && (input.cheeseType === "fior-di-latte" || input.cheeseType === "buffalo")) { moisturePoints += 1; reasons.push("home-fresh-cheese"); }
  let wetToppings = 0;
  for (const { profile, selection } of beforeBake) {
    const risk = selection.preparation === "prepared" ? profile.moisturePrepared : profile.moistureRaw;
    moisturePoints += risk;
    if (risk >= 2) { wetToppings += 1; reasons.push(`raw-${profile.id}`); }
  }
  if (wetToppings > 2) { moisturePoints += 1; reasons.push("many-wet-toppings"); }
  if (input.toppings["fresh-tomato"] && input.sauceGrams > 0) { moisturePoints += 1; reasons.push("tomato-and-sauce"); }
  const moisture = moisturePoints >= 6 ? "high" as const : moisturePoints >= 3 ? "medium" as const : "low" as const;
  const warnings: string[] = [];
  if ((input.cheeseType === "fior-di-latte" || input.cheeseType === "buffalo") && input.toppings.mushroom?.preparation === "raw") warnings.push("fresh-cheese-raw-mushroom");
  if ((input.cheeseType === "fior-di-latte" || input.cheeseType === "buffalo") && input.sauceGrams > styleDefaults[input.style].sauceGrams * 1.2) warnings.push("fresh-cheese-heavy-sauce");
  if (input.toppings["fresh-tomato"] && input.sauceGrams > 0) warnings.push("tomato-and-sauce");
  if (selected.filter(item => item.profile.stage === "before" && item.selection.grams >= item.profile.defaultGrams * .5).length >= 4) warnings.push("many-main-toppings");
  if ((load === "heavy" || load === "overloaded") && moisture === "high") warnings.push("heavy-and-wet");
  return { total, toppingGrams, preBakeToppingGrams, area, loadPer100, load, loadLimit: balancedMax, moisturePoints, moisture, reasons: [...new Set(reasons)], warnings: [...new Set(warnings)] };
}
