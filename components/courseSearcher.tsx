'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export async function CourseSearcher() {
  const [courseCode, setCourseCode] = useState("")
  const router = useRouter()

  const handleSearch = () => {
    if (courseCode) {
      router.push(`/prerequisites/${courseCode}`)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Search</CardTitle>
        <CardDescription>Enter a course code to check its prerequisites</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Enter course code (e.g., CMPUT 272)"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value.toUpperCase())}
          />
          <Button onClick={handleSearch}>Search</Button>
        </div>
      </CardContent>
    </Card>
  )
}

