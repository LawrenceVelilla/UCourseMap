// Main Page: Displays search form and conditionally shows results via CourseInfoWrapper

import { Suspense } from 'react'; 
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CourseInfoWrapper } from '@/components/courseInfoWrapper'; 
import { CourseInfoSkeleton } from '@/components/ui/courseInfoSkeleton'; 
import CourseSearchInput from '@/components/CourseSearchInput'; // Import the new component

// This page uses searchParams to determine which course to display
export default async function PrerequisitesPage({
    searchParams
}: any) {
    const params = searchParams
    const dept = params?.dept || '';
    const code = params?.code || '';

    // Determine if valid search parameters are present to trigger data fetching
    // Ensure they are non-empty strings
    const shouldFetchData = !!dept && !!code && typeof dept === 'string' && typeof code === 'string';

    return (
        // Using flex-col min-h-screen structure from RootLayout often handles overall height
        // This component focuses on the main content area
        <div className="flex-1 bg-[#f5f5f0] flex flex-col"> {/* Main content area styling */}

            {/* Scrollable Main Content Area */}
            <main className="flex-1 overflow-y-auto container mx-auto py-8 px-4">

                {/* Top Section: Title and Search Form */}
                <div className="md:w-2/3 lg:w-1/2 mx-auto mb-8"> {/* Constrain width and center */}
                    <h1 className="text-4xl md:text-5xl font-bold mb-2 text-center text-gray-800">Uni Planner</h1>
                    <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-600 text-center">Prerequisite Checker</h2>

                    {/* Dedicated Card for the Search Form */}
                    <Card className="shadow-md border border-gray-200">
                        <CardHeader>
                            <CardTitle>Check Course Requirements</CardTitle>
                            <CardDescription>
                                Enter a course code (e.g., "CMPUT 272") to find its prerequisites.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4"> {/* Add space-y for spacing */}
                            {/* Keep the enhanced search input component */}
                            <CourseSearchInput />
                        </CardContent>
                    </Card>
                </div>

                {/* Results Area: Conditionally renders based on search params */}
                <div className="mt-6 results-area">
                    {shouldFetchData ? (
                        // If search params exist, attempt to fetch/display results
                        // Wrap the data-fetching component in Suspense
                        <Suspense fallback={<CourseInfoSkeleton />}>
                            {/* CourseInfoWrapper handles fetching, error states, and rendering CourseResultDisplay */}
                            {/* Pass validated dept and code */}
                            <CourseInfoWrapper department={dept} code={code} />
                        </Suspense>
                    ) : (
                        // If no search params, show initial prompt message
                        <div className="p-6 border rounded-md bg-white text-center md:w-2/3 lg:w-1/2 mx-auto shadow-sm">
                            <p className="text-muted-foreground">
                                Enter a course code above to check its prerequisites and view related information.
                            </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}