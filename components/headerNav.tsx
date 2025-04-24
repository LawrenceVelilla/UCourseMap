"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Calendar, GraduationCap, Home, User } from "lucide-react";
import { cn } from "@/lib/utils"; // Utility for conditional classes
import { ThemeSwitcher } from "./theme-switcher"; // Import the theme switcher
import { Button } from "@/components/ui/button";

export function HeaderNav() {
  const pathname = usePathname();

  // Define navigation items for easier mapping
  const navItems = [
    { href: "/", label: "Home", icon: Home },
    // { href: "/classes", label: "Classes", icon: BookOpen },
    { href: "/planner", label: "Planner", icon: Calendar },
    { href: "/", label: "Prereq Checker", icon: GraduationCap },
    { href: "/programs", label: "Programs", icon: BookOpen },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-2 sm:px-4">
        <nav className="flex-1 flex items-center">
          <Link href="/" className="mr-3 sm:mr-6 flex items-center space-x-2">
            {/* You can add an icon or logo here if you like */}
            <span className="font-bold text-sm sm:text-base whitespace-nowrap">Uni Planner</span>
          </Link>
          <div className="flex items-center justify-between space-x-1 sm:space-x-2 md:space-x-4 overflow-x-auto hide-scrollbar">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                // Apply base styling + conditional active styling
                className={cn(
                  "flex items-center justify-center gap-1 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                  "hover:text-primary", // Use theme primary color on hover
                  "min-w-[40px] sm:min-w-[auto]", // Prevent squishing on small screens
                  pathname === item.href
                    ? "text-foreground" // Active state uses main foreground color
                    : "text-muted-foreground", // Default state uses muted foreground
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
              "text-muted-foreground hover:text-primary", // Consistent styling for sign in link
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
