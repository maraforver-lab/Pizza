import type { HTMLAttributes, ReactNode } from "react";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export const focusRingClass = "focus:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background-page";

const buttonToneClasses = {
  dark: "bg-background-dark text-text-on-dark shadow-sm transition hover:bg-background-marketing-dark",
  danger: "bg-action-danger text-text-on-dark shadow-sm transition hover:bg-action-danger/90",
  forest: "bg-action-secondary text-text-on-dark shadow-sm transition hover:bg-brand-primary-hover",
  tomato: "bg-action-primary text-text-on-dark shadow-sm transition hover:bg-action-primary/90",
} as const;

const buttonVariantClasses = {
  primary: "inline-flex min-h-12 items-center justify-center rounded-control px-5 text-sm font-extrabold active:scale-[.98] disabled:cursor-not-allowed disabled:bg-ink/20 disabled:text-ink/40",
  secondary: "inline-flex min-h-12 items-center justify-center rounded-control border border-ink/10 bg-background-card px-5 text-sm font-extrabold text-ink/65 transition hover:border-action-primary/30 hover:text-ink active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45",
  tertiary: "inline-flex min-h-11 items-center justify-center rounded-control px-4 text-sm font-extrabold text-ink/60 transition hover:bg-background-subtle/70 hover:text-ink active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45",
  icon: "inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-ink/10 bg-background-card text-ink/70 transition hover:border-action-primary/30 hover:text-ink active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-35",
} as const;

export function buttonClass({
  className,
  tone = "tomato",
  variant = "primary",
}: {
  className?: string;
  tone?: keyof typeof buttonToneClasses;
  variant?: keyof typeof buttonVariantClasses;
} = {}) {
  return cx(
    buttonVariantClasses[variant],
    variant === "primary" && buttonToneClasses[tone],
    focusRingClass,
    className,
  );
}

export const formControlClass = cx(
  "rounded-control border border-ink/10 bg-background-card text-ink outline-none transition",
  "focus:border-action-primary focus:ring-2 focus:ring-focus-ring/20",
  "disabled:cursor-not-allowed disabled:bg-background-subtle disabled:text-ink/35",
);

export const compactIconButtonClass = buttonClass({ variant: "icon" });

const cardVariantClasses = {
  archived: "rounded-card border border-ink/10 bg-background-subtle/60 p-5 text-ink/50",
  danger: "rounded-card border border-status-danger/20 bg-status-danger/[.06] p-5 text-ink",
  dark: "rounded-panel border border-white/10 bg-background-dark p-5 text-text-on-dark shadow-card",
  default: "rounded-card border border-ink/10 bg-background-card p-5 shadow-card",
  guidance: "rounded-panel border border-white/80 bg-background-card/75 p-5 shadow-card backdrop-blur",
  information: "rounded-card border border-status-info/15 bg-status-info/[.06] p-5 text-ink",
  selected: "rounded-card border border-action-primary/45 bg-background-card p-5 shadow-card ring-1 ring-action-primary/10",
  success: "rounded-card border border-status-success/20 bg-status-success/[.08] p-5 text-ink",
  warning: "rounded-card border border-status-warning/35 bg-status-warning/20 p-5 text-ink",
} as const;

export type CardVariant = keyof typeof cardVariantClasses;

export function cardClass({ className, variant = "default" }: { className?: string; variant?: CardVariant } = {}) {
  return cx(cardVariantClasses[variant], className);
}

const statusVariantClasses = {
  archived: "bg-background-subtle text-ink/45 ring-ink/10",
  completed: "bg-status-success/10 text-status-success ring-status-success/20",
  current: "bg-status-success/10 text-status-success ring-status-success/20",
  danger: "bg-status-danger/10 text-status-danger ring-status-danger/20",
  disabled: "bg-ink/[.05] text-ink/45 ring-ink/10",
  info: "bg-status-info/10 text-status-info ring-status-info/20",
  next: "bg-status-success/10 text-status-success ring-status-success/20",
  selected: "bg-action-primary text-text-on-dark ring-action-primary/25",
  success: "bg-status-success/10 text-status-success ring-status-success/20",
  warning: "bg-status-warning/30 text-ink ring-status-warning/40",
} as const;

export type StatusVariant = keyof typeof statusVariantClasses;

export function statusPillClass({ className, variant = "success" }: { className?: string; variant?: StatusVariant } = {}) {
  return cx("inline-flex w-fit items-center rounded-pill px-3 py-1.5 text-xs font-extrabold ring-1", statusVariantClasses[variant], className);
}

type PageShellProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  tone?: "warm" | "dark";
};

export function PageShell({ children, className, tone = "warm", ...props }: PageShellProps) {
  return (
    <main
      className={cx(
        "min-h-screen overflow-x-clip px-4 py-6 text-ink sm:px-6",
        tone === "dark"
          ? "bg-[var(--dt-primary-dark)] text-white"
          : "bg-[var(--dt-background-warm)]",
        className,
      )}
      {...props}
    >
      {children}
    </main>
  );
}

type PageHeroProps = HTMLAttributes<HTMLElement> & {
  actions?: ReactNode;
  body?: ReactNode;
  eyebrow?: string;
  media?: ReactNode;
  title: ReactNode;
};

export function PageHero({ actions, body, children, className, eyebrow, media, title, ...props }: PageHeroProps) {
  return (
    <section
      className={cx(
        "mx-auto grid max-w-6xl gap-6 rounded-hero border border-ink/10 bg-background-card/85 p-5 shadow-card sm:p-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center",
        className,
      )}
      {...props}
    >
      <div>
        {eyebrow && <p className="text-xs font-extrabold uppercase tracking-[.22em] text-tomato">{eyebrow}</p>}
        <h1 className="mt-3 font-display text-4xl font-semibold leading-none text-ink sm:text-6xl">{title}</h1>
        {body && <div className="mt-5 max-w-2xl text-sm leading-6 text-ink/60 sm:text-base">{body}</div>}
        {actions && <div className="mt-6 flex flex-col gap-3 sm:flex-row">{actions}</div>}
        {children}
      </div>
      {media && <div className="min-w-0">{media}</div>}
    </section>
  );
}

type PageSectionProps = HTMLAttributes<HTMLElement> & {
  body?: ReactNode;
  eyebrow?: string;
  title?: ReactNode;
};

export function PageSection({ body, children, className, eyebrow, title, ...props }: PageSectionProps) {
  return (
    <section className={cx("mx-auto max-w-6xl py-8 sm:py-10", className)} {...props}>
      {eyebrow && <p className="text-xs font-extrabold uppercase tracking-[.2em] text-tomato">{eyebrow}</p>}
      {title && <h2 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">{title}</h2>}
      {body && <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60">{body}</p>}
      {children}
    </section>
  );
}

type ContentGridProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  columns?: "two" | "three" | "four";
};

export function ContentGrid({ children, className, columns = "three", ...props }: ContentGridProps) {
  return (
    <div
      className={cx(
        "grid gap-3",
        columns === "two" && "md:grid-cols-2",
        columns === "three" && "sm:grid-cols-2 lg:grid-cols-3",
        columns === "four" && "sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Card({ children, className, variant = "default", ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode; variant?: CardVariant }) {
  return (
    <article
      className={cardClass({ className, variant })}
      {...props}
    >
      {children}
    </article>
  );
}

export function TipCard({ children, className, ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <aside
      className={cx(cardClass({ variant: "information" }), "p-4 text-sm leading-6 text-ink/65", className)}
      {...props}
    >
      {children}
    </aside>
  );
}

type StepCardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  step: number | string;
};

export function StepCard({ children, className, step, ...props }: StepCardProps) {
  return (
    <article
      className={cx("rounded-card border border-ink/10 bg-background-card p-4 shadow-sm", className)}
      {...props}
    >
      <span className="grid h-8 w-8 place-items-center rounded-pill bg-brand-primary text-xs font-extrabold text-text-on-dark">
        {step}
      </span>
      <div className="mt-3">{children}</div>
    </article>
  );
}

type ActionProps = {
  "aria-label"?: string;
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  tone?: keyof typeof buttonToneClasses;
  type?: "button" | "submit" | "reset";
};

export function PrimaryButton({ children, className, href, onClick, tone = "tomato", type = "button", ...props }: ActionProps) {
  const classes = buttonClass({ className, tone });

  if (href) {
    return (
      <a className={classes} href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} onClick={onClick} type={type} {...props}>
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className, href, onClick, type = "button", ...props }: ActionProps) {
  const classes = buttonClass({ className, variant: "secondary" });

  if (href) {
    return (
      <a className={classes} href={href} {...props}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} onClick={onClick} type={type} {...props}>
      {children}
    </button>
  );
}

export function StatusPill({ children, className, variant = "success", ...props }: HTMLAttributes<HTMLSpanElement> & { children: ReactNode; variant?: StatusVariant }) {
  return (
    <span
      className={statusPillClass({ className, variant })}
      {...props}
    >
      {children}
    </span>
  );
}

type BottomActionBarProps = HTMLAttributes<HTMLDivElement> & {
  back?: ReactNode;
  primary: ReactNode;
};

export function BottomActionBar({ back, children, className, primary, ...props }: BottomActionBarProps) {
  return (
    <div
      className={cx(
        "sticky bottom-0 z-20 -mx-4 mt-5 flex flex-col gap-3 border-t border-ink/10 bg-background-page/95 px-4 pb-3 pt-3 backdrop-blur sm:static sm:mx-0 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-4 sm:backdrop-blur-none",
        className,
      )}
      {...props}
    >
      <div className="order-2 sm:order-1">{back}</div>
      {children}
      <div className="order-1 sm:order-2">{primary}</div>
    </div>
  );
}
