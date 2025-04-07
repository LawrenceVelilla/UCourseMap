import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sidebar } from "@/components/sidebar";

// --- Data Fetching & Types ---
// Import BOTH data fetching functions again
import { getCourseAndPrerequisiteData, getRecursivePrerequisites } from '@/lib/data';
import { Course, RequirementCondition } from '@/lib/types';

// --- UI Components ---
import { PrerequisiteCheckerForm } from '@/components/PrerequisiteCheckerForm';
import { RequirementConditionDisplay } from '@/components/requirementConditionDisplay'; // Corrected casing
import PrerequisiteGraphWrapper from '@/components/prerequisiteGraph'; // Import graph wrapper

// --- Graph-Specific Types ---
import type { Node, Edge } from '@xyflow/react';

interface GraphNodeData extends Record<string, unknown> {
  label: string; // Display text for the node
  isCourse: boolean; // Flag to know if it's a real course or descriptive text
  type?: 'target' | 'prerequisite' | 'text_requirement'; // Add type for text nodes
}
// Specific Node type used internally by graph component
type AppNode = Node<GraphNodeData>;
// Type for nodes passed as props
interface InputNode extends Omit<AppNode, 'position' | 'width' | 'height' | 'style' | 'selected' | 'dragging' | 'selectable' | 'draggable' | 'hidden' | 'resizing' | 'focusable' | 'sourcePosition' | 'targetPosition'> {
  style?: React.CSSProperties;
}
// Specific Edge type (using base type)
type AppEdge = Edge;
// --- End Graph Types ---


// --- Page Props Interface ---
interface PrerequisitesPageProps {
    searchParams?: {
        dept?: string;
        code?: string;
    };
}

// --- Helper to check if a string looks like a course code ---
// (You might already have this in lib/utils.ts)
function looksLikeCourseCode(text: string): boolean {
    if (!text) return false;
    return /^[A-Z]+\s*\d+[A-Z]*$/i.test(text.trim());
}


// --- Main Server Component ---
export default async function PrerequisitesPage({ searchParams }: PrerequisitesPageProps) {
    const dept = searchParams?.dept;
    const code = searchParams?.code;

    // State variables
    let displayCourseData: Awaited<ReturnType<typeof getCourseAndPrerequisiteData>> | null = null;
    let recursiveGraphData: Awaited<ReturnType<typeof getRecursivePrerequisites>> | null = null;
    let fetchError: string | null = null;
    let notFoundError: boolean = false;
    const targetCourseCode = dept && code ? `${dept.toUpperCase()} ${code}` : null;

    // --- Fetch Data ---
    if (dept && code && targetCourseCode) {
        console.log(`Fetching data for ${targetCourseCode}...`);
        try {
            if (!/^[a-z]+$/.test(dept) || !/^\d+[a-z]*$/.test(code)) { throw new Error("Invalid URL format."); }

            // Fetch recursive data FIRST, as it contains all nodes needed
            recursiveGraphData = await getRecursivePrerequisites(dept, code); // Default depth = 3

            // Check if the *target* node exists within the recursive results
            const targetNodeExists = recursiveGraphData?.nodes.some(node => node.courseCode === targetCourseCode);

            if (!targetNodeExists) {
                // If the target wasn't found even by recursive search, it likely doesn't exist
                console.log(`Target course ${targetCourseCode} not found via recursive search.`);
                notFoundError = true;
                // Fetch display data separately only if needed (maybe for error msg context)
                // displayCourseData = await getCourseAndPrerequisiteData(dept, code);
            } else {
                console.log(`Recursive data fetched: ${recursiveGraphData.nodes.length} nodes, ${recursiveGraphData.edges.length} edges`);
                // Fetch the simple display data as well for the list view
                 displayCourseData = await getCourseAndPrerequisiteData(dept, code);
                 if (!displayCourseData?.targetCourse) {
                     // Should be rare if recursive search found it, but handle anyway
                     console.warn("Target course found recursively but not via direct fetch?");
                     notFoundError = true; // Or handle differently
                 }
            }
        } catch (error) {
            console.error(`Error fetching course data for ${targetCourseCode}:`, error);
            fetchError = error instanceof Error ? error.message : "An unknown error occurred.";
        }
    }

    // --- Prepare Graph Input Data from RECURSIVE results ---
    // Process nodes first to identify which are real courses vs text
    const allNodeIds = new Set(recursiveGraphData?.nodes.map(n => n.courseCode) ?? []);
    const graphInputNodes: InputNode[] = [];
    const processedEdges: AppEdge[] = []; // Edges might need adjustment based on text nodes

    if (recursiveGraphData) {
        // Add actual course nodes found
        recursiveGraphData.nodes.forEach(node => {
            graphInputNodes.push({
                id: node.courseCode,
                type: 'default',
                data: {
                    label: node.courseCode, // Display only CODE on node
                    // title: node.title, // Store full title if needed for tooltips later
                    isCourse: true,
                    type: (node.courseCode === targetCourseCode) ? 'target' : 'prerequisite'
                },
            });
        });

        // Process edges and create text nodes for non-course targets
        recursiveGraphData.edges.forEach((edge, index) => {
            const targetIsCourse = allNodeIds.has(edge.target);

            if (targetIsCourse) {
                // If target is a known course, add the edge normally
                processedEdges.push({
                    id: `edge-${edge.source}-${edge.target}-${index}`,
                    source: edge.source,
                    target: edge.target,
                });
            } else {
                // If target is NOT a known course, it's likely descriptive text
                // 1. Create a new 'text' node if it doesn't exist yet
                const textNodeId = `text-${edge.target}`; // Create a unique ID for the text node
                if (!graphInputNodes.some(n => n.id === textNodeId)) {
                     graphInputNodes.push({
                        id: textNodeId,
                        type: 'default', // Can create a custom node type later if needed
                        data: {
                            label: edge.target, // Use the descriptive text as label
                            isCourse: false,
                            type: 'text_requirement'
                        },
                        // Apply different style for text nodes? Handled in graph component maybe
                        style: { background: '#fffbdd', border: '1px dashed #e6db74', fontSize: '12px', padding: '5px 10px', height: 'auto' } // Example style
                    });
                }
                // 2. Create an edge from the source course to this new text node
                processedEdges.push({
                    id: `edge-${edge.source}-${textNodeId}-${index}`,
                    source: edge.source,
                    target: textNodeId, // Target the text node
                });
            }
        });
    }
    const graphInputEdges = processedEdges; // Assign the processed edges
    // --- End Graph Input Data Preparation ---


    // --- Render Page UI ---
    return (
        <div className="flex flex-col min-h-screen">
            <div className="flex flex-1"> {/* Sidebar + Main */}
                <div className="hidden md:block bg-[#f5f5f0]"><Sidebar /></div>
                <div className="flex-1 bg-[#f5f5f0] flex flex-col"> {/* Main Area */}
                    {/* Header */}
                    <header className="md:hidden ...">...</header>

                    {/* Scrollable Content */}
                    <main className="flex-1 overflow-y-auto container mx-auto py-8 px-4">
                        {/* Back Button */}
                        <div className="flex items-center gap-2 mb-6">...</div>

                        {/* Top Section: Input/Results + Empty Right */}
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Left Column */}
                            <div className="md:w-2/3">
                                <h1 className="text-3xl font-bold mb-6">Prerequisite Checker</h1>
                                <Card>
                                    <CardHeader><CardTitle>Check Course Requirements</CardTitle></CardHeader>
                                    <CardContent>
                                        <PrerequisiteCheckerForm />
                                        <div className="mt-6 space-y-4">
                                            {/* Alerts */}
                                            {fetchError && <Alert variant="destructive">...</Alert>}
                                            {notFoundError && <Alert variant="default" className="bg-yellow-50 ...">...</Alert>}
                                            {/* Course Details & List Display */}
                                            {displayCourseData?.targetCourse && !fetchError && !notFoundError && (
                                                <div className="border rounded-md p-4 space-y-4">
                                                   {/* Use displayCourseData for title/desc/units/lists */}
                                                   <h3 className="font-medium text-lg">{displayCourseData.targetCourse.courseCode} - {displayCourseData.targetCourse.title}</h3>
                                                   <p className="text-sm text-gray-600">{displayCourseData.targetCourse.parsedDescription || 'No description.'}</p>
                                                   <p className="text-sm text-gray-500">Credits: {displayCourseData.targetCourse.units?.credits ?? 'N/A'}</p>
                                                    {/* Prereqs List (Accurate Logic) */}
                                                    <div>
                                                        <h4 className="font-medium mb-2">Prerequisites Details:</h4>
                                                        {(displayCourseData.targetCourse.requirements?.prerequisites /*...*/) ? (<RequirementConditionDisplay condition={displayCourseData.targetCourse.requirements.prerequisites} />) : (<p className="text-sm text-gray-500">None listed.</p>)}
                                                    </div>
                                                    {/* Coreqs List (Accurate Logic) */}
                                                    <div>
                                                        <h4 className="font-medium mb-2">Corequisites Details:</h4>
                                                        {(displayCourseData.targetCourse.requirements?.corequisites /*...*/) ? (<RequirementConditionDisplay condition={displayCourseData.targetCourse.requirements.corequisites} />) : (<p className="text-sm text-gray-500">None listed.</p>)}
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
                                     {/* Disclaimer about logic still applies somewhat */}
                                     <p className="text-xs text-gray-500 mb-4 italic">Note: This graph shows dependencies based on the listed prerequisites. It does not explicitly visualize AND/OR logic between requirements (see details list above).</p>
                                     {/* Conditionally render graph based on fetched RECURSIVE data */}
                                     {(targetCourseCode && !fetchError && !notFoundError) ? (
                                        // Use graphInputNodes/Edges derived from recursive fetch
                                        graphInputNodes.length > 0 || graphInputEdges.length > 0 ? (
                                            <PrerequisiteGraphWrapper initialNodes={graphInputNodes} initialEdges={graphInputEdges} />
                                        ) : (
                                             <div className="p-4 text-center h-[100px] flex items-center justify-center"><p className="text-sm text-gray-500">No prerequisite dependencies found for {targetCourseCode}.</p></div>
                                        )
                                    ) : (
                                        <div className="p-4 text-center h-[100px] flex items-center justify-center"><p className="text-sm text-gray-500">{fetchError ? 'Error.' : (notFoundError ? `Course not found.` : 'Check a course.')}</p></div>
                                    )}
                                </CardContent>
                             </Card>
                        </div>
                    </main>
                </div>
            </div>
            <Footer className="bg-[#f0f0e8] py-6 px-6 border-t text-center w-full" />
        </div>
    );
}