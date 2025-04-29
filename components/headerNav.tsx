"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Calendar, GraduationCap, Home, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "./theme-switcher";

export function HeaderNav() {
  const pathname = usePathname();
  const navItems = [
    { href: "/", label: "Home", icon: Home },
    // { href: "/classes", label: "Classes", icon: BookOpen },
    { href: "/program-planner", label: "Planner", icon: Calendar },
    { href: "/", label: "Prereq Checker", icon: GraduationCap },
    { href: "/planner", label: "Programs", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-2 sm:px-4">
        <nav className="flex-1 flex items-center">
          <Link href="/" className="mr-3 sm:mr-6 flex items-center space-x-2">
            {/* TODO: Add icon here */}
            <span className="font-bold text-sm sm:text-base whitespace-nowrap">UCourse Map</span>
          </Link>
          <div className="flex items-center justify-between space-x-1 sm:space-x-2 md:space-x-4 overflow-x-auto hide-scrollbar">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center justify-center gap-1 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                  "hover:text-primary",
                  "min-w-[40px] sm:min-w-[auto]",
                  pathname === item.href ? "text-foreground" : "text-muted-foreground",
                )}
                aria-label={item.label}
              >
                <item.icon size={16} className="flex-shrink-0" /> {/* Icon never shrinks */}
                <span className="hidden lg:inline whitespace-nowrap">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
        <div className="flex items-center space-x-1 sm:space-x-4">
          <ThemeSwitcher />
          <Link
            href="/signin"
            className={cn(
              "flex items-center gap-1 rounded-md px-2 py-2 text-sm font-medium transition-colors",
              "text-muted-foreground hover:text-primary",
            )}
            aria-label="Sign in"
          >
            <User size={16} className="flex-shrink-0" />
            <span className="hidden lg:inline whitespace-nowrap">Sign in</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
