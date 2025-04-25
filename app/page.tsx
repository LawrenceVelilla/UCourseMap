// Main Page: Displays search form and conditionally shows results via CourseInfoWrapper

<<<<<<< HEAD
import { Suspense } from 'react'; 
import { BookOpen } from "lucide-react";
=======
import { Suspense } from "react";
>>>>>>> 2189e6d (feat: Implement Intial MVP for the Plan Builder and Program Planner)
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

<<<<<<< HEAD
    return (
        // Remove explicit background classes from this div
        // Let the background from the body (via CSS variables) show through
        <div className="flex-1 flex flex-col"> 

            {/* Scrollable Main Content Area */}
            <main className="flex-1 overflow-y-auto container mx-auto py-8 px-4">

                {/* Top Section: Title and Search Form */}
                <div className="md:w-2/3 lg:w-1/2 mx-auto mb-8"> {/* Constrain width and center */}
                    <h1 className="text-4xl md:text-5xl font-bold mb-2 text-center text-gray-800 dark:text-gray-200">Uni Planner</h1>
                    <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-600 dark:text-gray-400 text-center">Prerequisite Checker</h2>

                    {/* Dedicated Card for the Search Form */}
                    <Card className="shadow-lg border-2 frosted border-border dark:border-border">
                        <CardHeader>
                            <CardTitle>Check Course Requirements</CardTitle>
                            <CardDescription className='text-muted-foreground dark:text-muted-foreground'>
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
                        <div className="p-6 border rounded-md bg-card border-border frosted text-center md:w-2/3 lg:w-1/2 mx-auto shadow-sm">
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
=======
  return (
    // Remove explicit background classes from this div
    // Let the background from the body (via CSS variables) show through
    <div className="flex-1 flex flex-col">
      {/* Scrollable Main Content Area */}
      <main className="flex-1 overflow-y-auto container mx-auto py-8 px-4">
        {/* Top Section: Title and Search Form */}
        <div className="md:w-2/3 lg:w-1/2 mx-auto mb-8">
          {" "}
          {/* Constrain width and center */}
          <h1 className="text-4xl md:text-5xl font-bold mb-2 text-center text-gray-800 dark:text-gray-200">
            UCourse Map
          </h1>
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-600 dark:text-gray-400 text-center">
            Prerequisite Checker
          </h2>
          {/* Dedicated Card for the Search Form */}
          <Card className="shadow-lg border-2 frosted border-border dark:border-border">
            <CardHeader>
              <CardTitle>Check Course Requirements</CardTitle>
              <CardDescription className="text-muted-foreground dark:text-muted-foreground">
                <span className="font-bold">
                  Note: The suggestion bar only displays the first 10 results
                </span>{" "}
                so if you don&apos;t see the class you&apos;re looking for, please make your search
                more specific.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add space-y for spacing */}
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
            <div className="p-6 border rounded-md bg-card border-border frosted text-center md:w-2/3 lg:w-1/2 mx-auto shadow-sm">
              <p className="text-muted-foreground">
                Enter a course code above to check its prerequisites and view related information.
              </p>
            </div>
          )}
        </div>

        {/* {{ Feedback Section }} */}
        <div className="mt-12 pt-8 border-t border-border/40 flex justify-center">
          <Card className="w-full max-w-2xl shadow-sm border-border/60 frosted">
            <CardHeader>
              <CardTitle className="text-lg text-center">Missing Data or Feedback?</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-sm text-muted-foreground">
                No info for your department/class? Please let me know by filling out this form!
                Also, feel free to give me some feedback and features you&apos;d like to see!
              </p>
              <Button asChild variant="outline">
                <a
                  href="https://docs.google.com/forms/d/e/1FAIpQLSdx5Gnh4yrNRxSBEBRQAnmGVX1biHqYag-ZZyg58zRTFEI5Sg/viewform?usp=header"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Provide Feedback / Request Course
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
>>>>>>> 3dd7bed (feat: Added a feeback card where people can submit feedback and course requests)
