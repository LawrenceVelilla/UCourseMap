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
  // getCourseAndPrerequisiteData, // Old redundant data fetching call.
  getRecursivePrerequisitesCTE,
  getCoursesRequiring,
  getCoursesHavingCorequisite,
} from "@/lib/data";
import { CourseResultDisplay } from "@/components/courseResultDisplay";

import type {
  InputNode as SimpleInputNode,
  AppEdge as SimpleAppEdge,
} from "@/components/SimplePrerequisiteGraphDisplay";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Course, RequirementCondition } from "@/lib/types";
import {
  mapRequirementPatternToDescription, // Converts requirement strings (e.g., "MATH 1XX") to readable text.
  shouldExcludeGraphNode,
} from "@/lib/utils";
import { z } from "zod";
// ---> Import the new transformation functions
import { conditionToAst, astToGraph, PrereqNode } from "@/lib/prereqTransform";

interface CourseInfoWrapperProps {
  department: string;
  code: string;
}

export async function CourseInfoWrapper({ department, code }: CourseInfoWrapperProps) {
  let graphResult: Awaited<ReturnType<typeof getRecursivePrerequisitesCTE>> | null = null;
  let requiredByCourses: Pick<Course, "id" | "department" | "courseCode" | "title">[] = [];
  let corequisiteForCourses: Pick<Course, "id" | "department" | "courseCode" | "title">[] = [];
  let targetCourseNode: Course | undefined | null = null;
  let fetchError: string | null = null;

  const targetDeptUpper = department.toUpperCase();
  const targetCodeUpper = code.toUpperCase();
  const targetCourseCode = `${targetDeptUpper} ${targetCodeUpper}`;

  // console.log("[Wrapper] Adding artificial delay...");
  // await new Promise(resolve => setTimeout(resolve, 1500));

  console.log(`[Wrapper] Fetching data for ${targetCourseCode}...`);
  try {
    if (!/^[a-z]+(?:\s[a-z]+)?$/i.test(department) || !/^\d+[a-z]*$/i.test(code)) {
      throw new Error("Invalid course format received in URL.");
    }

    const [graphRes, requiredByRes, coreqForRes] = await Promise.all([
      getRecursivePrerequisitesCTE(department, code), // Fetches target course + potentially other data needed
      getCoursesRequiring(targetCourseCode),
      getCoursesHavingCorequisite(targetCourseCode),
    ]);

    // recursiveGraphData = graphResult; // Keep this if needed elsewhere, otherwise remove
    graphResult = graphRes;
    requiredByCourses = requiredByRes;
    corequisiteForCourses = coreqForRes;

    targetCourseNode = graphResult.nodes.find(
      (node): node is Course =>
        "courseCode" in node && node.courseCode.toUpperCase() === targetCourseCode,
    );

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
    }
  }

  // Error or Not Found States
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
    );
  }

  // Add safety check for graphResult
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

  // Prepare Simple Graph Data (Original CTE-based logic)
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
              label: node.courseCode,
              isCourse: true,
              type: nodeCodeUpper === targetCourseCodeUpper ? "target" : "prerequisite",
            },
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
          data: edge.data,
        });
      } else {
        const textNodeLabel = mapRequirementPatternToDescription(targetIdOrPattern);
        const textNodeId = `text-${targetUpper}`;

        if (!addedNodeIds.has(textNodeId)) {
          simpleNodes.push({
            id: textNodeId,
            type: "default",
            data: {
              label: textNodeLabel,
              isCourse: false,
              type: "text_requirement",
            },
          });
          addedNodeIds.add(textNodeId);
        }
        simpleEdges.push({
          id: `edge-${sourceId}-${textNodeId}-${index}`,
          source: sourceId,
          target: textNodeId,
          data: edge.data,
        });
      }
    });
    simpleGraphData = { nodes: simpleNodes, edges: simpleEdges };
    console.log(
      `[Graph Prep] Prepared ${simpleGraphData.nodes.length} simple nodes and ${simpleGraphData.edges.length} simple edges.`,
    );
  } catch (simpleError) {
    console.error("[Wrapper] Error during SIMPLE graph preparation:", simpleError);
    simpleGraphData = {
      nodes: [
        {
          id: targetCourseNode.courseCode,
          data: { label: targetCourseNode.courseCode, isCourse: true, type: "target" },
          type: "default",
        } as SimpleInputNode,
      ],
      edges: [],
    };
  }
  return (
    <CourseResultDisplay
      targetCourse={targetCourseNode}
      simpleGraphNodes={simpleGraphData.nodes}
      simpleGraphEdges={simpleGraphData.edges}
      department={department}
      code={code}
      requiredByCourses={requiredByCourses}
      corequisiteForCourses={corequisiteForCourses}
    />
  );
}
