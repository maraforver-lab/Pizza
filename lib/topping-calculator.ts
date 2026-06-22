import type { OvenType, PizzaStyleId } from "@/lib/saved-recipes";

export type CheeseType = "fior-di-latte" | "buffalo" | "low-moisture" | "none";
export type ToppingId = "mushroom" | "onion" | "pepper" | "zucchini" | "spinach" | "fresh-tomato" | "pineapple" | "pepperoni" | "sausage" | "olives" | "basil";

export type ToppingProfile = {
  id: ToppingId;
  icon: string;
  nameFi: string;
  nameEn: string;
  defaultGrams: number;
  moisture: 0 | 1 | 2 | 3;
  prepFi: string;
  prepEn: string;
  whyFi: string;
  whyEn: string;
  mistakeFi: string;
  mistakeEn: string;
};

export const toppingProfiles: ToppingProfile[] = [
  { id: "mushroom", icon: "🍄", nameFi: "Sienet", nameEn: "Mushrooms", defaultGrams: 35, moisture: 3, prepFi: "Viipaloi ohuesti. Paista kuumalla kuivalla pannulla, kunnes irronnut neste haihtuu. Jäähdytä täysin.", prepEn: "Slice thinly. Cook in a hot dry pan until the released liquid evaporates. Cool completely.", whyFi: "Sieni luovuttaa vettä nopeammin kuin lyhyessä paistossa ehtii haihtua.", whyEn: "Mushrooms release water faster than a short pizza bake can evaporate it.", mistakeFi: "Paksut raa'at viipaleet ja liian täysi pinta tekevät keskustasta märän.", mistakeEn: "Thick raw slices and a crowded surface make the centre wet." },
  { id: "onion", icon: "🧅", nameFi: "Sipuli", nameEn: "Onion", defaultGrams: 20, moisture: 1, prepFi: "Leikkaa läpikuultavan ohueksi. Paksut palat kannattaa pehmentää pannulla ja jäähdyttää.", prepEn: "Slice paper-thin. Soften thick pieces in a pan and cool them first.", whyFi: "Ohut sipuli kypsyy pizzan tahdissa; paksu jää raa'aksi ja teräväksi.", whyEn: "Thin onion cooks with the pizza; thick pieces remain raw and harsh.", mistakeFi: "Paksu sipulikerros estää myös alla olevaa juustoa kuivumasta.", mistakeEn: "A thick onion layer also traps moisture over the cheese." },
  { id: "pepper", icon: "🫑", nameFi: "Paprika", nameEn: "Sweet pepper", defaultGrams: 30, moisture: 2, prepFi: "Suikaloi hyvin ohueksi. Sähköuunissa paahda tai kuullota paksut palat ensin ja jäähdytä.", prepEn: "Slice very thinly. For an electric oven, roast or sauté thick pieces first and cool.", whyFi: "Esikypsennys poistaa vettä ja makeuttaa paprikan ennen pidempää paistoa.", whyEn: "Pre-cooking removes water and sweetens the pepper before a longer bake.", mistakeFi: "Märkä, paksu paprika höyrystää täytteet kypsentämisen sijaan.", mistakeEn: "Wet, thick pepper steams the toppings instead of roasting them." },
  { id: "zucchini", icon: "🥒", nameFi: "Kesäkurpitsa", nameEn: "Courgette", defaultGrams: 30, moisture: 3, prepFi: "Viipaloi ohuesti, suolaa 15–20 min ja taputtele kuivaksi — tai grillaa nopeasti. Jäähdytä.", prepEn: "Slice thinly, salt for 15–20 min and blot dry — or grill briefly. Cool.", whyFi: "Suola vetää pintavettä ulos ennen kuin se päätyy pizzalle.", whyEn: "Salt draws surface moisture out before it reaches the pizza.", mistakeFi: "Älä kasaa raakaa kesäkurpitsaa; se päästää paljon vettä.", mistakeEn: "Do not pile on raw courgette; it releases a lot of water." },
  { id: "spinach", icon: "🌿", nameFi: "Pinaatti", nameEn: "Spinach", defaultGrams: 20, moisture: 3, prepFi: "Ryöppää tai kuullota, jäähdytä ja purista vesi pois. Irrottele pieniksi kasoiksi.", prepEn: "Wilt or sauté, cool and squeeze out the water. Separate into small tufts.", whyFi: "Pinaatin tilavuudesta ja vedestä suuri osa katoaa kuumennuksessa.", whyEn: "Much of spinach's volume and water disappears when heated.", mistakeFi: "Märkä pinaattipaakku tekee paikallisen lätäkön ja sitkeän pohjan.", mistakeEn: "A wet clump creates a local puddle and a leathery base." },
  { id: "fresh-tomato", icon: "🍅", nameFi: "Tuore tomaatti", nameEn: "Fresh tomato", defaultGrams: 35, moisture: 3, prepFi: "Poista vetinen siemenosa, suolaa kevyesti siivilässä ja kuivaa pinta. Käytä vain vähän.", prepEn: "Remove the watery seed pulp, salt lightly in a sieve and blot the surface. Use sparingly.", whyFi: "Kastikkeen lisäksi lisätty tomaatti kaksinkertaistaa helposti veden keskustassa.", whyEn: "Tomato added on top of sauce can easily double the water in the centre.", mistakeFi: "Älä lisää märkiä viipaleita suoraan kastikkeen ja tuoreen mozzarellan päälle.", mistakeEn: "Do not place wet slices directly over sauce and fresh mozzarella." },
  { id: "pineapple", icon: "🍍", nameFi: "Ananas", nameEn: "Pineapple", defaultGrams: 35, moisture: 3, prepFi: "Valuta siivilässä, purista kevyesti ja taputtele palat paperilla kuiviksi.", prepEn: "Drain in a sieve, press gently and blot the pieces dry with paper.", whyFi: "Säilykeliemi ei ehdi haihtua pizzan paistoajassa.", whyEn: "Packing juice cannot evaporate during a pizza bake.", mistakeFi: "Suoraan purkista nostettu ananas tuo pizzalle myös ylimääräisen liemen.", mistakeEn: "Pineapple straight from the tin carries excess packing liquid." },
  { id: "pepperoni", icon: "🔴", nameFi: "Pepperoni", nameEn: "Pepperoni", defaultGrams: 35, moisture: 0, prepFi: "Levitä yhteen kerrokseen. Jos tuote on hyvin rasvainen, käytä vähemmän tai valuta paiston jälkeen hetki ritilällä.", prepEn: "Spread in one layer. If very fatty, use less or rest the baked pizza briefly on a rack.", whyFi: "Rasva on makua, mutta liian paksu kerros peittää kastikkeen ja pehmentää pohjaa.", whyEn: "Fat carries flavour, but too much masks the sauce and softens the base.", mistakeFi: "Reunasta reunaan ladottu kerros tekee pizzasta raskaan ja rasvaisen.", mistakeEn: "An edge-to-edge layer makes the pizza heavy and greasy." },
  { id: "sausage", icon: "🥩", nameFi: "Raakamakkara tai jauheliha", nameEn: "Raw sausage or minced meat", defaultGrams: 45, moisture: 1, prepFi: "Kypsennä muruna täysin kypsäksi, valuta ylimääräinen rasva ja jäähdytä ennen pizzaa.", prepEn: "Cook crumbled meat through, drain excess fat and cool before topping.", whyFi: "Esikypsennys varmistaa turvallisuuden ja hallitsee nesteen sekä rasvan määrää.", whyEn: "Pre-cooking ensures safety and controls moisture and fat.", mistakeFi: "Älä luota siihen, että paksut raa'at palat kypsyvät pizzan lyhyessä paistossa.", mistakeEn: "Do not assume thick raw pieces will cook through during a short bake." },
  { id: "olives", icon: "🫒", nameFi: "Oliivit", nameEn: "Olives", defaultGrams: 20, moisture: 2, prepFi: "Valuta ja taputtele pinta kuivaksi. Viipaloi, jotta suola ja maku jakautuvat tasaisesti.", prepEn: "Drain and blot dry. Slice so salt and flavour are distributed evenly.", whyFi: "Suolaliemi lisää kosteutta ja voi nostaa pizzan suolaisuuden liian korkeaksi.", whyEn: "Brine adds moisture and can make the whole pizza too salty.", mistakeFi: "Älä kaada suolaliemisiä oliiveja suoraan purkista pizzalle.", mistakeEn: "Do not add brine-wet olives straight from the jar." },
  { id: "basil", icon: "🌱", nameFi: "Basilika", nameEn: "Basil", defaultGrams: 3, moisture: 0, prepFi: "Kuivaa pestyt lehdet. Lisää napolilaiseen ennen paistoa tai sähköuunipizzaan mieluiten paiston jälkeen.", prepEn: "Dry washed leaves. Add before a Neapolitan bake or preferably after a longer electric-oven bake.", whyFi: "Pitkä paisto tummentaa herkät lehdet ja hävittää tuoksua.", whyEn: "A long bake darkens delicate leaves and drives off their aroma.", mistakeFi: "Märät lehdet ja pitkä paisto eivät anna raikasta basilikan makua.", mistakeEn: "Wet leaves and a long bake do not deliver fresh basil flavour." },
];

const styleDefaults: Record<PizzaStyleId, { cheese: CheeseType; cheeseGrams: number; sauceGrams: number; loadRatio: number }> = {
  neapolitan: { cheese: "fior-di-latte", cheeseGrams: 80, sauceGrams: 75, loadRatio: .82 },
  contemporary: { cheese: "fior-di-latte", cheeseGrams: 80, sauceGrams: 75, loadRatio: .78 },
  "new-york": { cheese: "low-moisture", cheeseGrams: 110, sauceGrams: 85, loadRatio: .95 },
  "roman-thin": { cheese: "low-moisture", cheeseGrams: 75, sauceGrams: 65, loadRatio: .75 },
  detroit: { cheese: "low-moisture", cheeseGrams: 180, sauceGrams: 120, loadRatio: .85 },
  sicilian: { cheese: "low-moisture", cheeseGrams: 170, sauceGrams: 120, loadRatio: .85 },
};

export function toppingDefaults(style: PizzaStyleId) { return styleDefaults[style]; }

export function calculateToppingLoad(input: { style: PizzaStyleId; oven: OvenType; ballWeight: number; sauceGrams: number; cheeseType: CheeseType; cheeseGrams: number; toppings: Partial<Record<ToppingId, number>> }) {
  const toppingGrams = Object.values(input.toppings).reduce((sum, grams) => sum + (grams ?? 0), 0);
  const total = input.sauceGrams + (input.cheeseType === "none" ? 0 : input.cheeseGrams) + toppingGrams;
  const recommended = Math.round(input.ballWeight * styleDefaults[input.style].loadRatio);
  const percent = Math.round(total / recommended * 100);
  const moisturePoints = toppingProfiles.reduce((sum, profile) => sum + (input.toppings[profile.id] ? profile.moisture * Math.min(2, (input.toppings[profile.id] ?? 0) / profile.defaultGrams) : 0), 0)
    + (input.cheeseType === "buffalo" ? 4 : input.cheeseType === "fior-di-latte" ? 2.5 : 0)
    + (input.oven === "home" ? 1 : 0);
  return {
    total,
    toppingGrams,
    recommended,
    percent,
    load: percent > 105 ? "heavy" as const : percent < 60 ? "light" as const : "balanced" as const,
    moisture: moisturePoints >= 7 ? "high" as const : moisturePoints >= 3.5 ? "medium" as const : "low" as const,
  };
}

