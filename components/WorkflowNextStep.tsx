"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DoughToolsIcon } from "@/components/icons";

const nextSteps: Record<string, { route: string; label: string }> = {
  "/styles": { route: "/", label: "Fine-tune the selected recipe" },
  "/plan": { route: "/sauce", label: "Calculate the pizza sauce next" },
  "/sauce": { route: "/toppings", label: "Choose cheese and toppings" },
  "/timer": { route: "/journal", label: "Record the bake in your pizza journal" },
  "/costs": { route: "/journal", label: "Save the result in your journal" },
  "/doctor": { route: "/plan", label: "Open the adjusted preparation plan" },
  "/coach": { route: "/", label: "Take the recommendations to the calculator" },
  "/guide": { route: "/styles", label: "Explore pizza styles" },
  "/updates": { route: "/", label: "Try the latest version in the calculator" },
  "/history": { route: "/styles", label: "Explore classic pizza styles" },
  "/gear": { route: "/plan", label: "Continue to the pizza-night plan" },
  "/journal": { route: "/community", label: "Explore community recipes" },
  "/community": { route: "/", label: "Open a recipe in the calculator" },
};

export default function WorkflowNextStep() {
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  useEffect(() => {
    document.documentElement.lang = "en";
    const updateQuery = () => setQuery(window.location.search);
    updateQuery();
    window.addEventListener("doughtools:urlchange", updateQuery);
    return () => window.removeEventListener("doughtools:urlchange", updateQuery);
  }, [pathname]);

  const step = nextSteps[pathname];
  if (!step) return null;

  const nextLabel = "Next step";
  return <aside className="border-t border-ink/10 bg-ink/[.035] px-4 py-7 text-ink sm:px-6" aria-label={nextLabel}>
    <Link href={`${step.route}${query}`} className="mx-auto flex max-w-3xl items-center justify-between gap-5 rounded-2xl bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
      <span><small className="block text-[10px] font-extrabold uppercase tracking-[.16em] text-tomato">{nextLabel}</small><strong className="mt-1 block font-display text-xl sm:text-2xl">{step.label}</strong></span>
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-ink text-white" aria-hidden="true">
        <DoughToolsIcon name="forward" size={20} strokeWidth={2.3} />
      </span>
    </Link>
  </aside>;
}
