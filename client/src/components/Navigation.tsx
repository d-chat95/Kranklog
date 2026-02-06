import { Link, useLocation } from "wouter";
import { Home, Dumbbell, LineChart, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/programs", icon: Dumbbell, label: "Programs" },
    { href: "/programs/new", icon: Plus, label: "New", isFab: true },
    { href: "/progress", icon: LineChart, label: "Stats" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      <nav className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 border-r border-border bg-card p-6 z-50">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-primary tracking-tighter italic">KRANK<span className="text-foreground">LOG</span></h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Strength Systems</p>
        </div>
        
        <div className="flex flex-col space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={cn(
              "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group",
              location === item.href 
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}>
              <item.icon className={cn("w-5 h-5", location !== item.href && "group-hover:scale-110 transition-transform")} />
              <span className="font-medium text-lg tracking-wide font-display uppercase">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Bottom Bar - Hidden on desktop */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-50 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            if (item.isFab) {
              return (
                <Link key={item.href} href={item.href} className="relative -top-6">
                  <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center hover:scale-105 active:scale-95 transition-all">
                    <Plus className="w-8 h-8" />
                  </div>
                </Link>
              );
            }
            return (
              <Link key={item.href} href={item.href} className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-95 transition-transform",
                location === item.href ? "text-primary" : "text-muted-foreground"
              )}>
                <item.icon className="w-6 h-6" />
                <span className="text-[10px] font-medium uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
      
      {/* Mobile Safe Area Spacer */}
      <div className="h-20 md:hidden" />
    </>
  );
}
