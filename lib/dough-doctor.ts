import type { FlourProfile } from "@/lib/flours";
import type { RecipeSettings } from "@/lib/saved-recipes";

export type DoctorIssueId = "sticky" | "torn" | "tight" | "underproofed" | "overproofed" | "ready";
export type DoctorLocale = "fi" | "en";

export const doctorIssues: { id: DoctorIssueId; image: string }[] = [
  { id: "sticky", image: "/dough-doctor/sticky.webp" },
  { id: "torn", image: "/dough-doctor/torn.webp" },
  { id: "tight", image: "/dough-doctor/tight.webp" },
  { id: "underproofed", image: "/dough-doctor/underproofed.webp" },
  { id: "overproofed", image: "/dough-doctor/overproofed.webp" },
  { id: "ready", image: "/dough-doctor/ready.webp" },
];

export const issueCopy = {
  fi: {
    sticky: ["Liian tahmea", "Taikina leviää ja tarttuu kaikkeen"], torn: ["Taikina repeää", "Pinta tai kalvo rikkoutuu venyttäessä"], tight: ["Taikina vetäytyy", "Pohja kutistuu takaisin pieneksi"], underproofed: ["Taikina ei kohoa", "Pallo pysyy pienenä ja tiukkana"], overproofed: ["Taikina on lässähtänyt", "Pallo leviää ja rakenne on heikko"], ready: ["Onko taikina valmis?", "Vertaa hyvän taikinapallon merkkeihin"],
  },
  en: {
    sticky: ["Too sticky", "The dough spreads and sticks to everything"], torn: ["Dough tears", "The surface or membrane breaks while stretching"], tight: ["Dough snaps back", "The base keeps shrinking smaller"], underproofed: ["Dough will not rise", "The ball remains small and tight"], overproofed: ["Dough has collapsed", "The ball spreads and its structure is weak"], ready: ["Is the dough ready?", "Compare it with the signs of a good dough ball"],
  },
} as const;

export function diagnoseDough(issue: DoctorIssueId, settings: RecipeSettings, flour: FlourProfile, locale: DoctorLocale) {
  const fi = locale === "fi";
  const tooWet = settings.hydration > flour.hydration[1];
  const tooLong = Number(settings.fermentation.match(/^\d+/)?.[0] ?? 0) > flour.fermentationHours[1];
  const cold = settings.fermentation.endsWith("cold");
  const flourName = `${flour.brand} ${flour.name}`;

  const answers = {
    sticky: {
      cause: tooWet
        ? (fi ? `${settings.hydration} % hydraatio ylittää jauhon ${flourName} suositusalueen ${flour.hydration[0]}–${flour.hydration[1]} %. Jauho ei ehkä pysty sitomaan kaikkea vettä.` : `${settings.hydration}% hydration exceeds the suggested ${flour.hydration[0]}–${flour.hydration[1]}% range for ${flourName}. The flour may not hold all that water.`)
        : (fi ? "Sitko voi olla vielä kehittymätön tai taikina liian lämmin. Myös liian lyhyt lepo tekee märästä taikinasta vaikean käsitellä." : "The gluten may still be underdeveloped or the dough too warm. Too little resting also makes wet dough difficult to handle."),
      now: fi ? "Anna taikinan levätä peitettynä 20 minuuttia. Tee kostein käsin 1–2 hellää taittokierrosta. Jos se on hyvin lämmin ja valuva, jäähdytä sitä 20–30 minuuttia." : "Rest it covered for 20 minutes. With wet hands, make 1–2 gentle fold rounds. If it is very warm and flowing, chill it for 20–30 minutes.",
      next: fi ? `Käytä aluksi ${Math.min(settings.hydration, flour.hydration[1])} % hydraatiota tai valitse vahvempi jauho. Lisää viimeinen vesiosa vasta, kun taikinassa on jo sitkoa.` : `Start with ${Math.min(settings.hydration, flour.hydration[1])}% hydration or choose a stronger flour. Add the final portion of water only after the dough has developed strength.`,
    },
    torn: {
      cause: tooLong ? (fi ? "Jauhon sitko on todennäköisesti heikentynyt liian pitkässä fermentaatiossa." : "The flour’s gluten has probably weakened during excessive fermentation.") : (fi ? "Tavallisimmat syyt ovat liian vähäinen vaivaus, liian lyhyt lepo, kylmä taikina tai karkea käsittely." : "The common causes are insufficient kneading, too little rest, cold dough, or rough handling."),
      now: fi ? "Lopeta venyttäminen ja peitä taikina 20–30 minuutiksi. Paikkaa pieni repeämä nipistämällä reunat yhteen ja avaa pizza seuraavaksi hellästi." : "Stop stretching and cover the dough for 20–30 minutes. Pinch a small tear closed and open the pizza gently afterwards.",
      next: fi ? "Kehitä sitko ennen pitkää kohotusta, käsittele palloja hellästi ja varmista, että jauhon vahvuus riittää valitulle ajalle ja hydraatiolle." : "Develop gluten before the long ferment, handle the balls gently, and ensure the flour is strong enough for the selected time and hydration.",
    },
    tight: {
      cause: fi ? "Taikina on yleensä liian kylmä, liian vähän levännyt tai vielä alikohonnut. Vahva jauho lisää palautumista." : "The dough is usually too cold, insufficiently rested, or still underproofed. Strong flour increases spring-back.",
      now: fi ? `Peitä pallo ja anna sen levätä huoneenlämmössä vielä ${cold ? "30–60" : "20–30"} minuuttia. Avaa se kahdessa vaiheessa ilman väkisin venyttämistä.` : `Cover the ball and rest it at room temperature for another ${cold ? "30–60" : "20–30"} minutes. Open it in two stages without forcing it.`,
      next: fi ? "Pidennä pallojen loppukohotusta ja ota kylmäkohotettu taikina aikaisemmin lämpenemään." : "Lengthen the final proof and bring cold-fermented dough out to warm earlier.",
    },
    underproofed: {
      cause: fi ? "Taikina on voinut olla liian kylmä, kohotusaika liian lyhyt tai hiiva heikkoa. Pelkkä kellonaika ei takaa, että taikina on valmis." : "The dough may have been too cold, the fermentation too short, or the yeast weak. Time alone does not guarantee readiness.",
      now: fi ? "Siirrä peitetty taikina 24–26 °C:n paikkaan ja odota. Valmis pallo on ilmavampi, rento ja painauma palautuu hitaasti." : "Move the covered dough to a 24–26°C spot and wait. A ready ball is airier, relaxed, and an indentation returns slowly.",
      next: fi ? "Tarkista hiivan päiväys ja aktiivisuus, mittaa todellinen taikinalämpö ja varaa aikatauluun 1–2 tuntia joustoa." : "Check yeast age and activity, measure actual dough temperature, and leave 1–2 hours of flexibility in the schedule.",
    },
    overproofed: {
      cause: tooLong || tooWet ? (fi ? "Kohotusaika tai hydraatio ylittää valitun jauhon kestokyvyn. Sitko on alkanut hajota." : "The fermentation time or hydration exceeds what this flour can support. The gluten has begun to break down.") : (fi ? "Taikina on todennäköisesti ollut liian pitkään lämpimässä tai hiivaa oli olosuhteisiin nähden liikaa." : "The dough was probably warm for too long or contained too much yeast for the conditions."),
      now: fi ? "Käsittele mahdollisimman vähän. Jäähdytä 20 minuuttia ja paista pian. Jos pallo ei enää pysy koossa, öljytty pannupizza on varmin pelastus." : "Handle it as little as possible. Chill for 20 minutes and bake soon. If the ball no longer holds together, an oiled pan pizza is the safest rescue.",
      next: fi ? "Lyhennä kohotusta, vähennä hiivaa tai käytä vahvempaa jauhoa. Tarkista myös, että jääkaappi on todella noin 4 °C." : "Shorten fermentation, reduce yeast, or use stronger flour. Also verify that the refrigerator is actually around 4°C.",
    },
    ready: {
      cause: fi ? "Hyvä pallo on pehmeästi kupolimainen, pinnaltaan elävä ja hieman kupliva. Se on rento mutta säilyttää vielä muotonsa." : "A good ball is softly domed, lively and slightly bubbly on the surface. It is relaxed but still holds its shape.",
      now: fi ? "Paina pintaa kevyesti jauhotetulla sormella. Hitaasti ja osittain palautuva painauma on hyvä merkki. Avaa taikina hellästi keskeltä ulospäin." : "Press the surface lightly with a floured finger. An indentation that returns slowly and partially is a good sign. Open gently from the centre outwards.",
      next: fi ? "Kirjaa ylös taikinan lämpö, todellinen kohotusaika ja lopputulos. Näin löydät juuri oman keittiösi parhaan rytmin." : "Record dough temperature, actual fermentation time, and the result. This reveals the best rhythm for your own kitchen.",
    },
  } as const;

  return answers[issue];
}
