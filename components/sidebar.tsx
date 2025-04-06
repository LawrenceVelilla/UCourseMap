"use client"

import Link from "next/link"
import { useState } from "react"
import { BookOpen, Calendar, ChevronLeft, ChevronRight, GraduationCap, Home, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={cn(
        "flex flex-col bg-[#283618] text-[#DAD7CD] transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      <div
        className={cn(
          "p-4 border-b border-[#4a5349] flex items-center",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && <h2 className="text-xl font-bold">UniPlanner</h2>}
        {collapsed && <span className="text-xl font-bold">U</span>}
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-[#4a5349] ml-auto"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <div className={cn("p-4 border-b border-[#4a5349] flex items-center gap-2", collapsed && "justify-center p-2")}>
        <User size={18} />
        {!collapsed && (
          <Link href="/signin" className="text-sm hover:underline">
            Sign in
          </Link>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#4a5349] transition-colors",
            collapsed && "justify-center px-2",
          )}
        >
          <Home size={18} />
          {!collapsed && <span>Home</span>}
        </Link>
        <Link
          href="/classes"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#4a5349] transition-colors",
            collapsed && "justify-center px-2",
          )}
        >
          <BookOpen size={18} />
          {!collapsed && <span>Classes</span>}
        </Link>
        <Link
          href="/planner"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#4a5349] transition-colors",
            collapsed && "justify-center px-2",
          )}
        >
          <Calendar size={18} />
          {!collapsed && <span>Planner</span>}
        </Link>
        <Link
          href="/prerequisites"
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-md hover:bg-[#4a5349] transition-colors",
            collapsed && "justify-center px-2",
          )}
        >
          <GraduationCap size={18} />
          {!collapsed && <span>Prerequisites</span>}
        </Link>
      </nav>
    </div>
  )
}

