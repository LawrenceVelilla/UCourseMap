import { ChevronRight, Search, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sidebar } from "@/components/sidebar"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="flex min-h-screen bg-[#f5f5f0]">
      {/* Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Mobile Header */}
        <header className="md:hidden bg-[#283618] text-[#DAD7CD] p-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">UniPlanner</h1>
          <Button variant="ghost" size="icon" className="text-white">
            <User size={20} />
          </Button>
        </header>

        {/* Hero Section */}
        <section className="bg-[#283618] text-[#DAD7CD] py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">UniPlanner</h1>
            <p className="text-xl md:text-2xl mb-8">Your One-stop University of Alberta Course Planner</p>
            <div className="relative max-w-xl">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <Input
                type="text"
                placeholder="Search for courses (e.g., CMPUT 174, MATH 125)"
                className="pl-10 bg-white text-gray-800 rounded-xl"
              />
            </div>
          </div>
        </section>

        {/* Main Features */}
        <section className="py-12 px-6">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="planner" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="prerequisites">Prerequisite Checker</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              </TabsList>

      

              <TabsContent value="prerequisites" className="space-y-6">
                <h2 className="text-2xl font-bold text-[#2d3a2d]">Check Course Prerequisites</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Prerequisite Checker</CardTitle>
                    <CardDescription>Verify if you meet the requirements for a course</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex gap-2">
                        <Input placeholder="Enter course code (e.g., CMPUT 272)" className="flex-1" />
                        <Button className="bg-[#606c5d] hover:bg-[#4a5349]">Check</Button>
                      </div>
                      <div className="p-4 border rounded-md bg-[#f0f0e8]">
                        <p className="text-center text-gray-500">
                          Enter a course code to check its prerequisites and if you're eligible to take it
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-6">
                <h2 className="text-2xl font-bold text-[#2d3a2d]">Course Recommendations</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Personalized Suggestions</CardTitle>
                    <CardDescription>Based on your program and completed courses</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500">
                        Sign in to get personalized course recommendations based on your academic history and program
                        requirements.
                      </p>
                      <Button className="bg-[#606c5d] hover:bg-[#4a5349]">Sign In to View Recommendations</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Footer */}
        <Footer className="bg-[#f0f0e8] py-6 px-6 border-t max-w-6xl mx-auto text-center" />
      </div>
    </div>
  )
}

