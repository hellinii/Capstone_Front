import type { ReactNode } from "react";
import { AppHeader } from "./AppHeader";
import { StepTabs } from "./StepTabs";

interface WorkflowShellProps {
  children: ReactNode;
}

/**
 * Shared layout shell for all workflow step pages.
 * Renders AppHeader + StepTabs once, wraps step-specific content in a consistent main container.
 * Each step page only needs to provide its unique content and an ActionBar.
 */
export function WorkflowShell({ children }: WorkflowShellProps) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <AppHeader />
      <StepTabs />
      {children}
    </div>
  );
}
