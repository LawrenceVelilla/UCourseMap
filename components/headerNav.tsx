'use client'
import Link from "next/link";
import { usePathname } from "next/navigation"; 
import { BookOpen, Calendar, GraduationCap, Home, User } from "lucide-react";
import { cn } from "@/lib/utils"; // Utility for conditional classes
import { ThemeSwitcher } from "./theme-switcher"; // Import the theme switcher
import { Button } from '@/components/ui/button';

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
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <nav className="flex items-center space-x-4 lg:space-x-6">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            {/* You can add an icon or logo here if you like */}
            <span className="font-bold">Uni Planner</span>
          </Link>
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              // Apply base styling + conditional active styling
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "hover:text-primary", // Use theme primary color on hover
                pathname === item.href
                  ? "text-foreground" // Active state uses main foreground color
                  : "text-muted-foreground" // Default state uses muted foreground
              )}
            >
              <item.icon size={16} /> {/* Slightly smaller icon */}
              <span className="hidden lg:inline">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <ThemeSwitcher />
          <Link
            href="/signin" 
            className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "text-muted-foreground hover:text-primary" // Consistent styling for sign in link
              )}
          >
            <User size={16} />
            <span className="hidden lg:inline">Sign in</span>
          </Link> 
        </div>
      </div>
    </header>
  );
}