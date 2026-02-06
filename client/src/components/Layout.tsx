import { ReactNode } from "react";
import { Navigation } from "./Navigation";

interface LayoutProps {
  children: ReactNode;
  header?: ReactNode;
}

export function Layout({ children, header }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      <Navigation />
      
      <main className="flex-1 md:ml-64 w-full">
        {header && (
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-4 md:px-8 md:py-6">
            {header}
          </header>
        )}
        
        <div className="px-4 py-6 md:p-8 max-w-5xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
