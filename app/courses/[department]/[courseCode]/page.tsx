import { Suspense } from 'react';
import { ArrowLeft } from "lucide-react"; 
import Link from "next/link"; 
import { Button } from "@/components/ui/button";
import { CourseInfoWrapper } from '@/components/courseInfoWrapper'; // Re-use the wrapper
import { CourseInfoSkeleton } from '@/components/ui/courseInfoSkeleton'; // Re-use the skeleton

// Define the expected params shape
interface CoursePageParams {
    department: string;
    courseCode: string;
  }
  

// Use the correct props interface
export default async function DedicatedCoursePage({ params }:
    {
        params: CoursePageParams; // Expecting department and courseCode in params
    }) {
    const { department, courseCode } = params;
    const isValidParams = !!department && !!courseCode && typeof department === 'string' && typeof courseCode === 'string';

    return (
        // Main content area styling for this specific page layout
        <div className="flex-1 bg-[#f5f5f0] flex flex-col">
            {/* No mobile header needed here unless desired */}
            <main className="flex-1 overflow-y-auto container mx-auto py-8 px-4">
                {/* Back Button */}
                <div className="mb-6">
                    <Link href="/"> {/* Link back to the main checker page */}
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Checker
                        </Button>
                    </Link>
                </div>

                {/* Results Area: Conditionally render based on params validity */}
                <div className="results-area">
                    {isValidParams ? (
                        // If params seem valid, attempt to fetch/display results
                        <Suspense fallback={<CourseInfoSkeleton />}>
                            {/* Use the same wrapper, passing params */}
                            <CourseInfoWrapper department={department} code={courseCode} />
                        </Suspense>
                    ) : (
                        // If params are invalid/missing
                        <div className="p-6 border rounded-md bg-white text-center md:w-2/3 lg:w-1/2 mx-auto shadow-sm">
                             <p className="text-red-600 font-medium">
                                 Invalid URL: Missing or incorrect course department/code.
                             </p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

// Optional: Add generateStaticParams if you want to pre-render some popular course pages at build time
// export async function generateStaticParams() {
//   // Fetch a list of courses you want to pre-render
//   // const courses = await getListOfPopularCourses(); // Example function
//   // return courses.map((course) => ({
//   //   department: course.department.toLowerCase(),
//   //   courseCode: course.code,
//   // }));
//   return []; // Return empty array if no pre-rendering needed now
// }