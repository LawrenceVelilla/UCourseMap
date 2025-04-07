import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sidebar } from "@/components/sidebar";

// Data fetching and base types
import { getCourseAndPrerequisiteData } from '@/lib/data';
import { Course, RequirementCondition } from '@/lib/types'; // Assuming these are correctly defined

// Import UI components
import { PrerequisiteCheckerForm } from '@/components/PrerequisiteCheckerForm';
import { RequirementConditionDisplay } from '@/components/requirementConditionDisplay';

// **** IMPORT THE GRAPH COMPONENT WRAPPER ****
import PrerequisiteGraphWrapper from '@/components/prerequisiteGraph';

// **** IMPORT TYPES NEEDED FOR GRAPH PROPS (or define in lib/types.ts) ****
import type { Node, Edge } from '@xyflow/react';
interface GraphNodeData extends Record<string, unknown> { label: string; type?: 'target' | 'prerequisite'; }
// Define the specific Node structure used internally by the graph component
type AppNode = Node<GraphNodeData>;
// Define the simplified structure passed as props (position etc. added by graph component)
interface InputNode extends Omit<AppNode, 'position' | 'width' | 'height' | 'style' | 'selected' | 'dragging' | 'selectable' | 'draggable' | 'hidden' | 'resizing' | 'focusable' | 'sourcePosition' | 'targetPosition'> {
  style?: React.CSSProperties;
}
type AppEdge = Edge;
// **** END TYPE IMPORTS ****


interface PrerequisitesPageProps {
    searchParams?: {
        dept?: string;
        code?: string;
    };
}

// --- Main Server Component ---
export default async function PrerequisitesPage({ searchParams }: PrerequisitesPageProps) {
    const param = await searchParams;
    const dept = param?.dept;
    const code = param?.code;

    let courseData: Awaited<ReturnType<typeof getCourseAndPrerequisiteData>> | null = null;
    let fetchError: string | null = null;
    let notFoundError: boolean = false;

    // --- Fetch Data ---
    if (dept && code) {
        console.log(`Fetching data for ${dept.toUpperCase()} ${code}...`);
        try {
            if (!/^[a-z]+$/.test(dept) || !/^\d+[a-z]*$/.test(code)) {
                 throw new Error("Invalid department or code format in URL.");
            }
            courseData = await getCourseAndPrerequisiteData(dept, code);
            if (!courseData?.targetCourse) { notFoundError = true; }
            else { console.log(`Data received for ${courseData.targetCourse.courseCode}`); }
        } catch (error) {
            console.error(`Error fetching course data for ${dept} ${code}:`, error);
            fetchError = error instanceof Error ? error.message : "An unknown error occurred.";
        }
    }

    // --- Prepare Graph Input Data (Matches InputNode / AppEdge) ---
    const graphInputNodes: InputNode[] = courseData?.targetCourse ? [
        {
            id: courseData.targetCourse.courseCode,
            type: 'default', // Base type for React Flow
            data: { // Your custom data structure
                label: `${courseData.targetCourse.courseCode}: ${courseData.targetCourse.title}`,
                type: 'target' as const
            },
            // Style overrides can optionally be passed here
            // style: { backgroundColor: 'override-color' }
        },
        ...(courseData.prerequisiteCourses?.map(prereq => ({
            id: prereq.courseCode,
            type: 'default',
            data: {
                label: `${prereq.courseCode}: ${prereq.title}`,
                type: 'prerequisite' as const
            },
        })) ?? [])
    ] : [];

    const graphInputEdges: AppEdge[] = courseData?.prerequisiteCourses?.map(prereq => ({
        id: `edge-${courseData.targetCourse!.courseCode}-${prereq.courseCode}`,
        source: courseData.targetCourse!.courseCode,
        target: prereq.courseCode,
    })) ?? [];
    // --- End Graph Input Data Preparation ---


    // --- Render Page ---
    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex flex-1"> {/* Sidebar + Main */}
                <div className="hidden md:block bg-[#f5f5f0]"><Sidebar /></div>
                <div className="flex-1 bg-[#f5f5f0] flex flex-col"> {/* Main Area */}
                    <header className="md:hidden bg-[#606c5d] text-white p-4 flex items-center justify-between sticky top-0 z-10">
                         <h1 className="text-xl font-bold">UniPlanner</h1>
                         <Button variant="ghost" size="icon" className="text-white"><BookOpen size={20} /></Button>
                    </header>
                    {/* Scrollable main content */}
                    <main className="flex-1 overflow-y-auto container mx-auto py-8 px-4">
                        {/* Back Button */}
                        <div className="flex items-center gap-2 mb-6">
                            <Link href="/">
                                <Button variant="ghost" size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Button>
                            </Link>
                        </div>

                        {/* --- Top Section: Input/Results + Empty Right Column --- */}
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Left Column: Input and Results */}
                            <div className="md:w-2/3">
                                <h1 className="text-3xl font-bold mb-6">Prerequisite Checker</h1>
                                <Card>
                                    <CardHeader><CardTitle>Check Course Requirements</CardTitle></CardHeader>
                                    <CardContent>
                                        <PrerequisiteCheckerForm />
                                        <div className="mt-6 space-y-4">
                                            {/* Error/Not Found Alerts */}
                                            {fetchError && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{fetchError}</AlertDescription></Alert>}
                                            {notFoundError && <Alert variant="default" className="bg-yellow-50 border-yellow-200"><AlertTitle>Course Not Found</AlertTitle><AlertDescription>The course {dept?.toUpperCase()} {code} could not be found.</AlertDescription></Alert>}
                                            {/* Course Details Display */}
                                            {courseData?.targetCourse && !fetchError && !notFoundError && (
                                                <div className="border rounded-md p-4 space-y-4">
                                                   <h3 className="font-medium text-lg">{courseData.targetCourse.courseCode} - {courseData.targetCourse.title}</h3>
                                                   <p className="text-sm text-gray-600">{courseData.targetCourse.parsedDescription || 'No description.'}</p>
                                                   <p className="text-sm text-gray-500">Credits: {courseData.targetCourse.units?.credits ?? 'N/A'}</p>
                                                    {/* Prerequisites List */}
                                                    <div>
                                                        <h4 className="font-medium mb-2">Prerequisites:</h4>
                                                        {(courseData.targetCourse.requirements?.prerequisites?.courses?.length || courseData.targetCourse.requirements?.prerequisites?.conditions?.length) ? (<RequirementConditionDisplay condition={courseData.targetCourse.requirements.prerequisites} />) : (<p className="text-sm text-gray-500">None listed.</p>)}
                                                    </div>
                                                    {/* Corequisites List */}
                                                    <div>
                                                        <h4 className="font-medium mb-2">Corequisites:</h4>
                                                        {(courseData.targetCourse.requirements?.corequisites?.courses?.length || courseData.targetCourse.requirements?.corequisites?.conditions?.length) ? (<RequirementConditionDisplay condition={courseData.targetCourse.requirements.corequisites} />) : (<p className="text-sm text-gray-500">None listed.</p>)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            {/* Right Column: Empty or for future use */}
                            <div className="md:w-1/3">
                                {/* Content removed, card kept as placeholder? Or remove card too? */}
                                {/* <Card className="mt-6 md:mt-[92px]">
                                    <CardHeader><CardTitle>Notes/Other Info</CardTitle></CardHeader>
                                    <CardContent><p className="text-sm text-gray-500">Placeholder</p></CardContent>
                                </Card> */}
                            </div>
                        </div>
                        {/* --- End Top Section --- */}


                        {/* --- NEW Bottom Section: Prerequisite Graph --- */}
                        <div className="mt-8 md:mt-12"> {/* Add vertical spacing */}
                             <Card>
                                <CardHeader>
                                    <CardTitle>Prerequisite Tree</CardTitle>
                                    <CardDescription>Visual representation of direct prerequisites</CardDescription>
                                </CardHeader>
                                <CardContent>
                                     {/* Conditionally render graph or placeholder */}
                                     {(dept && code && !fetchError && !notFoundError) ? ( // Condition: Search attempted and successful
                                        graphInputNodes.length > 0 ? (
                                            // Render the wrapper, passing the prepared data
                                            <PrerequisiteGraphWrapper initialNodes={graphInputNodes} initialEdges={graphInputEdges} />
                                        ) : (
                                             // Course found, but no graph nodes generated (e.g., no prerequisites)
                                             <div className="p-4 text-center">
                                                 <p className="text-sm text-gray-500">No direct prerequisites to visualize for {dept.toUpperCase()} {code}.</p>
                                             </div>
                                        )
                                    ) : (
                                        // Placeholder before search or if search failed
                                        <div className="p-4 text-center h-[100px] flex items-center justify-center"> {/* Give placeholder some height */}
                                            <p className="text-sm text-gray-500">
                                                {fetchError ? 'Error loading data.' : (notFoundError ? `Course ${dept?.toUpperCase()} ${code} not found.` : 'Check a course above to view its prerequisite tree.')}
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                             </Card>
                        </div>
                        {/* --- End Bottom Section --- */}

                    </main> {/* End Main scrollable area */}
                </div> {/* End Main Content Area Column */}
            </div> {/* End Sidebar + Main container */}
            <Footer className="bg-[#f0f0e8] py-6 px-6 border-t text-center w-full" />
        </div> // End Outermost container
    );
}