import type { HTMLAttributes, ReactNode } from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
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
        "mx-auto grid max-w-6xl gap-6 rounded-[2rem] border border-ink/10 bg-white/85 p-5 shadow-card sm:p-8 lg:grid-cols-[1.05fr_.95fr] lg:items-center",
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

export function Card({ children, className, ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <article
      className={cx("rounded-[1.5rem] border border-ink/10 bg-white p-5 shadow-card", className)}
      {...props}
    >
      {children}
    </article>
  );
}

export function TipCard({ children, className, ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <aside
      className={cx("rounded-[1.25rem] border border-tomato/10 bg-tomato/[.06] p-4 text-sm leading-6 text-ink/65", className)}
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
      className={cx("rounded-[1.25rem] border border-ink/10 bg-white p-4 shadow-sm", className)}
      {...props}
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-[var(--dt-primary)] text-xs font-extrabold text-white">
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
  type?: "button" | "submit" | "reset";
};

export function PrimaryButton({ children, className, href, onClick, type = "button", ...props }: ActionProps) {
  const classes = cx(
    "inline-flex min-h-12 items-center justify-center rounded-2xl bg-[var(--dt-primary)] px-5 text-sm font-extrabold text-white shadow-sm transition hover:bg-[var(--dt-primary-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2",
    className,
  );

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
  const classes = cx(
    "inline-flex min-h-12 items-center justify-center rounded-2xl border border-ink/10 bg-white px-5 text-sm font-extrabold text-ink/65 transition hover:border-tomato/30 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-tomato focus-visible:ring-offset-2",
    className,
  );

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

export function StatusPill({ children, className, ...props }: HTMLAttributes<HTMLSpanElement> & { children: ReactNode }) {
  return (
    <span
      className={cx("inline-flex items-center rounded-full bg-leaf/10 px-3 py-1 text-xs font-extrabold text-leaf", className)}
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
        "sticky bottom-0 z-20 -mx-4 mt-5 flex flex-col gap-3 border-t border-ink/10 bg-cream/95 px-4 pb-3 pt-3 backdrop-blur sm:static sm:mx-0 sm:mt-6 sm:flex-row sm:items-center sm:justify-between sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-4 sm:backdrop-blur-none",
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
