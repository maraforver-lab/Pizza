"use client";

import type { ReactNode } from "react";
import { SessionProgressSidebar } from "@/components/session/SessionProgressSidebar";

type SessionWorkspaceLayoutProps = {
  activeStep: number;
  children: ReactNode;
  hideLocalSaveNote?: boolean;
};

export function SessionWorkspaceLayout({ activeStep, children, hideLocalSaveNote = false }: SessionWorkspaceLayoutProps) {
  return (
    <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[16rem_1fr]">
      <SessionProgressSidebar activeStep={activeStep} hideLocalSaveNote={hideLocalSaveNote} />
      <div className="min-w-0">
        {children}
      </div>
    </div>
  );
}
