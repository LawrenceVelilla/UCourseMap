
'use client'
import Link from "next/link";
import { usePathname } from "next/navigation"; 
import { BookOpen, Calendar, GraduationCap, Home, User } from "lucide-react";
import { cn } from "@/lib/utils"; // Utility for conditional classes

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
            "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            "hover:bg-[#4a5349] hover:text-[#fefae0]", // Hover effect
            pathname === item.href
              ? "bg-[#4a5349] text-[#fefae0]" // Active state styling
              : "text-[#DAD7CD] hover:bg-opacity-75" // Default state styling
          )}
        >
          <item.icon size={16} /> {/* Slightly smaller icon */}
          <span>{item.label}</span>
        </Link>
      ))}

      
      <Link
        href="/signin" 
        className={cn(
            "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
            "text-[#DAD7CD] hover:bg-[#4a5349] hover:text-[#fefae0] hover:bg-opacity-75" 
          )}
      >
        <User size={16} />
        <span>Sign in</span>
      </Link>
    </nav>
  );
}