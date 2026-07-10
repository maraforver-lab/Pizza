import type { HTMLAttributes, ReactNode } from "react";

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type PlanningGuidanceCardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

export function PlanningGuidanceCard({ children, className, ...props }: PlanningGuidanceCardProps) {
  return (
    <section
      className={cx("grid gap-3", className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function PlanningStatusCard({ children, className, ...props }: PlanningGuidanceCardProps) {
  return (
    <section
      className={cx("rounded-[1.25rem] border p-4 shadow-sm", className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function PlanningWatchCard({ children, className, ...props }: PlanningGuidanceCardProps) {
  return (
    <section
      className={cx("rounded-[1.25rem] border border-white/80 bg-white/85 p-4 shadow-sm", className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function PlanningDetailsList({ children, className, ...props }: HTMLAttributes<HTMLDListElement> & { children: ReactNode }) {
  return (
    <dl
      className={cx("grid gap-2 sm:grid-cols-2", className)}
      {...props}
    >
      {children}
    </dl>
  );
}

type PlanningDetailRowProps = HTMLAttributes<HTMLDivElement> & {
  label: ReactNode;
  value: ReactNode;
};

export function PlanningDetailRow({ className, label, value, ...props }: PlanningDetailRowProps) {
  return (
    <div
      className={cx("grid gap-1 rounded-2xl bg-white/90 p-3", className)}
      {...props}
    >
      <dt className="text-xs font-extrabold text-ink/45">{label}</dt>
      <dd className="text-sm font-bold leading-5 text-ink/70">{value}</dd>
    </div>
  );
}

type PlanningIllustrationProps = HTMLAttributes<HTMLDivElement> & {
  children?: ReactNode;
};

export function PlanningIllustration({ children, className, ...props }: PlanningIllustrationProps) {
  return (
    <div
      aria-hidden="true"
      className={cx("pointer-events-none grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cream text-xl shadow-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
}
