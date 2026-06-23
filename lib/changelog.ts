export type ChangeEntry = {
  version: string;
  date: string;
  owner: string;
  href: string;
  fi: string;
  en: string;
};

export const changes: ChangeEntry[] = [
  { version: "1.0.55", date: "2026-06-23", owner: "Mara", href: "/updates", fi: "Uuden ominaisuuden ilmoitus piilotettu väliaikaisesti", en: "New-feature notification temporarily hidden" },
  { version: "1.0.54", date: "2026-06-23", owner: "Mara", href: "/", fi: "Väliaikainen hakukonenäkyvyyden esto ennen julkista lanseerausta", en: "Temporary search indexing block before public launch" },
  { version: "1.0.53", date: "2026-06-23", owner: "Mara", href: "/account", fi: "Käyttäjätili, kirjautumistila ja mobiilikäytön parannuksia", en: "User accounts, sign-in status and mobile usability improvements" },
  { version: "1.0.52", date: "2026-06-23", owner: "Joel", href: "/toppings", fi: "Aidot pizzakuvat täytekuorman pikaoppaaseen", en: "Real pizza photos for the topping-load quick guide" },
  { version: "1.0.51", date: "2026-06-22", owner: "Joel", href: "/toppings", fi: "Täytekuorman visuaalinen pikaopas", en: "Visual topping-load quick guide" },
  { version: "1.0.50", date: "2026-06-22", owner: "Mara", href: "/updates", fi: "Päivityshistoria, sivuston syntytarina ja uusien ominaisuuksien nosto", en: "Update history, the DoughTools story and a new-feature highlight" },
  { version: "1.0.49", date: "2026-06-22", owner: "Mara", href: "/", fi: "Ruotsin kielituki laskuriin ja tärkeimpiin työkaluihin", en: "Swedish support for the calculator and core tools" },
  { version: "1.0.48", date: "2026-06-22", owner: "Mara", href: "/timer", fi: "Tarkistusvalo paistoajastimeen", en: "Inspection light for the bake timer" },
  { version: "1.0.47", date: "2026-06-22", owner: "Mara", href: "/timer", fi: "Puhelimelle suunniteltu pizzan paistoajastin", en: "Mobile-first pizza bake timer" },
  { version: "1.0.46", date: "2026-06-22", owner: "Mara", href: "/toppings", fi: "Ruotsinkielinen juusto- ja täytelaskuri", en: "Swedish cheese and topping calculator" },
  { version: "1.0.45", date: "2026-06-22", owner: "Mara", href: "/toppings", fi: "Älykkäämmät juusto- ja täytesuositukset", en: "Smarter cheese and topping guidance" },
  { version: "1.0.44", date: "2026-06-22", owner: "Mara", href: "/toppings", fi: "Juusto- ja täytelaskuri", en: "Cheese and topping calculator" },
  { version: "1.0.43", date: "2026-06-22", owner: "Mara", href: "/", fi: "Yhtenäinen navigaatio ja ohjattu työnkulku", en: "Unified navigation and guided workflow" },
  { version: "1.0.42", date: "2026-06-22", owner: "Mara", href: "/gear", fi: "Tarkkuusvaaka välttämättömiin pizzavälineisiin", en: "Precision scale added to essential pizza gear" },
  { version: "1.0.41", date: "2026-06-22", owner: "Mara", href: "/", fi: "Kompakti kohotustavan valitsin", en: "Compact leavening selector restored" },
  { version: "1.0.40", date: "2026-06-22", owner: "Mara", href: "/plan", fi: "Valmistuskuvien jatkuvuutta parannettu", en: "Improved visual continuity in the dough guide" },
  { version: "1.0.39", date: "2026-06-22", owner: "Mara", href: "/doctor", fi: "Personoitu diagnoosi ja yhtenäisempi taikinaohje", en: "Personalised diagnosis and a more consistent dough guide" },
  { version: "1.0.38", date: "2026-06-22", owner: "Mara", href: "/", fi: "Kaikkien työkalujen navigaatio", en: "Global tool navigation" },
  { version: "1.0.37", date: "2026-06-22", owner: "Mara", href: "/costs", fi: "Euro- ja dollarivalinta kustannuksiin", en: "EUR and USD cost display" },
  { version: "1.0.36", date: "2026-06-22", owner: "Mara", href: "/sauce", fi: "Pizzakastikkeen historian laajempi aikajana", en: "Expanded pizza-sauce history" },
  { version: "1.0.35", date: "2026-06-22", owner: "Mara", href: "/sauce", fi: "Kuvallinen Sauce Lab -valitsin", en: "Visual Sauce Lab selector" },
  { version: "1.0.34", date: "2026-06-22", owner: "Mara", href: "/sauce", fi: "Marinara ja kastikkeen vianmääritys", en: "Marinara and sauce troubleshooting" },
  { version: "1.0.33", date: "2026-06-22", owner: "Mara", href: "/gear", fi: "Aidot kuvat varusteoppaaseen", en: "Real photos for the gear guide" },
  { version: "1.0.32", date: "2026-06-22", owner: "Mara", href: "/ovens", fi: "Keittiöuuni muutettu sähköuuniksi", en: "Home-oven terminology changed to electric oven" },
  { version: "1.0.31", date: "2026-06-22", owner: "Mara", href: "/styles", fi: "Valittu pizzatyyli säilyy reseptissä", en: "Selected pizza style is preserved in recipes" },
  { version: "1.0.30", date: "2026-06-22", owner: "Mara", href: "/", fi: "Kohotustavan valintaa selkeytetty", en: "Clearer leavening selector" },
  { version: "1.0.29", date: "2026-06-22", owner: "Mara", href: "/", fi: "Pannupizza lukitaan sähköuuniin", en: "Pan pizza recipes locked to an electric oven" },
  { version: "1.0.28", date: "2026-06-22", owner: "Mara", href: "/", fi: "Valitun pizzan kuva jaettavaan reseptikorttiin", en: "Selected pizza photo used in share cards" },
];

export const latestChange = changes[0];
