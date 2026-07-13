import Link from "next/link";
import { DoughToolsIcon } from "@/components/icons";
import {
  contextualReturnLabelFor,
  contextualReturnSupportTextFor,
  getSafeContextualReturnPath,
} from "@/lib/contextual-return";

type ContextualReturnProps = {
  returnTo?: string | string[] | null;
  className?: string;
};

export default function ContextualReturn({ returnTo, className = "" }: ContextualReturnProps) {
  const safeReturnTo = getSafeContextualReturnPath(returnTo);

  if (!safeReturnTo) return null;

  const label = contextualReturnLabelFor(safeReturnTo);
  const supportText = contextualReturnSupportTextFor(safeReturnTo);

  return (
    <nav className={className} aria-label="Contextual return">
      <Link
        href={safeReturnTo}
        aria-label={`${label}. ${supportText}.`}
        className="inline-flex min-h-12 w-full items-center gap-3 rounded-2xl border border-leaf/20 bg-leaf/[.08] px-4 py-3 text-left text-sm font-extrabold text-leaf transition hover:border-leaf/35 hover:bg-leaf/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato sm:w-auto"
      >
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/80" aria-hidden="true">
          <DoughToolsIcon name="back" size={20} />
        </span>
        <span>
          <span className="block">{label}</span>
          <span className="mt-0.5 block text-xs font-bold text-ink/50">{supportText}</span>
        </span>
      </Link>
    </nav>
  );
}
