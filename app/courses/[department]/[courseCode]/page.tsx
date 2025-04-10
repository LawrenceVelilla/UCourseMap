import { Suspense } from 'react';
import { ArrowLeft } from "lucide-react"; 
import Link from "next/link"; 
import { Button } from "@/components/ui/button";
<<<<<<< HEAD
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sidebar } from "@/components/sidebar"; // Assuming Sidebar is part of layout now?
=======
import { CourseInfoWrapper } from '@/components/courseInfoWrapper'; // Re-use the wrapper
import { CourseInfoSkeleton } from '@/components/ui/courseInfoSkeleton'; // Re-use the skeleton
>>>>>>> 2f8510a (Fixed parsing issues, and Implemented new UI version(BENTO))

// Define the expected params shape
interface DedicatedCoursePageProps {
    params: {
        department?: string;
        courseCode?: string;
    };
    // searchParams are not typically used directly on dynamic route pages like this
}

// Use the correct props interface
export default async function DedicatedCoursePage({ params }: DedicatedCoursePageProps) {
    const { department, courseCode } = await params;
    const isValidParams = !!department && !!courseCode && typeof department === 'string' && typeof courseCode === 'string';

<<<<<<< HEAD


// --- Main Server Component for the Dedicated Course Page ---
// Use the Corrected Props Interface
<<<<<<< HEAD
export default async function DedicatedCoursePage({ 
    params,
    searchParams 
  }: {
    params: { department: string; courseCode: string };
    searchParams: Record<string, string | string[] | undefined>;
  }) {
    // Destructure department and course code from 'params' NOT 'searchParams'
    const { department: deptParam, courseCode: codeParam } = params;
=======
export default async function DedicatedCoursePage({ params, searchParams }: Record<string, any>) {
    // Type assertion inside the function if needed
    const { department: deptParam, courseCode: codeParam } = params as { 
      department: string; 
      courseCode: string 
    }; 

>>>>>>> fa9b03f (Trying to bypass type limitations for now)

    // Normalize for fetching (lowercase dept, ensure code is string)
    const dept = deptParam?.toLowerCase();
    const code = typeof codeParam === 'string' ? codeParam : undefined;

    // --- State Variables ---
    let displayCourseData: Awaited<ReturnType<typeof getCourseAndPrerequisiteData>> | null = null;
    let recursiveGraphData: Awaited<ReturnType<typeof getRecursivePrerequisites>> | null = null;
    let fetchError: string | null = null;
    let notFoundError: boolean = false;
    const targetCourseCode = dept && code ? `${dept.toUpperCase()} ${code}` : null;

    // --- Fetch Data (based on URL params) ---
    if (dept && code && targetCourseCode) {
        console.log(`Fetching data for dedicated page: ${targetCourseCode}...`);
        try {
            // No need to validate format here as much, Next.js routing handles it somewhat
            // Fetch recursive data first
            recursiveGraphData = await getRecursivePrerequisites(dept, code);
            const targetNodeExists = recursiveGraphData?.nodes.some(node => node.courseCode === targetCourseCode);

            if (!targetNodeExists) {
                notFoundError = true;
            } else {
                // Fetch simple display data
                 displayCourseData = await getCourseAndPrerequisiteData(dept, code);
                 if (!displayCourseData?.targetCourse) {
                     notFoundError = true; // Or set fetchError
                 }
            }
        } catch (error) {
            console.error(`Error fetching course data for ${targetCourseCode}:`, error);
            fetchError = error instanceof Error ? error.message : "An unknown error occurred.";
        }
    } else {
        // Handle cases where params might be missing/invalid (though routing usually prevents this)
        fetchError = "Invalid course parameters in URL.";
    }

    // --- Prepare Graph Input Data ---
    // (Logic remains the same as before, using recursiveGraphData)
    const graphInputNodes: InputNode[] = [];
    const graphInputEdges: AppEdge[] = [];
    // ... (populate graphInputNodes and graphInputEdges based on recursiveGraphData) ...
     const allCourseNodeIds = new Set(recursiveGraphData?.nodes.map(n => n.courseCode) ?? []);
     if (recursiveGraphData) {
         recursiveGraphData.nodes.forEach(node => graphInputNodes.push({ id: node.courseCode, type: 'default', data: { label: node.courseCode, isCourse: true, type: (node.courseCode === targetCourseCode) ? 'target' : 'prerequisite' } }));
         recursiveGraphData.edges.forEach((edge, index) => { /* ... handle text nodes and add to graphInputEdges ... */
            const targetIsCourse = allCourseNodeIds.has(edge.target);
             if (targetIsCourse) { graphInputEdges.push({ id: `edge-${edge.source}-${edge.target}-${index}`, source: edge.source, target: edge.target }); }
             else {
                 const textNodeId = `text-${edge.target}`;
                 if (!graphInputNodes.some(n => n.id === textNodeId)) { graphInputNodes.push({ id: textNodeId, type: 'default', data: { label: edge.target, isCourse: false, type: 'text_requirement'}, style: { background: '#fffbdd', border: '1px dashed #e6db74', fontSize: '12px', fontStyle: 'italic', padding: '8px 12px', textAlign: 'center', height: 60, width: 180 } }); }
                 graphInputEdges.push({ id: `edge-${edge.source}-${textNodeId}-${index}`, source: edge.source, target: textNodeId });
             }
         });
     }


    // --- Render Page UI ---
=======
>>>>>>> 2f8510a (Fixed parsing issues, and Implemented new UI version(BENTO))
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