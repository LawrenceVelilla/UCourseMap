import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
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
interface PrerequisitesPageProps {
    searchParams?: {
        dept?: string;
        code?: string;
    };
}
export default async function PrerequisitesPage({ searchParams }: PrerequisitesPageProps) {
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
    }

    // Need to prep the data for recursion
    const graphInputNodes: InputNode[] = []; 
    const processedEdges: AppEdge[] = [];  
    const allNodeIds = new Set(recursiveGraphData?.nodes.map(n => n.courseCode) ?? []); // Store IDs of actual courses fetched

    if (recursiveGraphData) {
        recursiveGraphData.nodes.forEach(node => {
            graphInputNodes.push({
                // Conforms to InputNode type (id, data required)
                id: node.courseCode,
                type: 'default', // Base React Flow type
                data: { // Conforms to GraphNodeData
                    label: node.courseCode, // Show only course code on node
                    isCourse: true,         // Mark as a course
                    type: (node.courseCode === targetCourseCode) ? 'target' : 'prerequisite' // Mark target vs prereq
                },
                // TODO: Add more data if needed and change the style depending on requirements
            });
        });

        // 2. Process edges, creating text nodes for non-course targets
        recursiveGraphData.edges.forEach((edge, index) => {
            const targetIsCourse = allNodeIds.has(edge.target); // Check if target is a fetched course

            if (targetIsCourse) {
                // Target is a course -> Create a standard edge
                processedEdges.push({
                    // Conforms to AppEdge type (id, source, target required)
                    id: `edge-${edge.source}-${edge.target}-${index}`, // Unique ID
                    source: edge.source,
                    target: edge.target,
                });
            } else {
                // Target is NOT a course -> Create a text node and edge to it
                const textNodeId = `text-${edge.target}`; // Unique ID for the text node
                // Add the text node to graphInputNodes *only if it doesn't exist yet*
                if (!graphInputNodes.some(n => n.id === textNodeId)) {
                     graphInputNodes.push({
                        id: textNodeId,
                        type: 'default',
                        data: {
                            label: edge.target, // Use the text as the label
                            isCourse: false,   // Mark as NOT a course
                            type: 'text_requirement' // Custom type for styling
                        },
                        // Apply specific style for text nodes directly here
                        style: { background: '#fffbdd', border: '1px dashed #e6db74', fontSize: '12px', fontStyle: 'italic', padding: '8px 12px', textAlign: 'center', height: 60, width: 180 }
                    });
                }
                // Create an edge pointing from the source course to the text node
                processedEdges.push({
                    id: `edge-${edge.source}-${textNodeId}-${index}`, // Unique ID
                    source: edge.source,
                    target: textNodeId, // Target the newly created/existing text node
                });
            }
        });
    }

    const graphInputEdges: AppEdge[] = processedEdges;

    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex flex-1"> {/* Sidebar + Main */}
                <div className="flex-1 bg-[#f5f5f0] flex flex-col"> {/* Main Area */}
                    <header className="md:hidden bg-[#606c5d] text-white p-4 flex items-center justify-between sticky top-0 z-10">
                         <h1 className="text-xl font-bold">UniPlanner</h1>
                         <Button variant="ghost" size="icon" className="text-white"><BookOpen size={20} /></Button>
                    </header>
                    {/* Scrollable Content */}
                    <main className="flex-1 overflow-y-auto container mx-auto py-8 px-4">                    
                        {/* Top Section: Input/Results + Empty Right */}
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Left Column */}
                            <div className="md:w-2/3">
                                <h1 className="text-6xl font-bold mb-6">Uni Planner</h1>
                                <h1 className="text-3xl font-bold mb-6">Prerequisite Checker</h1>
                                <Card>
                                    <CardHeader><CardTitle>Check Course Requirements</CardTitle></CardHeader>
                                    <CardContent>
                                        <PrerequisiteCheckerForm />
                                        {/* List Display Area (Uses displayCourseData) */}
                                        <div className="mt-6 space-y-4">
                                            {fetchError && <Alert variant="destructive"><AlertTitle>Error</AlertTitle><AlertDescription>{fetchError}</AlertDescription></Alert>}
                                            {notFoundError && <Alert variant="default" className="bg-yellow-50 border-yellow-200"><AlertTitle>Course Not Found</AlertTitle><AlertDescription>The course {targetCourseCode} could not be found.</AlertDescription></Alert>}
                                            {displayCourseData?.targetCourse && !fetchError && !notFoundError && (
                                                <div className="border rounded-md p-4 space-y-4">
                                                   <h3 className="font-medium text-lg">{displayCourseData.targetCourse.courseCode} - {displayCourseData.targetCourse.title}</h3>
                                                   <p className="text-sm text-gray-600">{displayCourseData.targetCourse.parsedDescription || 'No description.'}</p>
                                                   <p className="text-sm text-gray-500">Credits: {displayCourseData.targetCourse.units?.credits ?? 'N/A'}</p>
                                                    {/* Accurate Prerequisites List */}
                                                    <div>
                                                        <h4 className="font-medium mb-2">Prerequisites Details:</h4>
                                                        {(displayCourseData.targetCourse.requirements?.prerequisites && (displayCourseData.targetCourse.requirements.prerequisites.courses?.length || displayCourseData.targetCourse.requirements.prerequisites.conditions?.length)) ? (<RequirementConditionDisplay condition={displayCourseData.targetCourse.requirements.prerequisites} />) : (<p className="text-sm text-gray-500">None listed.</p>)}
                                                    </div>
                                                    {/* Accurate Corequisites List */}
                                                    <div>
                                                        <h4 className="font-medium mb-2">Corequisites Details:</h4>
                                                        {(displayCourseData.targetCourse.requirements?.corequisites && (displayCourseData.targetCourse.requirements.corequisites.courses?.length || displayCourseData.targetCourse.requirements.corequisites.conditions?.length)) ? (<RequirementConditionDisplay condition={displayCourseData.targetCourse.requirements.corequisites} />) : (<p className="text-sm text-gray-500">None listed.</p>)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            {/* Right Column */}
                            <div className="md:w-1/3"> {/* Empty */} </div>
                        </div>

                        {/* Bottom Section: Multi-Level Prerequisite Graph */}
                        <div className="mt-8 md:mt-12">
                             <Card>
                                <CardHeader>
                                    <CardTitle>Prerequisite Dependency Graph</CardTitle>
                                    <CardDescription>Visual representation of prerequisite dependencies (recursive).</CardDescription>
                                </CardHeader>
                                <CardContent>
                                     <p className="text-xs text-gray-500 mb-4 italic">Note: This graph shows dependencies but does not explicitly visualize AND/OR logic (see details list above).</p>
                                     {/* Conditionally render graph based on successful fetch */}
                                     {(targetCourseCode && !fetchError && !notFoundError) ? (
                                        // Render graph if nodes or edges were generated
                                        graphInputNodes.length > 0 || graphInputEdges.length > 0 ? (
                                            // Pass the prepared multi-level data
                                            <PrerequisiteGraphWrapper initialNodes={graphInputNodes} initialEdges={graphInputEdges} />
                                        ) : (
                                             // Target course exists, but no prereqs found recursively
                                             <div className="p-4 text-center h-[100px] flex items-center justify-center"><p className="text-sm text-gray-500">No prerequisite dependencies found for {targetCourseCode}.</p></div>
                                        )
                                    ) : (
                                        // Placeholder before search or if fetch failed/not found
                                        <div className="p-4 text-center h-[100px] flex items-center justify-center"><p className="text-sm text-gray-500">{fetchError ? 'Error loading graph data.' : (notFoundError ? `Cannot display graph: Course not found.` : 'Check a course.')}</p></div>
                                    )}
                                </CardContent>
                             </Card>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}