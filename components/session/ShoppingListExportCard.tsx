import { forwardRef } from "react";
import type { PizzaSession, PizzaSessionShoppingList } from "@/lib/pizza-session";
import { buildSessionFermentationDisplay } from "@/lib/session-fermentation-display";
import { buildSessionRecipe } from "@/lib/session-recipe";
import {
  getShoppingFlourExportDisplay,
  isShoppingFlourItem,
} from "@/lib/pizza-session-shopping-list";
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

const ingredientDecorations = [
  { icon: "🍅", label: "tomato", className: "right-12 top-24 rotate-[-11deg] text-[8.5rem] opacity-[0.13]" },
  { icon: "🌿", label: "basil", className: "right-20 bottom-36 rotate-[14deg] text-[8rem] opacity-[0.12]" },
  { icon: "🌾", label: "wheat", className: "left-12 top-72 rotate-[8deg] text-[7.5rem] opacity-[0.10]" },
  { icon: "🧀", label: "cheese", className: "left-14 bottom-44 rotate-[-16deg] text-[7rem] opacity-[0.10]" },
  { icon: "🫒", label: "olive oil", className: "right-40 top-[30rem] rotate-[10deg] text-[5.5rem] opacity-[0.09]" },
  { icon: "🌶️", label: "salami spice", className: "left-48 top-16 rotate-[18deg] text-[5rem] opacity-[0.10]" },
] as const;

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
  const recipeResult = buildSessionRecipe(session);
  const snapshot = session.recipeSnapshot;
  const pizzaCount = shoppingList.pizzaCount ?? session.pizzaCount ?? snapshot?.balls;
  const ballWeight = snapshot?.ballWeight ?? session.doughBallWeight;
  const pizzaStyle = snapshot?.pizzaStyle ? pizzaStyleLabels[snapshot.pizzaStyle] ?? snapshot.pizzaStyle : undefined;
  const fermentationDisplay = buildSessionFermentationDisplay({
    session,
    snapshot: recipeResult.ok ? recipeResult.recipeSnapshot : snapshot,
    basis: recipeResult.ok ? recipeResult.continuousYeast?.recommendation : undefined,
  });
  const fermentation = fermentationDisplay.mode ? fermentationDisplay.fullLabel : undefined;
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
      className="relative w-[1080px] overflow-hidden bg-[#fff5e7] px-16 py-14 text-[#1f1f1f]"
      style={{
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        backgroundImage: [
          "radial-gradient(circle at 12% 10%, rgba(242,165,65,0.30), transparent 18rem)",
          "radial-gradient(circle at 89% 8%, rgba(233,75,46,0.24), transparent 17rem)",
          "radial-gradient(circle at 85% 88%, rgba(59,166,107,0.22), transparent 18rem)",
          "radial-gradient(circle at 8% 90%, rgba(139,92,49,0.16), transparent 17rem)",
          "linear-gradient(135deg, rgba(255,248,241,0.96), rgba(241,230,216,0.72))",
        ].join(", "),
      }}
    >
      <div className="shopping-export-ingredient-backdrop absolute inset-0" aria-hidden="true">
        <div className="absolute -right-36 -top-32 h-[30rem] w-[30rem] rounded-full bg-[#e94b2e]/[.16] blur-sm" />
        <div className="absolute -bottom-40 -left-28 h-[32rem] w-[32rem] rounded-full bg-[#3ba66b]/[.14] blur-sm" />
        <div className="absolute left-20 top-24 h-28 w-28 rounded-full bg-white/30 shadow-[0_0_70px_rgba(255,255,255,0.7)]" />
        <div className="absolute bottom-24 right-32 h-36 w-36 rounded-full bg-white/25 shadow-[0_0_80px_rgba(255,255,255,0.65)]" />
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(31,31,31,0.12) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
        <div className="absolute left-0 top-0 h-full w-28 bg-gradient-to-r from-white/[.45] to-transparent" />
        <div className="absolute right-0 top-0 h-full w-28 bg-gradient-to-l from-white/[.45] to-transparent" />
        {ingredientDecorations.map((item) => (
          <span
            key={item.label}
            className={`absolute select-none drop-shadow-[0_18px_32px_rgba(35,24,15,0.16)] ${item.className}`}
            aria-label={item.label}
          >
            {item.icon}
          </span>
        ))}
      </div>

      <div className="relative overflow-hidden rounded-[48px] border border-white/80 bg-white/[.92] p-12 shadow-[0_34px_90px_rgba(35,24,15,0.18)] ring-1 ring-[#1f1f1f]/[0.045] backdrop-blur-sm">
        <div className="shopping-export-card-atmosphere absolute inset-0 overflow-hidden rounded-[48px]" aria-hidden="true">
          <div className="absolute -right-24 top-8 h-72 w-72 rounded-full bg-[#e94b2e]/[.10] blur-[2px]" />
          <div className="absolute right-10 top-24 h-24 w-24 rounded-full border-[16px] border-[#e94b2e]/[.09]" />
          <div className="absolute right-14 top-64 h-32 w-12 rotate-[24deg] rounded-full bg-[#3ba66b]/[.12]" />
          <div className="absolute right-36 top-72 h-24 w-10 rotate-[-34deg] rounded-full bg-[#3ba66b]/[.10]" />
          <div className="absolute -left-28 bottom-12 h-80 w-80 rounded-full bg-[#f2a541]/[.08] blur-sm" />
          <div className="absolute left-8 bottom-28 h-1 w-56 rotate-[-18deg] rounded-full bg-[#8b5c31]/[.12]" />
          <div className="absolute left-12 bottom-36 h-1 w-44 rotate-[-24deg] rounded-full bg-[#8b5c31]/[.10]" />
          <div className="absolute left-16 bottom-44 h-1 w-32 rotate-[-31deg] rounded-full bg-[#8b5c31]/[.08]" />
          <div className="absolute left-8 top-8 h-2 w-2 rounded-full bg-[#8b5c31]/[.10]" />
          <div className="absolute left-24 top-20 h-1.5 w-1.5 rounded-full bg-[#8b5c31]/[.10]" />
          <div className="absolute left-44 top-10 h-2 w-2 rounded-full bg-[#8b5c31]/[.08]" />
          <div className="absolute bottom-10 right-20 h-2 w-2 rounded-full bg-[#8b5c31]/[.10]" />
          <div className="absolute bottom-24 right-52 h-1.5 w-1.5 rounded-full bg-[#8b5c31]/[.08]" />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-8">
            <div>
              <div className="inline-flex items-center gap-4 rounded-full bg-[#0f3d2e] px-5 py-3 text-white shadow-[0_12px_24px_rgba(15,61,46,0.18)]">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/15 text-2xl" aria-hidden="true">◠</span>
                <span className="text-3xl font-black tracking-tight">DoughTools</span>
              </div>
              <h1 className="mt-8 text-6xl font-black leading-[0.95] tracking-[-0.04em] text-[#1f1f1f]">Pizza Shopping List</h1>
              <p className="mt-4 text-2xl font-semibold text-[#6b645d]">Make better pizza with better decisions</p>
            </div>
            <div className="rounded-[28px] border border-white/[.70] bg-[#f1e6d8]/95 px-6 py-5 text-right shadow-[0_16px_34px_rgba(35,24,15,0.08)]">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#6b645d]">Session</p>
              <p className="mt-2 text-3xl font-black text-[#0f3d2e]">{shoppingList.presetName ?? "Pizza mix"}</p>
            </div>
          </div>

          {summaryItems.length > 0 && (
            <dl className="mt-10 grid grid-cols-2 gap-4">
              {summaryItems.map((item) => (
                <div key={`${item.label}-${item.value}`} className="rounded-[24px] border border-[#1f1f1f]/[0.04] bg-[#fff8ef]/95 px-5 py-4 shadow-[0_10px_22px_rgba(35,24,15,0.05)]">
                  <dt className="text-sm font-black uppercase tracking-[0.16em] text-[#6b645d]">{item.label}</dt>
                  <dd className="mt-1 text-2xl font-black text-[#1f1f1f]">{item.value}</dd>
                </div>
              ))}
            </dl>
          )}

        {reminder && (
          <div className="mt-8 rounded-[28px] border border-[#e94b2e]/20 bg-[#e94b2e]/10 px-6 py-5 shadow-[0_14px_28px_rgba(233,75,46,0.08)]">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#e94b2e]">Preparation reminder</p>
            <p className="mt-2 text-3xl font-black text-[#1f1f1f]">{reminder}</p>
          </div>
        )}

        <div className="mt-10 grid gap-6">
          {shoppingList.groups.map((group) => (
            <section key={group.group} className="rounded-[30px] border border-[#1f1f1f]/[0.07] bg-white/[.96] p-6 shadow-[0_16px_38px_rgba(35,24,15,0.08)]">
              <div className="flex items-center justify-between gap-4 border-b border-[#1f1f1f]/10 pb-4">
                <h2 className="text-3xl font-black text-[#0f3d2e]">{exportGroupLabel(group.group)}</h2>
                <span className="rounded-full bg-[#f1e6d8] px-4 py-2 text-sm font-black uppercase tracking-[0.12em] text-[#6b645d]">
                  {group.items.length} {group.items.length === 1 ? "item" : "items"}
                </span>
              </div>
              <div className="mt-3 divide-y divide-[#1f1f1f]/10">
                {group.items.map((item) => {
                  if (isShoppingFlourItem(item)) {
                    const flour = getShoppingFlourExportDisplay(session, item);
                    return (
                      <div key={item.id} className="py-4">
                        <p className="text-[26px] font-extrabold leading-tight text-[#1f1f1f]">{flour.label}</p>
                        <p className="mt-1 text-[22px] font-bold leading-tight text-[#0f3d2e]">{flour.recommendation}</p>
                        {flour.amount && <p className="mt-1 text-[24px] font-bold leading-tight text-[#6b645d]">{flour.amount}</p>}
                        {flour.exampleProduct && <p className="mt-1 text-[20px] font-bold leading-tight text-[#6b645d]">Example: {flour.exampleProduct}</p>}
                      </div>
                    );
                  }
                  return (
                    <div key={item.id} className="grid grid-cols-[minmax(0,1fr)_auto] gap-6 py-4">
                      <p className="text-[26px] font-extrabold leading-tight text-[#1f1f1f]">{item.label}</p>
                      <p className="max-w-[360px] text-right text-[24px] font-bold leading-tight text-[#6b645d]">{item.amount ?? "as needed"}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between border-t border-[#1f1f1f]/10 pt-7 text-xl font-extrabold text-[#6b645d]" data-export-footer>
          <span>Made with DoughTools</span>
          <span>doughtools.app</span>
        </div>
        </div>
      </div>
    </article>
  );
});
