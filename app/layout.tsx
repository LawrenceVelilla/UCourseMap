import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { Afacad, Caveat, Libre_Baskerville } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Footer } from "@/components/footer"
import { HeaderNav } from "@/components/headerNav"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Analytics } from "@vercel/analytics/next"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import QueryProvider from "@/components/QueryProvider"

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
      url: "/opengraph-image.png",
      width: 1200,
      height: 630,
      alt: "UniPlanner - University of Alberta Course Planner",
      }
    ]
  },
  icons: {
    icon: "/icons/uniplannerplannerlogo.svg",
    shortcut: "/icons/uniplannerplannerlogo.svg",
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
          {/* Wrap the main layout structure with QueryProvider */}
          <QueryProvider>
            {/* Main Layout Structure: Header, Content, Footer */}
            <div className="relative flex min-h-screen flex-col bg-[#f5f5f0]"> 
              <header className="top-0 justify-end sticky z-50 w-full p-2 border-b border-[#4a5349] bg-[#38432b] text-[#DAD7CD] backdrop-blur-md"> 
                  <HeaderNav />
              </header>
              {/* --- End Site Header --- */}


              {/* --- Main Content Area --- */}
              {/* flex-1 makes this grow to fill space between header and footer */}
              <main className="flex-1">
                {children} {/* Your page content renders here */}
                <SpeedInsights />
                <Analytics />
              </main>
              {/* --- End Main Content Area --- */}


              {/* --- Footer --- */}
              {/* Kept at the bottom */}
              <Footer className="bg-[#f0f0e8] py-4 px-6 border-t text-center text-sm text-gray-600" />
              {/* --- End Footer --- */}

            </div>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
