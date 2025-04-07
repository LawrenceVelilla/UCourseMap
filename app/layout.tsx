import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { Afacad, Caveat, Libre_Baskerville } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Footer } from "@/components/footer"
import { HeaderNav } from "@/components/headerNav"
import { Link } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"] })

const afacad = Afacad({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-afacad",
})
const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-libre-baskerville",
})
const caveat = Caveat({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-caveat",    
})

export const metadata = {
  title: "UniPlanner - University of Alberta Course Planner",
  description: "Plan your University of Alberta courses and check prerequisites",
  openGraph: {
    title: "UniPlanner - University of Alberta Course Planner",
    description: "Plan your University of Alberta courses and check prerequisites",
    url: "https://uniplannerproject.vercel.app",
    images: [
      {
      url: "/preview.png",
      width: 1200,
      height: 630,
      alt: "UniPlanner - University of Alberta Course Planner",
      }
    ]
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Add suppressHydrationWarning if using next-themes
    <html lang="en" suppressHydrationWarning>
      <body className={cn("min-h-screen bg-background font-sans antialiased", afacad.variable, libreBaskerville.variable, caveat.variable)}>
        {/* Theme Provider wraps everything */}
        <ThemeProvider
            attribute="class"
            defaultTheme="light" // Or your preferred default
            enableSystem
            // disableTransitionOnChange
        >
          {/* Main Layout Structure: Header, Content, Footer */}
          <div className="relative flex min-h-screen flex-col bg-[#f5f5f0]"> 
            <header className="top-0 z-50 w-full border-b border-[#4a5349] bg-[#38432b] text-[#DAD7CD] backdrop-blur-md"> 
              <div className="container flex h-16 items-center px-4 sm:px-6 lg:px-8"> {/* Container for content */}
                {/* Branding Section (Left) */}
                { /* Logo or Branding */}

                {/* Mobile Menu Button (Left on Mobile) */}
                 <div className="md:hidden">
                    {/* You'll need a mobile menu component triggered by this button later */}
                    <Button variant="ghost" size="icon">
                        {/* Hamburger Icon */}
                         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
                         <span className="sr-only">Toggle Menu</span>
                    </Button>
                 </div>

                {/* Spacer to push nav to the right */}
                <div className="flex flex-1 items-center justify-end space-x-4">
                   {/* Desktop Navigation (Right) */}
                   <div className="hidden md:flex"> {/* Hide on mobile */}
                       <HeaderNav />
                   </div>
                </div>
              </div>
            </header>
            {/* --- End Site Header --- */}


            {/* --- Main Content Area --- */}
            {/* flex-1 makes this grow to fill space between header and footer */}
            <main className="flex-1">
              {children} {/* Your page content renders here */}
            </main>
            {/* --- End Main Content Area --- */}


            {/* --- Footer --- */}
            {/* Kept at the bottom */}
            <Footer className="bg-[#f0f0e8] py-4 px-6 border-t text-center text-sm text-gray-600" />
            {/* --- End Footer --- */}

          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
