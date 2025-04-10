
// Main Page: Displays search form and conditionally shows results via CourseInfoWrapper

import { Suspense } from 'react'; 
import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getCourseAndPrerequisiteData, getRecursivePrerequisites } from '@/lib/data'; // Import both fetchers
import { Course, RequirementCondition } from '@/lib/types';
import { PrerequisiteCheckerForm } from '@/components/PrerequisiteCheckerForm';
import { RequirementConditionDisplay } from '@/components/requirementConditionDisplay';
import PrerequisiteGraphWrapper, {
    type InputNode, 
    type AppEdge,   
    type GraphNodeData 
} from '@/components/prerequisiteGraph'; 
<<<<<<< HEAD
interface PrerequisitesPageProps {
    searchParams?: {
        dept?: string;
        code?: string;
    };
}
export default async function PrerequisitesPage({ searchParams }: PrerequisitesPageProps) {
=======




// TODDOOO:
// ADD coures/[department]/[courseCode]/route.ts back so I can use it for the CSF stuff like dynamic rendering and autocomplete







// interface PrerequisitesPageProps {
//     searchParams?: {
//         dept?: string;
//         code?: string;
//     };
// }
export default async function PrerequisitesPage({ searchParams }: { searchParams?: Record<string, any> }) {
>>>>>>> fa9b03f (Trying to bypass type limitations for now)
    const param = await searchParams
    
    const dept = param?.dept;
    const code = param?.code;

    // State variables
    let displayCourseData: Awaited<ReturnType<typeof getCourseAndPrerequisiteData>> | null = null;
    let recursiveGraphData: Awaited<ReturnType<typeof getRecursivePrerequisites>> | null = null;
    let fetchError: string | null = null;
    let notFoundError: boolean = false;
    const targetCourseCode = dept && code ? `${dept.toUpperCase()} ${code}` : null; // Store full code

    // --- Fetch Data ---
    if (dept && code && targetCourseCode) {
        console.log(`Fetching data for ${targetCourseCode}...`);
        try {
            if (!/^[a-z]+$/.test(dept) || !/^\d+[a-z]*$/.test(code)) { throw new Error("Invalid URL format."); }

            // Fetch recursive data for the graph
            recursiveGraphData = await getRecursivePrerequisites(dept, code);

            const targetNodeExists = recursiveGraphData?.nodes.some(node => node.courseCode === targetCourseCode);

            if (!targetNodeExists) {
                console.log(`Target course ${targetCourseCode} not found via recursive search.`);
                notFoundError = true;
            } else {
                console.log(`Recursive data fetched: ${recursiveGraphData.nodes.length} nodes, ${recursiveGraphData.edges.length} edges`);
                // Also fetch simple display data for the list view
                 displayCourseData = await getCourseAndPrerequisiteData(dept, code);
                 if (!displayCourseData?.targetCourse) {
                     console.warn("Target course found recursively but not via direct fetch?");
                     fetchError = "Inconsistent data found for target course."; // Handle potential inconsistency
                 }
            }
        } catch (error) {
            console.error(`Error fetching course data for ${targetCourseCode}:`, error);
            fetchError = error instanceof Error ? error.message : "An unknown error occurred.";
        }
=======
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PrerequisiteCheckerForm } from '@/components/PrerequisiteCheckerForm'; 
import { CourseInfoWrapper } from '@/components/courseInfoWrapper'; 
import { CourseInfoSkeleton } from '@/components/ui/courseInfoSkeleton'; 

// This page uses searchParams to determine which course to display
export default async function PrerequisitesPage({
    searchParams
<<<<<<< HEAD
}: {
    searchParams?: {
        dept?: string;
        code?: string;
>>>>>>> 2f8510a (Fixed parsing issues, and Implemented new UI version(BENTO))
    }
}) {
    const params = await searchParams;
=======
}: any) {
    const params = searchParams
>>>>>>> 97db37b (More any clauses for param --> Fix later please)
    const dept = params?.dept || '';
    const code = params?.code || '';

    // Determine if valid search parameters are present to trigger data fetching
    // Ensure they are non-empty strings
    const shouldFetchData = !!dept && !!code && typeof dept === 'string' && typeof code === 'string';

    return (
        // Using flex-col min-h-screen structure from RootLayout often handles overall height
        // This component focuses on the main content area
        <div className="flex-1 bg-[#f5f5f0] flex flex-col"> {/* Main content area styling */}

            {/* Mobile Header (Optional - can be part of RootLayout instead) */}
            <header className="md:hidden bg-[#606c5d] text-white p-4 flex items-center justify-between sticky top-0 z-10">
                <h1 className="text-xl font-bold">UniPlanner</h1>
                <Button variant="ghost" size="icon" className="text-white"><BookOpen size={20} /></Button>
            </header>

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
                        <CardContent>
                            <PrerequisiteCheckerForm />
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