import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClass, cardClass, cx } from "@/components/design-system";
import { DoughToolsIcon, type DoughToolsIconName } from "@/components/icons";

type HeroAction = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

type BaseHeroProps = {
  actions?: HeroAction[];
  body?: ReactNode;
  children?: ReactNode;
  className?: string;
  eyebrow?: string;
  icon?: DoughToolsIconName;
  title: ReactNode;
};

function HeroActions({ actions }: { actions?: HeroAction[] }) {
  if (!actions?.length) return null;

  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      {actions.map((action, index) => (
        <Link
          key={`${action.href}-${action.label}`}
          href={action.href}
          className={buttonClass({
            className: "w-full sm:w-auto",
            variant: action.variant === "secondary" || index > 0 ? "secondary" : "primary",
          })}
        >
          {action.label}
        </Link>
      ))}
    </div>
  );
}

export function MarketingHero({
  actions,
  body,
  children,
  className,
  eyebrow,
  title,
}: BaseHeroProps) {
  return (
    <section
      className={cx(
        "overflow-hidden rounded-hero bg-background-marketing-dark p-5 text-text-on-dark shadow-raised sm:p-8 lg:p-10",
        className,
      )}
    >
      {eyebrow && <p className="text-xs font-extrabold uppercase tracking-[.22em] text-oven-gold">{eyebrow}</p>}
      <h1 className="mt-3 max-w-4xl font-display text-5xl font-semibold leading-[.92] tracking-tight sm:text-7xl">
        {title}
      </h1>
      {body && <div className="mt-5 max-w-2xl text-sm font-bold leading-6 text-white/70 sm:text-base">{body}</div>}
      <HeroActions actions={actions} />
      {children}
    </section>
  );
}

export function EditorialLearningHero({
  actions,
  body,
  children,
  className,
  eyebrow,
  icon = "information",
  title,
}: BaseHeroProps) {
  return (
    <section
      className={cx(
        cardClass({ className: "grid gap-5 p-5 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center", variant: "guidance" }),
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">{eyebrow}</p>}
        <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-[.98] tracking-tight sm:text-6xl">
          {title}
        </h1>
        {body && <div className="mt-4 max-w-2xl text-sm leading-6 text-ink/60 sm:text-base">{body}</div>}
        <HeroActions actions={actions} />
      </div>
      <div className="grid h-20 w-20 place-items-center rounded-panel bg-tomato/10 text-tomato ring-1 ring-tomato/15" aria-hidden="true">
        <DoughToolsIcon name={icon} size={32} />
      </div>
      {children}
    </section>
  );
}

export function VisualLabHero({
  actions,
  body,
  children,
  className,
  eyebrow,
  icon = "scale",
  title,
}: BaseHeroProps) {
  return (
    <section className={cx(cardClass({ className: "p-5 sm:p-7", variant: "information" }), className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          {eyebrow && <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">{eyebrow}</p>}
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-semibold leading-none text-ink sm:text-5xl">
            {title}
          </h1>
          {body && <div className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">{body}</div>}
        </div>
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white text-tomato shadow-sm ring-1 ring-ink/10" aria-hidden="true">
          <DoughToolsIcon name={icon} size={24} />
        </span>
      </div>
      <HeroActions actions={actions} />
      {children}
    </section>
  );
}

export function WorkspaceHeader({
  actions,
  body,
  children,
  className,
  eyebrow,
  icon = "checklist",
  title,
}: BaseHeroProps) {
  return (
    <section className={cx("rounded-panel border border-ink/10 bg-background-card/80 p-4 shadow-sm sm:p-5", className)}>
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-background-subtle text-ink/65" aria-hidden="true">
          <DoughToolsIcon name={icon} size={24} />
        </span>
        <div className="min-w-0">
          {eyebrow && <p className="text-xs font-extrabold uppercase tracking-[.18em] text-tomato">{eyebrow}</p>}
          <h1 className="mt-1 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">{title}</h1>
          {body && <div className="mt-2 max-w-2xl text-sm leading-6 text-ink/60">{body}</div>}
        </div>
      </div>
      <HeroActions actions={actions} />
      {children}
    </section>
  );
}

export function UtilityHeader({
  actions,
  body,
  children,
  className,
  eyebrow,
  icon = "information",
  title,
}: BaseHeroProps) {
  return (
    <section className={cx(cardClass({ className: "p-5 sm:p-8", variant: "guidance" }), className)}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-tomato/10 text-tomato ring-1 ring-tomato/15" aria-hidden="true">
          <DoughToolsIcon name={icon} size={24} />
        </span>
        <div className="min-w-0">
          {eyebrow && <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">{eyebrow}</p>}
          <h1 className="mt-3 max-w-4xl font-display text-4xl font-semibold leading-[1.02] tracking-tight sm:text-6xl">
            {title}
          </h1>
          {body && <div className="mt-5 max-w-3xl text-sm leading-6 text-ink/60 sm:text-base">{body}</div>}
          <HeroActions actions={actions} />
        </div>
      </div>
      {children}
    </section>
  );
}
