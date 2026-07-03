import { forwardRef } from "react";
import type { PizzaSession, PizzaSessionShoppingList } from "@/lib/pizza-session";
import { yeastTypeLabel } from "@/lib/yeast-types";

type ShoppingListExportCardProps = {
  session: PizzaSession;
  shoppingList: PizzaSessionShoppingList;
};

const pizzaStyleLabels: Record<string, string> = {
  neapolitan: "Neapolitan-style",
  contemporary: "Contemporary",
  "new-york": "New York-style",
  "roman-thin": "Roman thin",
  detroit: "Detroit-style",
  sicilian: "Sicilian-style",
};

const fermentationLabels: Record<string, string> = {
  "6h-room": "6h room fermentation",
  "12h-room": "12h room fermentation",
  "24h-room": "24h room fermentation",
  "24h-cold": "24h cold fermentation",
  "48h-cold": "48h cold fermentation",
};

function formatDateTime(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function doughStartReminder(session: PizzaSession) {
  const mixDoughStep = session.timeline?.steps.find((step) => step.id === "mix-dough");
  const formatted = formatDateTime(mixDoughStep?.scheduledAt);
  return formatted ? `Start making the dough: ${formatted}` : undefined;
}

function sessionSummaryItems(session: PizzaSession, shoppingList: PizzaSessionShoppingList) {
  const snapshot = session.recipeSnapshot;
  const pizzaCount = shoppingList.pizzaCount ?? session.pizzaCount ?? snapshot?.balls;
  const ballWeight = snapshot?.ballWeight ?? session.doughBallWeight;
  const pizzaStyle = snapshot?.pizzaStyle ? pizzaStyleLabels[snapshot.pizzaStyle] ?? snapshot.pizzaStyle : undefined;
  const fermentation = snapshot?.fermentation ? fermentationLabels[snapshot.fermentation] ?? snapshot.fermentation : undefined;
  const yeast = snapshot?.yeastType ? yeastTypeLabel(snapshot.yeastType) : session.yeastType ? yeastTypeLabel(session.yeastType) : undefined;

  return [
    pizzaCount ? { label: "Pizzas", value: `${pizzaCount}` } : undefined,
    ballWeight ? { label: "Dough balls", value: `${ballWeight} g each` } : undefined,
    pizzaStyle ? { label: "Style", value: pizzaStyle } : undefined,
    fermentation ? { label: "Fermentation", value: fermentation } : undefined,
    yeast ? { label: "Yeast", value: yeast } : undefined,
  ].flatMap((item) => item ? [item] : []);
}

function exportGroupLabel(group: string) {
  if (group === "Dough") return "Dough ingredients";
  if (group === "Gear") return "Tools";
  if (group === "Sauce" || group === "Cheese" || group === "Toppings") return group;
  return group;
}

export const ShoppingListExportCard = forwardRef<HTMLElement, ShoppingListExportCardProps>(function ShoppingListExportCard(
  { session, shoppingList },
  ref,
) {
  const summaryItems = sessionSummaryItems(session, shoppingList);
  const reminder = doughStartReminder(session);

  return (
    <article
      ref={ref}
      aria-label="DoughTools branded shopping list image"
      className="relative w-[1080px] overflow-hidden bg-[#fff8ef] px-16 py-14 text-[#1f1f1f]"
      style={{
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div className="absolute -right-32 -top-28 h-96 w-96 rounded-full bg-[#e94b2e]/10" />
      <div className="absolute -bottom-36 -left-24 h-96 w-96 rounded-full bg-[#3ba66b]/10" />
      <div className="absolute right-12 top-28 rotate-[-10deg] text-8xl opacity-[0.08]" aria-hidden="true">🍅</div>
      <div className="absolute bottom-24 right-24 rotate-[12deg] text-8xl opacity-[0.08]" aria-hidden="true">🌿</div>
      <div className="absolute left-14 top-72 rotate-[8deg] text-7xl opacity-[0.07]" aria-hidden="true">🌾</div>

      <div className="relative rounded-[44px] border border-[#1f1f1f]/10 bg-white/90 p-12 shadow-[0_28px_80px_rgba(35,24,15,0.14)]">
        <header className="flex items-start justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-4 rounded-full bg-[#0f3d2e] px-5 py-3 text-white">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 text-2xl" aria-hidden="true">◠</span>
              <span className="text-3xl font-black tracking-tight">DoughTools</span>
            </div>
            <h1 className="mt-8 text-6xl font-black leading-[0.95] tracking-[-0.04em] text-[#1f1f1f]">Pizza Shopping List</h1>
            <p className="mt-4 text-2xl font-semibold text-[#6b645d]">Make better pizza with better decisions</p>
          </div>
          <div className="rounded-[28px] bg-[#f1e6d8] px-6 py-5 text-right">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#6b645d]">Session</p>
            <p className="mt-2 text-3xl font-black text-[#0f3d2e]">{shoppingList.presetName ?? "Pizza mix"}</p>
          </div>
        </header>

        {summaryItems.length > 0 && (
          <dl className="mt-10 grid grid-cols-2 gap-4">
            {summaryItems.map((item) => (
              <div key={`${item.label}-${item.value}`} className="rounded-[24px] bg-[#fff8ef] px-5 py-4">
                <dt className="text-sm font-black uppercase tracking-[0.16em] text-[#6b645d]">{item.label}</dt>
                <dd className="mt-1 text-2xl font-black text-[#1f1f1f]">{item.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {reminder && (
          <div className="mt-8 rounded-[28px] border border-[#e94b2e]/20 bg-[#e94b2e]/10 px-6 py-5">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#e94b2e]">Preparation reminder</p>
            <p className="mt-2 text-3xl font-black text-[#1f1f1f]">{reminder}</p>
          </div>
        )}

        <div className="mt-10 grid gap-6">
          {shoppingList.groups.map((group) => (
            <section key={group.group} className="rounded-[30px] border border-[#1f1f1f]/10 bg-white p-6">
              <div className="flex items-center justify-between gap-4 border-b border-[#1f1f1f]/10 pb-4">
                <h2 className="text-3xl font-black text-[#0f3d2e]">{exportGroupLabel(group.group)}</h2>
                <span className="rounded-full bg-[#f1e6d8] px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-[#6b645d]">
                  {group.items.length} {group.items.length === 1 ? "item" : "items"}
                </span>
              </div>
              <div className="mt-3 divide-y divide-[#1f1f1f]/10">
                {group.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-6 py-4">
                    <p className="text-[26px] font-extrabold leading-tight text-[#1f1f1f]">{item.label}</p>
                    <p className="max-w-[360px] text-right text-[24px] font-bold leading-tight text-[#6b645d]">{item.amount ?? "as needed"}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-10 flex items-center justify-between border-t border-[#1f1f1f]/10 pt-7 text-xl font-extrabold text-[#6b645d]">
          <span>Made with DoughTools</span>
          <span>doughtools.app</span>
        </footer>
      </div>
    </article>
  );
});
