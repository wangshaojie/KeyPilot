import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <Header />
      <div className="flex flex-1 h-full overflow-hidden min-h-0">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <main
          className={cn(
            "flex-1 h-[90vh] overflow-hidden p-6 transition-all duration-300",
            sidebarCollapsed ? "ml-16" : "ml-64",
          )}
        >
          <div className="h-full overflow-hidden">{children}</div>
        </main>
      </div>
      <footer className="h-8 border-t border-border bg-surface flex items-center px-4 text-xs text-text-muted">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Backend Connected
          </span>
          <span>Last sync: Just now</span>
        </div>
        <div className="ml-auto">KeyPilot v1.0.0</div>
      </footer>
    </div>
  );
}
