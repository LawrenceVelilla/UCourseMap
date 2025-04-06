import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { Afacad, Caveat, Libre_Baskerville } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"

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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${afacad.variable} ${libreBaskerville.variable} ${caveat.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

