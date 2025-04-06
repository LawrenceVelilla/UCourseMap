"use client"

import Link from "next/link"
import { useState } from "react"


interface FooterProps {
  className?: string
}
export function Footer({ className }: FooterProps) {
    const [collapsed, setCollapsed] = useState(false)
  return (   
        <div className="bg-[#f0f0e8] py-6 px-6 border-t max-w-6xl mx-auto text-center">
            <p className="text-sm text-gray-600">UniPlanner - University of Alberta Course Planning Tool</p>
            <p className="text-xs text-gray-500 mt-1">
                © {new Date().getFullYear()} UniPlanner. Not affiliated with the University of Alberta. All rights reserved to University of Alberta.
            </p>
        </div>    
  )
}
