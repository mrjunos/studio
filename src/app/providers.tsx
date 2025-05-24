// src/app/providers.tsx
"use client";

import type { ReactNode } from "react";
import { SidebarProvider as ActualSidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider as ActualTooltipProvider } from "@/components/ui/tooltip";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ActualSidebarProvider defaultOpen>
      <ActualTooltipProvider>
        {children}
      </ActualTooltipProvider>
    </ActualSidebarProvider>
  );
}
