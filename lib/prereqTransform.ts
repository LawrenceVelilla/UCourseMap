import { RequirementCondition } from "@/lib/types";
import { InputNode, AppEdge, GraphNodeData } from "@/components/DetailedPrerequisiteGraph";

export type PrereqNode =
  | { type: "course"; id: string; label: string } // Store label here too for easy graph node creation
  | { type: "text_requirement"; id: string; label: string } // For descriptive nodes
  | { type: "and"; children: PrereqNode[] }
  | { type: "or"; children: PrereqNode[] };

/**
 * Converts a RequirementCondition (from existing data) into a PrereqNode AST.
 */
export function conditionToAst(
  condition: RequirementCondition,
  conditionIdPrefix: string = "cond",
): PrereqNode | null {
  if (!condition) return null;

  // Handle text nodes that are descriptive (description or pattern)
  const descriptiveText = condition.description?.trim() || condition.pattern?.trim();
  if (
    descriptiveText &&
    (!condition.courses || condition.courses.length === 0) &&
    (!condition.conditions || condition.conditions.length === 0)
  ) {
    // Create a unique ID for text nodes if needed, maybe using the text itself or a hash
    const nodeId = `${conditionIdPrefix}_text_${descriptiveText.substring(0, 10).replace(/\s+/g, "_")}`;
    return { type: "text_requirement", id: nodeId, label: descriptiveText };
  }

  const children: PrereqNode[] = [];

  // Process direct courses
  if (condition.courses) {
    condition.courses.forEach((courseText) => {
      // Simple heuristic: if it looks like a course code, treat it as one.
      // Otherwise, treat it as a text requirement for now.
      // TODO: Refine this logic if data becomes more complex.
      const isLikelyCourse = /^[A-Z]+\s*\d+[A-Z]*$/i.test(courseText.trim());
      if (isLikelyCourse) {
        children.push({
          type: "course",
          id: courseText.trim().toUpperCase(),
          label: courseText.trim().toUpperCase(),
        });
      } else {
        // Create a unique ID for these text requirements as well
        const textId = `${conditionIdPrefix}_inlineText_${courseText.substring(0, 10).replace(/\s+/g, "_")}`;
        children.push({ type: "text_requirement", id: textId, label: courseText });
      }
    });
  }

  // Process nested conditions recursively
  if (condition.conditions) {
    condition.conditions.forEach((subCondition, index) => {
      const subAst = conditionToAst(subCondition, `${conditionIdPrefix}_sub${index}`);
      if (subAst) {
        children.push(subAst);
      }
    });
  }

  // Determine the operator type
  const operator = condition.operator; // Should be 'AND' or 'OR'

  if (children.length === 0) {
    return null; // No relevant content to represent
  }

  if (children.length === 1) {
    // If only one child, no need for an intermediate AND/OR node unless it was explicitly defined
    // Exception: If it was explicitly an AND/OR with one child, keep it.
    if (operator === "AND" || operator === "OR") {
      return { type: operator === "AND" ? "and" : "or", children: children };
    }
    // Otherwise, just return the single child
    return children[0];
  }

  // Default to OR if no operator specified and multiple children? Or handle as error?
  // For now, assuming valid input where multiple children imply an operator.
  if (operator === "AND") {
    return { type: "and", children: children };
  } else if (operator === "OR") {
    return { type: "or", children: children };
  } else {
    // If no explicit operator but multiple children, default to OR?
    // Or maybe assume AND? Default to OR as it's often "One of..."
    // console.warn("Condition with multiple children but no explicit AND/OR operator, defaulting to OR:", condition);
    return { type: "or", children: children }; // Defaulting to OR
    // Alternatively, throw an error or handle based on your data specifics
    // return null;
  }
}

// Converts a PrereqNode AST into a unique ID for operator nodes
let nextOpId = 1;
function freshOp(type: "and" | "or"): string {
  // Reset counter for each graph generation maybe? Or keep it global?
  // Global seems okay for now, but could lead to very large numbers.
  // Consider resetting if generating many graphs independently.
  return `${type.toUpperCase()}_${nextOpId++}`;
}

/**
 * Converts a PrereqNode AST into React Flow nodes and edges, calculating depth.
 */
export function astToGraph(
  rootAstNode: PrereqNode | null,
  targetCourseId: string,
  targetCourseLabel: string,
): { nodes: InputNode[]; edges: AppEdge[] } {
  if (!rootAstNode) {
    // If no prerequisites, just show the target course node
    return {
      nodes: [
        {
          id: targetCourseId,
          data: { label: targetCourseLabel, nodeType: "course", isTarget: true },
          type: "default",
        },
      ],
      edges: [],
    };
  }

  const nodesMap = new Map<string, InputNode>();
  const edgesSet = new Set<string>(); // Stores "source->target:depth"

  // Add the target course node first
  nodesMap.set(targetCourseId, {
    id: targetCourseId,
    data: { label: targetCourseLabel, nodeType: "course", isTarget: true },
    type: "default",
  });

  function visit(astNode: PrereqNode, parentGraphId: string, depth: number): void {
    if (astNode.type === "course" || astNode.type === "text_requirement") {
      // Add node if it doesn't exist
      if (!nodesMap.has(astNode.id)) {
        nodesMap.set(astNode.id, {
          id: astNode.id,
          data: {
            label: astNode.label,
            nodeType: astNode.type,
            isTarget: false,
          },
          type: "default",
        });
      }
      // Add edge with depth information
      edgesSet.add(`${astNode.id}->${parentGraphId}:${depth}`); // Store depth with edge string
    } else {
      // 'and' or 'or'
      const opId = freshOp(astNode.type);
      // Add the operator node
      if (!nodesMap.has(opId)) {
        // Ensure operator node isn't duplicated if structure allows
        nodesMap.set(opId, {
          id: opId,
          data: { label: astNode.type.toUpperCase(), nodeType: astNode.type, isTarget: false },
          type: "default",
        });
      }
      // Add edge from operator to its parent with depth
      edgesSet.add(`${opId}->${parentGraphId}:${depth}`);
      // Visit children, connecting them to the new operator node, INCREMENT depth
      astNode.children.forEach((child) => visit(child, opId, depth + 1));
    }
  }

  // Start traversal - connect the root of the AST to the target course node
  // ---> Initial depth is 1 for direct prerequisites
  visit(rootAstNode, targetCourseId, 1);

  // Reset operator ID counter for next time, if desired
  nextOpId = 1;

  // Convert map/set back to arrays
  const finalNodes = Array.from(nodesMap.values());
  const finalEdges = Array.from(edgesSet).map((edgeString) => {
    const [edgePart, depthPart] = edgeString.split(":"); // Split edge and depth
    const [source, target] = edgePart.split("->");
    const depth = parseInt(depthPart, 10) || 1; // Parse depth, default to 1 if error
    return {
      id: `e_${source}-${target}`, // Simple edge ID
      source,
      target,
      data: { depth }, // Assign calculated depth here
    };
  });

  return { nodes: finalNodes, edges: finalEdges };
}
