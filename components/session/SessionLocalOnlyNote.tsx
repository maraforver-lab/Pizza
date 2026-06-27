import type { ReactNode } from "react";

export function SessionLocalOnlyNote({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-2xl bg-leaf/10 p-4 text-xs leading-5 text-ink/50">
      {children}
    </p>
  );
}
