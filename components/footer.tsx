import { Mail } from "lucide-react";
import Link from "next/link"; 
import { cn } from "@/lib/utils";
import  LinkedIn  from "../public/icons/linkedin.svg";
import  Github  from "../public/icons/github.svg"; 

interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  const linkedInUrl = "https://www.linkedin.com/in/lawrence-velilla-609646221/"; 
  const githubUrl = "https://github.com/LawrenceVelilla"; 
  const emailAddress = "vel.lawrence04@gmail.com"; 

  return (
    <footer className={cn("bg-[#f0f0e8] py-6 px-6 border-t text-sm text-gray-600", className)}>
      <div className="container mx-auto flex flex-col items-center justify-center space-y-4">
        <div>
          <p>© {new Date().getFullYear()} UniPlanner. Created by Lawrence Velilla.</p>
          <p>All rights reserved. This is a personal project and not affiliated with the University of Alberta.
          Data collected from the University of Alberta Course Catalogue.</p>
        </div>
      
        <div className="flex items-center space-x-4">
          <a
            href={linkedInUrl}
            target="_blank" 
            rel="noopener noreferrer" 
            aria-label="LinkedIn Profile" 
            className="text-gray-500 hover:text-gray-800 transition-colors"
          >
            <LinkedIn size={20} />
          </a>
          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub Profile/Repository"
            className="text-gray-500 hover:text-gray-800 transition-colors"
          >
            <Github/>
          </a>
          <a
            href={`mailto:${emailAddress}`}
            aria-label="Send Email"
            className="text-gray-500 hover:text-gray-800 transition-colors"
          >
            <Mail/>
          </a>
        </div>
      </div>
    </footer>
  );
}