'use client'
import Link from "next/link";
import { usePathname } from "next/navigation"; 
import { BookOpen, Calendar, GraduationCap, Home, User } from "lucide-react";
import { cn } from "@/lib/utils"; // Utility for conditional classes
import { ThemeSwitcher } from "./theme-switcher"; // Import the theme switcher

export function HeaderNav() {
  const pathname = usePathname(); 

  // Define navigation items for easier mapping
  const navItems = [
    { href: "/", label: "Home", icon: Home },
    // { href: "/classes", label: "Classes", icon: BookOpen }, 
    { href: "/planner", label: "Planner", icon: Calendar },
    { href: "/", label: "Prereq Checker", icon: GraduationCap }, 
  ];

  return (
    // Use <nav> for semantic navigation block
    // flex items-center to align items horizontally
    // space-x-* controls spacing between items
    <nav className="flex items-center space-x-4 lg:space-x-6">
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

      {/* Add Theme Switcher button */} 
      <div className="ml-auto"> {/* Pushes switcher to the right if needed, or adjust spacing */} 
        <ThemeSwitcher />
      </div>

    </nav>
  );
}