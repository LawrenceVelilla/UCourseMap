import { NextRequest, NextResponse } from "next/server";
import { getRecursivePrerequisitesCTE } from "@/lib/data";
import { Course, RequirementCondition } from "@/lib/types";
import { conditionToAst, astToGraph, PrereqNode } from "@/lib/prereqTransform";

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

      // Ensure lookup uses uppercase key
      const course = courseMap.get(courseCode.toUpperCase());
      const subAst = buildFullAst(course?.requirements?.prerequisites, courseMap, visited);

      visited.delete(courseCode);

      if (subAst) {
        // If the course has prerequisites (subAst), create an implicit 'AND' node
        // linking the sub-AST to the course node itself.
        return { type: "and", children: [subAst, node] };
      } else {
        // If the course has no prerequisites, just return the course node as a leaf.
        return node;
      }
    } else if (node.type === "and" || node.type === "or") {
      const expandedChildren = node.children
        .map(expandNode)
        .filter((n) => n !== null) as PrereqNode[];
      if (expandedChildren.length === 0) {
        return null;
      }
      return { ...node, children: expandedChildren };
    } else {
      return node; // text_requirement
    }
  };

  return expandNode(shallowAst);
}

export async function GET(
  request: NextRequest,
  context: any, // Use 'any' for the context parameter for now
) {
  try {
    // Extract department and course code from URL params and standardize
    const { department, courseCode } = context?.params || {};
    const targetDeptUpper = department.toUpperCase();
    const targetCodeUpper = courseCode.toUpperCase();
    const targetCourseCode = `${targetDeptUpper} ${targetCodeUpper}`;

    console.log(`[API] Fetching detailed graph data for ${targetCourseCode}...`);

    // Fetch graph data using CTE query
    const graphResult = await getRecursivePrerequisitesCTE(department, courseCode);

    // Find the target course node
    const targetCourseNode = graphResult.nodes.find(
      (node): node is Course =>
        "courseCode" in node && node.courseCode.toUpperCase() === targetCourseCode,
    );

    if (!targetCourseNode) {
      return NextResponse.json({ error: `Course ${targetCourseCode} not found` }, { status: 404 });
    }

    // Prepare the detailed graph data
    console.log("[API] Preparing DETAILED graph data...");

    // Create a map of all courses from the CTE result for quick lookup
    const courseMap = new Map<string, Course>();
    graphResult.nodes.forEach((node) => {
      if ("courseCode" in node) {
        courseMap.set(node.courseCode.toUpperCase(), node);
      }
    });

    // Build the full, deeply nested AST recursively
    const fullAst = buildFullAst(
      targetCourseNode.requirements?.prerequisites,
      courseMap,
      new Set<string>(), // Initialize visited set for cycle detection
    );

    // Generate graph nodes/edges from the full AST
    const targetLabel = `${targetCourseNode.courseCode}`;
    const detailedGraphData = astToGraph(fullAst, targetCourseNode.courseCode, targetLabel);

    console.log(
      `[API] Prepared ${detailedGraphData.nodes.length} detailed nodes and ${detailedGraphData.edges.length} detailed edges.`,
    );

    return NextResponse.json(detailedGraphData);
  } catch (error) {
    console.error("[API] Error fetching detailed graph data:", error);
    return NextResponse.json({ error: "Failed to fetch detailed graph data" }, { status: 500 });
  }
}
