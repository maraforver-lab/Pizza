import type { ReactNode } from "react";

export function SessionLocalOnlyNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 hidden rounded-2xl bg-leaf/10 p-4 text-xs leading-5 text-ink/50 sm:block">
      {children}
    </p>
  );
}
