import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sidebar } from "@/components/sidebar"; // Assuming Sidebar is part of layout now?
export const dynamic = 'force-dynamic'; // Ensure this page is always server-rendered

// Data fetching and base types
import { getCourseAndPrerequisiteData, getRecursivePrerequisites } from '@/lib/data';
import { Course, RequirementCondition } from '@/lib/types';

// UI Components (Consider if Form is needed here, probably not)
// import { PrerequisiteCheckerForm } from '@/components/PrerequisiteCheckerForm';
import { RequirementConditionDisplay } from '@/components/requirementConditionDisplay';
import PrerequisiteGraphWrapper, {
    type InputNode, type AppEdge, type GraphNodeData
} from '@/components/prerequisiteGraph';



// --- Main Server Component for the Dedicated Course Page ---
// Use the Corrected Props Interface
export default async function DedicatedCoursePage({ params, searchParams }: Record<string, any>) {
    // Type assertion inside the function if needed
    const { department: deptParam, courseCode: codeParam } = params as { 
      department: string; 
      courseCode: string 
    }; 


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
    return (
        // This content is rendered *within* the RootLayout
        // No need for outer flex divs or Footer here if handled by layout.tsx
        <div className="container mx-auto py-8 px-4">
             {/* Maybe a different back button? Or none? */}
             <div className="flex items-center gap-2 mb-6">
                 <Link href="/"> {/* Link back to checker/home */}
                     <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Checker</Button>
                 </Link>
             </div>

             {/* Display Errors or Content */}
             {fetchError && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{fetchError}</AlertDescription></Alert>}
             {notFoundError && <Alert variant="default"><AlertTitle>Not Found</AlertTitle><AlertDescription>Course {targetCourseCode} could not be found.</AlertDescription></Alert>}

             {displayCourseData?.targetCourse && !fetchError && !notFoundError && (
                // Main content structure for this dedicated page
                <div className="space-y-8">
                    {/* Course Header Info */}
                    <div>
                        <h1 className="text-3xl font-bold">{displayCourseData.targetCourse.courseCode} - {displayCourseData.targetCourse.title}</h1>
                        <p className="text-sm text-gray-500 mt-1">Credits: {displayCourseData.targetCourse.units?.credits ?? 'N/A'} | Term: {displayCourseData.targetCourse.units?.term ?? 'N/A'}</p>
                        <p className="mt-4 text-base">{displayCourseData.targetCourse.parsedDescription || 'No description available.'}</p>
                    </div>

                     {/* Prerequisites List Card */}
                     <Card>
                        <CardHeader><CardTitle>Prerequisites Details</CardTitle></CardHeader>
                        <CardContent>
                             {(displayCourseData.targetCourse.requirements?.prerequisites && (displayCourseData.targetCourse.requirements.prerequisites.courses?.length || displayCourseData.targetCourse.requirements.prerequisites.conditions?.length))
                                ? (<RequirementConditionDisplay condition={displayCourseData.targetCourse.requirements.prerequisites} />)
                                : (<p className="text-sm text-gray-500">None listed.</p>)
                             }
                        </CardContent>
                     </Card>

                      {/* Corequisites List Card */}
                      <Card>
                        <CardHeader><CardTitle>Corequisites Details</CardTitle></CardHeader>
                        <CardContent>
                             {(displayCourseData.targetCourse.requirements?.corequisites && (displayCourseData.targetCourse.requirements.corequisites.courses?.length || displayCourseData.targetCourse.requirements.corequisites.conditions?.length))
                                ? (<RequirementConditionDisplay condition={displayCourseData.targetCourse.requirements.corequisites} />)
                                : (<p className="text-sm text-gray-500">None listed.</p>)
                             }
                        </CardContent>
                     </Card>

                    {/* Prerequisite Graph Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Prerequisite Dependency Graph</CardTitle>
                            <CardDescription>Visual representation of dependencies.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-gray-500 mb-4 italic">Note: Graph shows dependencies based on listed prerequisites, not detailed AND/OR logic.</p>
                            {graphInputNodes.length > 0 || graphInputEdges.length > 0 ? (
                                <PrerequisiteGraphWrapper initialNodes={graphInputNodes} initialEdges={graphInputEdges} />
                            ) : (
                                <div className="p-4 text-center h-[100px] flex items-center justify-center"><p className="text-sm text-gray-500">No prerequisite dependencies found.</p></div>
                            )}
                        </CardContent>
                    </Card>
                </div>
             )}
        </div> // End container
    );
}