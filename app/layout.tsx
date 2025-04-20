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
    <html lang="en" suppressHydrationWarning>
<<<<<<< HEAD
      <body className={cn("min-h-screen font-sans antialiased", afacad.variable, libreBaskerville.variable, caveat.variable)}>
        <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
        >
=======
      <body
        className={cn(
          "min-h-screen font-sans antialiased",
          afacad.variable,
          libreBaskerville.variable,
          caveat.variable
        )}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
>>>>>>> 3dd7bed (feat: Added a feeback card where people can submit feedback and course requests)
          <QueryProvider>
            <div className="relative flex min-h-screen flex-col">
              <header className="sticky top-0 z-50 w-full border-b border-border bg-card p-2 text-card-foreground backdrop-blur-md">
                  <HeaderNav />
              </header>
              <main className="flex-1">
                {children}
                <SpeedInsights />
                <Analytics />
              </main>
              <Footer className="border-t py-4 px-6 text-center text-sm text-muted-foreground" />
            </div>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}