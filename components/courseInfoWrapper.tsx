/*
Wrapper component for course information display.
Fetches recursive prerequisites (including target course), and reverse lookups efficiently.
Handles errors and prepares data (including filtering/mapping for graph)
before passing it to the CourseResultDisplay client component.
*/
import {
    // getCourseAndPrerequisiteData, // REMOVED - Redundant Call
    getRecursivePrerequisitesCTE,
    getCoursesRequiring,
    getCoursesHavingCorequisite
} from '@/lib/data'; // Data fetching functions
import { CourseResultDisplay } from '@/components/courseResultDisplay';
import type { InputNode, AppEdge } from '@/components/prerequisiteGraph'; // Assuming graph types are here
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Course } from "@/lib/types"; // Ensure Course type is imported
import {
    mapRequirementPatternToDescription,
    shouldExcludeGraphNode
} from '@/lib/utils'; // Utility functions

interface CourseInfoWrapperProps {
    department: string;
    code: string;
}

export async function CourseInfoWrapper({ department, code }: CourseInfoWrapperProps) {
    // Removed displayCourseData - data will come from CTE result
    let recursiveGraphData: Awaited<ReturnType<typeof getRecursivePrerequisitesCTE>> | null = null;
    let requiredByCourses: Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>[] = [];
    let corequisiteForCourses: Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>[] = [];
    let targetCourseNode: Course | undefined | null = null; 
    let fetchError: string | null = null;
    // Removed notFoundError - will be inferred if targetCourseNode is null after fetch

    const targetDeptUpper = department.toUpperCase();
    const targetCodeUpper = code.toUpperCase();
    const targetCourseCode = `${targetDeptUpper} ${targetCodeUpper}`; // Use uppercase internally

    // Testing --> Add artificial delay to check skeleton display
    // console.log("[Wrapper] Adding artificial delay...");
    // await new Promise(resolve => setTimeout(resolve, 1500));

    console.log(`[Wrapper] Fetching data for ${targetCourseCode}...`);
    try {
        // Validate input format early
        if (!/^[a-z]+$/i.test(department) || !/^\d+[a-z]*$/i.test(code)) {
            throw new Error("Invalid course format received.");
        }

        // Optimized Data Fetching 
        // Fetch graph data (which includes target course) AND reverse lookups ("Needed for") concurrently
        const [graphResult, requiredByResult, coreqForResult] = await Promise.all([
            getRecursivePrerequisitesCTE(department, code), // Fetch graph data (includes target node)
            getCoursesRequiring(targetCourseCode),        // Fetch "Required By" list
            getCoursesHavingCorequisite(targetCourseCode) // Fetch "Corequisite For" list
        ]);

        // Process Results 
        recursiveGraphData = graphResult; // For the graph
        requiredByCourses = requiredByResult;
        corequisiteForCourses = coreqForResult;

        // Extract the target course data specifically from the CTE results
        targetCourseNode = recursiveGraphData.nodes.find(
            (node): node is Course => 
                'courseCode' in node && node.courseCode.toUpperCase() === targetCourseCode
        );

        if (!targetCourseNode) {
            // If the target course wasn't even found as the root of the CTE, it doesn't exist
             console.log(`[Wrapper] Target course ${targetCourseCode} not found within CTE results.`);
        } else {
            console.log(`[Wrapper] Data fetched successfully.`);
        }

    } catch (error) {
        console.error(`[Wrapper] Error fetching course data for ${targetCourseCode}:`, error);
        fetchError = error instanceof Error ? error.message : "An unknown error occurred during data fetching.";
    }

    
    if (fetchError) {
        return ( <Alert variant="destructive" className="mt-6"> <AlertTitle>Error Fetching Data</AlertTitle> <AlertDescription>{fetchError}</AlertDescription> </Alert> );
    }
    // Check if target course wasn't found after fetching
    if (!targetCourseNode) {
         return ( <Alert variant="default" className="mt-6 backdrop-blur-md border-[#283618] text-[#283618] text-center text-wrap"> <AlertTitle>Course Not Found</AlertTitle> <AlertDescription>The course {targetCourseCode} could not be found.</AlertDescription> </Alert> );
    }
    // Ensure we have graph data if the target course was found
    if (!recursiveGraphData) {
         // This state should be less likely now, but keep as a safety check
         return ( <Alert variant="destructive" className="mt-6"> <AlertTitle>Error</AlertTitle> <AlertDescription>Inconsistent state: Graph data unavailable.</AlertDescription> </Alert> );
    }

    // --- Prepare Graph Input Data (with Filtering and Mapping) ---
    console.log("[Wrapper] Preparing graph data...");
    const graphInputNodes: InputNode[] = [];
    const graphInputEdges: AppEdge[] = [];
    const allFetchedCourseNodeCodes = new Set(
        recursiveGraphData.nodes
            .filter((n): n is Course => 'courseCode' in n)
            .map(n => n.courseCode.toUpperCase())
    );
    const addedGraphNodeIds = new Set<string>();

    // 1. Process Course Nodes from CTE results
    recursiveGraphData.nodes.forEach(node => {
        if ('courseCode' in node) { // It's a Course object
            const nodeCodeUpper = node.courseCode.toUpperCase();
            if (!shouldExcludeGraphNode(nodeCodeUpper)) {
                graphInputNodes.push({
                    id: nodeCodeUpper,
                    type: 'default',
                    data: {
                        label: node.courseCode,
                        isCourse: true,
                        type: (nodeCodeUpper === targetCourseCode) ? 'target' : 'prerequisite'
                    },
                });
                addedGraphNodeIds.add(nodeCodeUpper);
            } else {
                 // console.log(`[Graph Prep] Excluding course node: ${node.courseCode}`);
            }
        }
    });

    // 2. Process Edges, Create Text Nodes if needed
    recursiveGraphData.edges.forEach((edge, index) => {
        const sourceId = edge.source.toUpperCase();
        const targetIdOrPattern = edge.target; // Might be course code or text

        if (shouldExcludeGraphNode(targetIdOrPattern) || !addedGraphNodeIds.has(sourceId)) {
            return; // Skip excluded targets or edges from excluded sources
        }

        const targetUpper = targetIdOrPattern.toUpperCase();
        const targetIsIncludedCourse = addedGraphNodeIds.has(targetUpper);

        if (targetIsIncludedCourse) { // Edge to another Course node
            graphInputEdges.push({
                id: `edge-${sourceId}-${targetUpper}-${index}`,
                source: sourceId,
                target: targetUpper,
                data: edge.data, // Pass depth data from CTE edge
            });
        } else { // Edge to a Text Requirement node
            const textNodeLabel = mapRequirementPatternToDescription(targetIdOrPattern);
            const textNodeId = `text-${targetIdOrPattern}`; // Use original case for ID stability? Or upper? Decide consistency. Let's use upper here.
            const textNodeIdUpper = `text-${targetUpper}`;

            if (!addedGraphNodeIds.has(textNodeIdUpper)) {
                graphInputNodes.push({
                    id: textNodeIdUpper, // Use consistent uppercase ID
                    type: 'default',
                    data: {
                        label: textNodeLabel,
                        isCourse: false,
                        type: 'text_requirement'
                    },
                    style: { background: '#fefae0', border: '1px dashed #bc6c25', fontSize: '12px', fontStyle: 'italic', padding: '8px 12px', textAlign: 'center', minHeight: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }
                });
                addedGraphNodeIds.add(textNodeIdUpper);
            }

            graphInputEdges.push({
                id: `edge-${sourceId}-${textNodeIdUpper}-${index}`,
                source: sourceId,
                target: textNodeIdUpper, // Target the consistent text node ID
                data: edge.data // Pass depth data from CTE edge
            });
        }
    });
    console.log(`[Graph Prep] Prepared ${graphInputNodes.length} nodes and ${graphInputEdges.length} edges for the graph.`);
    


    // Render Client Component
    return (
        <CourseResultDisplay
            targetCourse={targetCourseNode}
            graphNodes={graphInputNodes}
            graphEdges={graphInputEdges}
            requiredByCourses={requiredByCourses}
            corequisiteForCourses={corequisiteForCourses}
        />
    );
}