/*
Wrapper component for course information display.
Fetches course data, recursive prerequisites, and reverse lookups.
Handles errors and prepares data (including filtering/mapping for graph)
before passing it to the CourseResultDisplay client component.
*/
import {
    getCourseAndPrerequisiteData,
    getRecursivePrerequisites,
    getCoursesRequiring,
    getCoursesHavingCorequisite
} from '@/lib/data'; // Data fetching functions
import { CourseResultDisplay } from '@/components/courseResultDisplay'; 
import type { InputNode, AppEdge } from '@/components/prerequisiteGraph'; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; 
import type { Course } from "@/lib/types"; 
import {
    mapRequirementPatternToDescription, 
    shouldExcludeGraphNode 
} from '@/lib/utils'; 

interface CourseInfoWrapperProps {
    department: string;
    code: string;
}

export async function CourseInfoWrapper({ department, code }: CourseInfoWrapperProps) {
    // --- State Variables ---
    let displayCourseData: Awaited<ReturnType<typeof getCourseAndPrerequisiteData>> | null = null;
    let recursiveGraphData: Awaited<ReturnType<typeof getRecursivePrerequisites>> | null = null;
    let requiredByCourses: Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>[] = [];
    let corequisiteForCourses: Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>[] = [];
    let fetchError: string | null = null;
    let notFoundError: boolean = false;
    const targetCourseCode = `${department.toUpperCase()} ${code.toUpperCase()}`; // Use uppercase internally

    // Optional: Add artificial delay for testing skeleton visibility
    // console.log("[Wrapper] Adding artificial delay...");
    // await new Promise(resolve => setTimeout(resolve, 1500));

    console.log(`[Wrapper] Fetching data for ${targetCourseCode}...`);
    try {
        // Validate input format
        if (!/^[a-z]+$/i.test(department) || !/^\d+[a-z]*$/i.test(code)) {
             throw new Error("Invalid course format received.");
        }

        // Fetch primary details first
        displayCourseData = await getCourseAndPrerequisiteData(department, code);

        if (!displayCourseData?.targetCourse) {
             console.log(`[Wrapper] Target course ${targetCourseCode} not found via direct fetch.`);
             notFoundError = true;
        } else {
            // If course exists, fetch graph data AND reverse lookups concurrently
            const validTargetCode = displayCourseData.targetCourse.courseCode; // Use the confirmed code from DB
            console.log(`[Wrapper] Fetching dependencies and reverse lookups for ${validTargetCode}...`);

            const [graphResult, requiredByResult, coreqForResult] = await Promise.all([
                getRecursivePrerequisites(department, code), // Use original case for fetching
                getCoursesRequiring(validTargetCode),
                getCoursesHavingCorequisite(validTargetCode)
            ]);

            recursiveGraphData = graphResult;
            requiredByCourses = requiredByResult;
            corequisiteForCourses = coreqForResult;

            console.log(`[Wrapper] Data fetched successfully.`);
        }

    } catch (error) {
        console.error(`[Wrapper] Error fetching course data for ${targetCourseCode}:`, error);
        fetchError = error instanceof Error ? error.message : "An unknown error occurred during data fetching.";
    }

    // --- Handle Error States ---
    if (fetchError) {
        return ( <Alert variant="destructive" className="mt-6"> <AlertTitle>Error Fetching Data</AlertTitle> <AlertDescription>{fetchError}</AlertDescription> </Alert> );
    }
    if (notFoundError) {
         return ( <Alert variant="default" className="mt-6 backdrop-blur-md border-[#283618] text-[#283618] text-center text-wrap"> <AlertTitle>Course Not Found</AlertTitle> <AlertDescription>The course {targetCourseCode} could not be found.</AlertDescription> </Alert> );
    }
    // Ensure we have necessary data after error checks
    if (!displayCourseData?.targetCourse || !recursiveGraphData) {
         return ( <Alert variant="destructive" className="mt-6"> <AlertTitle>Error</AlertTitle> <AlertDescription>Inconsistent state: Required data not available.</AlertDescription> </Alert> );
    }

    // --- Prepare Graph Input Data (with Filtering and Mapping) ---
    console.log("[Wrapper] Preparing graph data...");
    const graphInputNodes: InputNode[] = [];
    const graphInputEdges: AppEdge[] = [];
    // Get course codes from the nodes fetched recursively
    const allFetchedCourseNodeCodes = new Set(recursiveGraphData.nodes.map(n => n.courseCode.toUpperCase()));
    // Track IDs of nodes actually added to the graph (courses and text nodes)
    const addedGraphNodeIds = new Set<string>();

    // 1. Process and Add Course Nodes from Recursion Results
    recursiveGraphData.nodes.forEach(node => {
        const nodeCodeUpper = node.courseCode.toUpperCase();
        // Check if this COURSE node should be excluded (e.g., maybe filter specific courses if needed)
        if (!shouldExcludeGraphNode(nodeCodeUpper)) {
             graphInputNodes.push({
                id: nodeCodeUpper, // Use uppercase ID consistently
                type: 'default',
                data: {
                    label: node.courseCode, // Keep original casing for label
                    isCourse: true,
                    type: (nodeCodeUpper === targetCourseCode) ? 'target' : 'prerequisite'
                },
            });
            addedGraphNodeIds.add(nodeCodeUpper); // Track added courses
        } else {
            console.log(`[Graph Prep] Excluding course node: ${node.courseCode}`);
        }
    });

    // 2. Process Edges, Filter Targets, Map Text Labels, Create Nodes/Edges
    recursiveGraphData.edges.forEach((edge, index) => {
        const sourceId = edge.source.toUpperCase();
        // targetIdOrPattern might be a course code OR a pattern/description string
        const targetIdOrPattern = edge.target;

        // --- FILTERING STEP based on the TARGET identifier ---
        if (shouldExcludeGraphNode(targetIdOrPattern)) {
            // console.log(`[Graph Prep] Skipping edge to excluded target: ${sourceId} -> ${targetIdOrPattern}`);
            return; // Skip this edge entirely
        }
        // Skip if the source node wasn't added (e.g., it was filtered out)
        if (!addedGraphNodeIds.has(sourceId)) {
             // console.log(`[Graph Prep] Skipping edge from excluded source: ${sourceId} -> ${targetIdOrPattern}`);
             return;
        }
        // --- END FILTERING STEP ---

        const targetUpper = targetIdOrPattern.toUpperCase();
        // Check if target is a course node *that we added* to the graph
        const targetIsIncludedCourse = addedGraphNodeIds.has(targetUpper);

        if (targetIsIncludedCourse) {
            // Target is a course -> Create a standard edge
            graphInputEdges.push({
                id: `edge-${sourceId}-${targetUpper}-${index}`, // Ensure unique ID
                source: sourceId,
                target: targetUpper, // Target the course node ID
            });
        } else {
            // Target is NOT an included course -> Treat as text/pattern
            // --- MAP the pattern/text to a readable description ---
            const textNodeLabel = mapRequirementPatternToDescription(targetIdOrPattern);
            // -------------------------------------------------------

            // Create a unique ID for the text node based on the *original* pattern/text
            const textNodeId = `text-${targetIdOrPattern}`;

            // Add the text node *only if it hasn't been added yet*
            if (!addedGraphNodeIds.has(textNodeId)) {
                 graphInputNodes.push({
                    id: textNodeId,
                    type: 'default', // Or use a custom node type if you define one
                    data: {
                        label: textNodeLabel, // Use the mapped description
                        isCourse: false,
                        type: 'text_requirement'
                    },
                    // Define style for text nodes (adjust as needed)
                    style: { background: '#fefae0', border: '1px dashed #bc6c25', fontSize: '12px', fontStyle: 'italic', padding: '8px 12px', textAlign: 'center', minHeight: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }
                });
                addedGraphNodeIds.add(textNodeId); // Track that this text node ID has been added
            }

            // Create an edge pointing from the source course to the text node
            graphInputEdges.push({
                id: `edge-${sourceId}-${textNodeId}-${index}`, // Unique edge ID
                source: sourceId,
                target: textNodeId, // Target the unique text node ID
            });
        }
    });
    console.log(`[Graph Prep] Prepared ${graphInputNodes.length} nodes and ${graphInputEdges.length} edges for the graph.`);
    // --- End Graph Prep ---


    // --- Render the Client Component with Processed Data ---
    return (
        <CourseResultDisplay
            targetCourse={displayCourseData.targetCourse}
            graphNodes={graphInputNodes} // Pass filtered nodes
            graphEdges={graphInputEdges} // Pass filtered edges
            requiredByCourses={requiredByCourses}
            corequisiteForCourses={corequisiteForCourses}
        />
    );
}