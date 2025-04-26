/**
 * Server Component: Course Information Wrapper
 * 
 * Fetches all necessary data for a given course (details, recursive prerequisites, 
 * reverse lookups) and prepares it for display by the client component.
 * 
 * Responsibilities:
 * - Validate route parameters (department, code).
 * - Fetch course details, prerequisite graph data (using CTE), and reverse lookups concurrently.
 * - Handle potential fetching errors and "course not found" scenarios.
 * - Transform fetched graph data into the format expected by PrerequisiteGraphWrapper (InputNode[], AppEdge[]).
 * - Filter out excluded nodes/edges based on utility functions.
 * - Create necessary text requirement nodes for the graph.
 * - Pass prepared data as props to the CourseResultDisplay client component.
 */
import {
    // getCourseAndPrerequisiteData, // REMOVED - Old redundant data fetching call.
    getRecursivePrerequisitesCTE, // Fetches the full prerequisite graph including depth.
    getCoursesRequiring,          // Fetches courses that list the target course as a prerequisite.
    getCoursesHavingCorequisite   // Fetches courses that list the target course as a corequisite.
} from '@/lib/data'; 
import { CourseResultDisplay } from '@/components/courseResultDisplay';
// Import graph types to ensure correct data structure is passed down.
<<<<<<< HEAD
import type { InputNode, AppEdge } from '@/components/prerequisiteGraph'; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Course } from "@/lib/types"; 
import {
    mapRequirementPatternToDescription, // Converts requirement strings (e.g., "MATH 1XX") to readable text.
    shouldExcludeGraphNode              // Determines if a node should be excluded from the graph (e.g., "* 6").
} from '@/lib/utils'; 
=======
import type {
  InputNode as DetailedInputNode,
  AppEdge as DetailedAppEdge,
} from "@/components/DetailedPrerequisiteGraph";
import type {
  InputNode as SimpleInputNode,
  AppEdge as SimpleAppEdge,
} from "@/components/SimplePrerequisiteGraphDisplay";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Course, RequirementCondition } from "@/lib/types";
import {
  mapRequirementPatternToDescription, // Converts requirement strings (e.g., "MATH 1XX") to readable text.
  shouldExcludeGraphNode, // Determines if a node should be excluded from the graph (e.g., "* 6").
} from "@/lib/utils";
import { z } from "zod";
// ---> Import the new transformation functions
import { conditionToAst, astToGraph, PrereqNode } from "@/lib/prereqTransform";
>>>>>>> f9b07a9 (feat: Implemented a &apos;Detailed&apos; Graph that displays prerequisites INCLUDING the AND/OR logic -- Also fixed indentation issues)

interface CourseInfoWrapperProps {
    department: string; // e.g., "cmput"
    code: string;       // e.g., "174"
}

// Helper function to recursively build the full AST
function buildFullAst(
  condition: RequirementCondition | null | undefined,
  courseMap: Map<string, Course>, // Map of all fetched courses by courseCode
  visited: Set<string>, // To prevent cycles
): PrereqNode | null {
  if (!condition) {
    return null;
  }

  const shallowAst = conditionToAst(condition);
  if (!shallowAst) {
    return null;
  }

  const expandNode = (node: PrereqNode): PrereqNode | null => {
    if (node.type === "course") {
      const courseCode = node.id;
      if (visited.has(courseCode)) {
        console.warn(
          `[AST Build] Cycle detected or already visited: ${courseCode}. Stopping expansion.`,
        );
        return node;
      }
      visited.add(courseCode);

      // ---> Ensure lookup uses uppercase key
      const course = courseMap.get(courseCode.toUpperCase());
      const subAst = buildFullAst(course?.requirements?.prerequisites, courseMap, visited);

      visited.delete(courseCode);

      // ---> MODIFICATION START <---
      if (subAst) {
        // If the course has prerequisites (subAst), create an implicit 'AND' node
        // linking the sub-AST to the course node itself.
        // This ensures the intermediate course node appears in the graph.
        return { type: "and", children: [subAst, node] };
      } else {
        // If the course has no prerequisites, just return the course node as a leaf.
        return node;
      }
      // ---> MODIFICATION END <----
    } else if (node.type === "and" || node.type === "or") {
      const expandedChildren = node.children
        .map(expandNode)
        .filter((n) => n !== null) as PrereqNode[];
      if (expandedChildren.length === 0) {
        return null;
      }
      // Keep operator even if only one child remains after expansion
      return { ...node, children: expandedChildren };
    } else {
      return node; // text_requirement
    }
  };

  return expandNode(shallowAst);
}

export async function CourseInfoWrapper({ department, code }: CourseInfoWrapperProps) {
<<<<<<< HEAD
    // State variables to hold fetched data or errors.
    let recursiveGraphData: Awaited<ReturnType<typeof getRecursivePrerequisitesCTE>> | null = null;
    let requiredByCourses: Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>[] = [];
    let corequisiteForCourses: Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>[] = [];
    let targetCourseNode: Course | undefined | null = null; // Holds the main course data after fetching.
    let fetchError: string | null = null; // Holds any error message during fetching.
=======
  // State variables to hold fetched data or errors.
  // We might not need recursiveGraphData directly anymore if we rely on targetCourseNode.requirements
  // let recursiveGraphData: Awaited<ReturnType<typeof getRecursivePrerequisitesCTE>> | null = null;
  let graphResult: Awaited<ReturnType<typeof getRecursivePrerequisitesCTE>> | null = null; // Need this result now
  let requiredByCourses: Pick<Course, "id" | "department" | "courseCode" | "title">[] = [];
  let corequisiteForCourses: Pick<Course, "id" | "department" | "courseCode" | "title">[] = [];
  let targetCourseNode: Course | undefined | null = null; // Holds the main course data after fetching.
  let fetchError: string | null = null; // Holds any error message during fetching.
>>>>>>> f9b07a9 (feat: Implemented a &apos;Detailed&apos; Graph that displays prerequisites INCLUDING the AND/OR logic -- Also fixed indentation issues)

    // Standardize input for consistent lookups.
    const targetDeptUpper = department.toUpperCase();
    const targetCodeUpper = code.toUpperCase();
    const targetCourseCode = `${targetDeptUpper} ${targetCodeUpper}`; 

    // --- Artificial Delay for Testing Loading States ---
    // console.log("[Wrapper] Adding artificial delay...");
    // await new Promise(resolve => setTimeout(resolve, 1500));
    // --------------------------------------------------

    console.log(`[Wrapper] Fetching data for ${targetCourseCode}...`);
    try {
        // Basic input validation before hitting the database.
        if (!/^[a-z]+$/i.test(department) || !/^\d+[a-z]*$/i.test(code)) {
            throw new Error("Invalid course format received in URL.");
        }

        // Fetch primary graph data and reverse lookups concurrently for efficiency.
        const [graphResult, requiredByResult, coreqForResult] = await Promise.all([
            getRecursivePrerequisitesCTE(department, code), // Fetches target course + all prerequisites.
            getCoursesRequiring(targetCourseCode),        // Fetches courses needing this one ("Required By").
            getCoursesHavingCorequisite(targetCourseCode) // Fetches courses needing this one as coreq.
        ]);

        // Assign results to state variables.
        recursiveGraphData = graphResult; 
        requiredByCourses = requiredByResult;
        corequisiteForCourses = coreqForResult;

        // Attempt to find the main target course within the graph data nodes.
        // The CTE query should always include the starting node.
        targetCourseNode = recursiveGraphData.nodes.find(
            (node): node is Course => // Type guard to ensure we are checking a Course object
                'courseCode' in node && node.courseCode.toUpperCase() === targetCourseCode
        );

        // Handle case where the target course itself wasn't found (should be rare if validation passed).
        if (!targetCourseNode) {
             console.log(`[Wrapper] Target course ${targetCourseCode} not found within CTE results.`);
             // Setting fetchError = "Course not found" here could also be an option instead of separate check later.
        } else {
            console.log(`[Wrapper] Data fetched successfully.`);
        }

    } catch (error) {
        console.error(`[Wrapper] Error fetching course data for ${targetCourseCode}:`, error);
        // Store a user-friendly error message.
        fetchError = error instanceof Error ? error.message : "An unknown error occurred during data fetching.";
    }

<<<<<<< HEAD
    // --- Render Error or Not Found States ---
    if (fetchError) {
        // Display a generic error message if any fetch operation failed.
        return ( <Alert variant="destructive" className="mt-6"> <AlertTitle>Error Fetching Data</AlertTitle> <AlertDescription>{fetchError}</AlertDescription> </Alert> );
    }
    // Check specifically if the target course wasn't found after successful fetch attempt.
=======
    // Fetch primary graph data and reverse lookups concurrently for efficiency.
    // We still need the CTE results to find the target course node with its full details
    const [graphRes, requiredByRes, coreqForRes] = await Promise.all([
      getRecursivePrerequisitesCTE(department, code), // Fetches target course + potentially other data needed
      getCoursesRequiring(targetCourseCode),
      getCoursesHavingCorequisite(targetCourseCode),
    ]);

    // Assign results to state variables.
    // recursiveGraphData = graphResult; // Keep this if needed elsewhere, otherwise remove
    graphResult = graphRes;
    requiredByCourses = requiredByRes;
    corequisiteForCourses = coreqForRes;

    // Attempt to find the main target course within the graph data nodes.
    targetCourseNode = graphResult.nodes.find(
      (
        node,
      ): node is Course => // Type guard
        "courseCode" in node && node.courseCode.toUpperCase() === targetCourseCode,
    );

<<<<<<< HEAD
    // Handle case where the target course itself wasn't found (should be rare if validation passed).
>>>>>>> 2189e6d (feat: Implement Intial MVP for the Plan Builder and Program Planner)
    if (!targetCourseNode) {
         return ( <Alert variant="default" className="mt-6 backdrop-blur-md border-[#283618] text-[#283618] text-center text-wrap"> <AlertTitle>Course Not Found</AlertTitle> <AlertDescription>The course {targetCourseCode} could not be found.</AlertDescription> </Alert> );
    }
    // Safety check: Ensure graph data is available if the target course was found.
    if (!recursiveGraphData) {
         return ( <Alert variant="destructive" className="mt-6"> <AlertTitle>Error</AlertTitle> <AlertDescription>Inconsistent state: Graph data unavailable but target course exists.</AlertDescription> </Alert> );
=======
    if (!targetCourseNode) {
      console.log(`[Wrapper] Target course ${targetCourseCode} not found within CTE results.`);
    } else {
      console.log(`[Wrapper] Data fetched successfully.`);
    }
  } catch (error) {
    console.error(`[Wrapper] Error fetching course data for ${targetCourseCode}:`, error);
    if (error instanceof z.ZodError) {
      fetchError = `Invalid course code format: \"${targetCourseCode}\". Please use the format \"DEPT 123\".`;
    } else {
      fetchError =
        error instanceof Error ? error.message : "An unknown error occurred during data fetching.";
>>>>>>> f9b07a9 (feat: Implemented a &apos;Detailed&apos; Graph that displays prerequisites INCLUDING the AND/OR logic -- Also fixed indentation issues)
    }

<<<<<<< HEAD
    // --- Prepare Graph Input Data (Nodes and Edges) ---
    console.log("[Wrapper] Preparing graph data...");
    const graphInputNodes: InputNode[] = []; // Nodes to pass to the graph component.
    const graphInputEdges: AppEdge[] = [];   // Edges to pass to the graph component.
    
    // Create a set of all valid course codes fetched for quick lookups.
    const allFetchedCourseNodeCodes = new Set(
        recursiveGraphData.nodes
            .filter((n): n is Course => 'courseCode' in n) // Only consider actual Course objects.
            .map(n => n.courseCode.toUpperCase())
    );
    // Keep track of nodes actually added to the graph to avoid duplicate text nodes.
    const addedGraphNodeIds = new Set<string>();

    // 1. Process Course Nodes from CTE results:
    recursiveGraphData.nodes.forEach(node => {
        // Ensure it's a course object (not a text requirement string from the raw data).
        if ('courseCode' in node) { 
            const nodeCodeUpper = node.courseCode.toUpperCase();
            // Check if this course should be included in the graph.
            if (!shouldExcludeGraphNode(nodeCodeUpper)) {
                graphInputNodes.push({
                    id: nodeCodeUpper, // Use standardized code as ID.
                    type: 'default',   // Standard React Flow node type.
                    data: {
                        label: node.courseCode, // Display original case.
                        isCourse: true,
                        // Set type for specific styling (target vs. prerequisite).
                        type: (nodeCodeUpper === targetCourseCode) ? 'target' : 'prerequisite'
                    },
                });
                addedGraphNodeIds.add(nodeCodeUpper); // Mark this node as added.
            } else {
                 // console.log(`[Graph Prep] Excluding course node: ${node.courseCode}`);
            }
        }
    });

    // 2. Process Edges from CTE results and create Text Nodes if necessary:
    recursiveGraphData.edges.forEach((edge, index) => {
        const sourceId = edge.source.toUpperCase(); // Standardize source ID.
        const targetIdOrPattern = edge.target;     // Target might be a course code or a text pattern.

        // Skip edges originating from an excluded node, or edges pointing to an excluded node.
        if (!addedGraphNodeIds.has(sourceId) || shouldExcludeGraphNode(targetIdOrPattern)) {
            return; 
        }

        const targetUpper = targetIdOrPattern.toUpperCase();
        // Check if the target is another course that was included in our graph nodes.
        const targetIsIncludedCourse = addedGraphNodeIds.has(targetUpper);

        if (targetIsIncludedCourse) {
            // Create a standard edge between two course nodes.
            graphInputEdges.push({
                // Generate a unique edge ID.
                id: `edge-${sourceId}-${targetUpper}-${index}`,
                source: sourceId,
                target: targetUpper,
                data: edge.data, // Pass along data from CTE (contains depth).
            });
        } else {
            // The target is a text requirement (e.g., "Min. grade C-", "MATH 1XX").
            // Create a descriptive label for the text node.
            const textNodeLabel = mapRequirementPatternToDescription(targetIdOrPattern);
            // Create a unique ID for this text requirement node.
            const textNodeIdUpper = `text-${targetUpper}`;

            // Only create the text node if it hasn't been added already.
            if (!addedGraphNodeIds.has(textNodeIdUpper)) {
                graphInputNodes.push({
                    id: textNodeIdUpper, 
                    type: 'default',
                    data: {
                        label: textNodeLabel,
                        isCourse: false, // Mark as not a course.
                        type: 'text_requirement' // Specific type for styling.
                    },
                    // Apply specific styles for text nodes.
                    style: { background: '#fefae0', border: '1px dashed #bc6c25', fontSize: '12px', fontStyle: 'italic', padding: '8px 12px', textAlign: 'center', minHeight: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px' }
                });
                addedGraphNodeIds.add(textNodeIdUpper); // Mark text node as added.
            }

            // Create an edge from the source course to the text requirement node.
            graphInputEdges.push({
                id: `edge-${sourceId}-${textNodeIdUpper}-${index}`,
                source: sourceId,
                target: textNodeIdUpper, 
                data: edge.data // Pass along data from CTE (contains depth).
            });
        }
    });
    console.log(`[Graph Prep] Prepared ${graphInputNodes.length} nodes and ${graphInputEdges.length} edges for the graph.`);
    

    // --- Render Client Component with Prepared Data ---
    return (
        <CourseResultDisplay
            targetCourse={targetCourseNode} // Pass the fetched target course details.
            graphNodes={graphInputNodes}     // Pass the prepared nodes for the graph.
            graphEdges={graphInputEdges}     // Pass the prepared edges for the graph.
            requiredByCourses={requiredByCourses} // Pass the reverse lookup data.
            corequisiteForCourses={corequisiteForCourses} // Pass the reverse lookup data.
        />
=======
  // --- Render Error or Not Found States ---
  if (fetchError) {
    return (
      <Alert variant="destructive" className="mt-6">
        <AlertTitle>Error Fetching Data</AlertTitle>
        <AlertDescription>{fetchError}</AlertDescription>
      </Alert>
    );
  }
  if (!targetCourseNode) {
    return (
      <Alert
        variant="default"
        className="mt-6 backdrop-blur-md border-[#283618] text-[#283618] text-center text-wrap"
      >
        <AlertTitle>Course Not Found</AlertTitle>
        <AlertDescription>The course {targetCourseCode} could not be found.</AlertDescription>
      </Alert>
>>>>>>> f9b07a9 (feat: Implemented a &apos;Detailed&apos; Graph that displays prerequisites INCLUDING the AND/OR logic -- Also fixed indentation issues)
    );
<<<<<<< HEAD
}
=======
  }
  // // Safety check removed as recursiveGraphData might not be needed directly for graph building anymore
  // if (!recursiveGraphData) { ... }

  // ---> Add safety check for graphResult
  if (!graphResult) {
    return (
      <Alert variant="destructive" className="mt-6">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Inconsistent state: Prerequisite graph data unavailable.
        </AlertDescription>
      </Alert>
    );
  }

  // --- Prepare Simple Graph Data (Original CTE-based logic) ---
  console.log("[Wrapper] Preparing SIMPLE graph data...");
  let simpleGraphData: { nodes: SimpleInputNode[]; edges: SimpleAppEdge[] } = {
    nodes: [],
    edges: [],
  };
  try {
    const simpleNodes: SimpleInputNode[] = [];
    const simpleEdges: SimpleAppEdge[] = [];
    const addedNodeIds = new Set<string>();
    const targetCourseCodeUpper = targetCourseNode.courseCode.toUpperCase();

    // Process Course Nodes from CTE
    graphResult.nodes.forEach((node) => {
      if ("courseCode" in node) {
        const nodeCodeUpper = node.courseCode.toUpperCase();
        if (!shouldExcludeGraphNode(nodeCodeUpper)) {
          // Use your exclusion logic if needed
          simpleNodes.push({
            id: nodeCodeUpper,
            type: "default",
            data: {
              // Assuming SimpleGraph uses isCourse/type like original
              label: node.courseCode,
              isCourse: true,
              type: nodeCodeUpper === targetCourseCodeUpper ? "target" : "prerequisite",
            },
            // Add other SimpleInputNode specific fields if necessary
          });
          addedNodeIds.add(nodeCodeUpper);
        }
      }
    });

    // Process Edges from CTE & create Text Nodes
    graphResult.edges.forEach((edge, index) => {
      const sourceId = edge.source.toUpperCase();
      const targetIdOrPattern = edge.target;

      if (!addedNodeIds.has(sourceId) || shouldExcludeGraphNode(targetIdOrPattern)) {
        return;
      }

      const targetUpper = targetIdOrPattern.toUpperCase();
      const targetIsIncludedCourse = addedNodeIds.has(targetUpper);

      if (targetIsIncludedCourse) {
        simpleEdges.push({
          id: `edge-${sourceId}-${targetUpper}-${index}`,
          source: sourceId,
          target: targetUpper,
          data: edge.data, // Pass depth if SimpleGraph uses it
          // Add other SimpleAppEdge specific fields if necessary
        });
      } else {
        // Create Text Node (if not excluded)
        const textNodeLabel = mapRequirementPatternToDescription(targetIdOrPattern);
        const textNodeId = `text-${targetUpper}`; // Simple ID for text node

        if (!addedNodeIds.has(textNodeId)) {
          simpleNodes.push({
            id: textNodeId,
            type: "default",
            data: {
              // Assuming SimpleGraph uses isCourse/type
              label: textNodeLabel,
              isCourse: false,
              type: "text_requirement",
            },
            // Add optional styling for simple text nodes if needed
            // Add other SimpleInputNode specific fields if necessary
          });
          addedNodeIds.add(textNodeId);
        }
        simpleEdges.push({
          id: `edge-${sourceId}-${textNodeId}-${index}`,
          source: sourceId,
          target: textNodeId,
          data: edge.data, // Pass depth if SimpleGraph uses it
          // Add other SimpleAppEdge specific fields if necessary
        });
      }
    });
    simpleGraphData = { nodes: simpleNodes, edges: simpleEdges };
    console.log(
      `[Graph Prep] Prepared ${simpleGraphData.nodes.length} simple nodes and ${simpleGraphData.edges.length} simple edges.`,
    );
  } catch (simpleError) {
    console.error("[Wrapper] Error during SIMPLE graph preparation:", simpleError);
    // Fallback for simple graph
    simpleGraphData = {
      nodes: [
        {
          id: targetCourseNode.courseCode,
          // Make sure data matches SimpleInputNode's expected structure
          data: { label: targetCourseNode.courseCode, isCourse: true, type: "target" },
          type: "default",
        } as SimpleInputNode,
      ], // Cast might be needed
      edges: [],
    };
  }

  // --- Render Client Component with Prepared Data ---
  return (
    <CourseResultDisplay
      targetCourse={targetCourseNode}
      // Only pass simple graph data initially - detailed will be loaded on demand
      simpleGraphNodes={simpleGraphData.nodes}
      simpleGraphEdges={simpleGraphData.edges}
      department={department}
      code={code}
      requiredByCourses={requiredByCourses}
      corequisiteForCourses={corequisiteForCourses}
    />
  );
}
>>>>>>> 2189e6d (feat: Implement Intial MVP for the Plan Builder and Program Planner)
