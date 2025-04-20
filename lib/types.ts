import { Prisma } from "@prisma/client";

export interface Course {
  id?: string; // Assuming UUID
  department: string;
  courseCode: string;
  title: string;
  units: {
    // Be more specific if possible
    credits: number;
    feeIndex: number;
    term: string;
  };
  keywords: string[];
  requirements: RequirementsData;
  flattenedPrerequisites: string[];
  flattenedCorequisites: string[];
  url: string | null;
  updatedAt: string; // ISO String date
}
export interface RawCourse {
  department: string;
  courseCode: string;
  title: string;
  units: {
    // Be more specific if possible
    credits: number;
    feeIndex: number;
    term: string;
  };
  description: string | null;
  url: string;
}

export function isRequirementsData(req: unknown | null | undefined): req is RequirementsData {
  if (!req || typeof req !== "object" || Array.isArray(req)) {
    return false;
  }
  const reqObj = req as Record<string, undefined>;

  return (
    (!reqObj.prerequisites || typeof reqObj.prerequisites === "object") &&
    (!reqObj.corequisites || typeof reqObj.corequisites === "object") &&
    (!reqObj.notes || typeof reqObj.notes === "string" || reqObj.notes === null)
  );
}

export interface RequirementsData {
  prerequisites?: RequirementCondition;
  corequisites?: RequirementCondition;
  notes?: string | null;
}

export interface RequirementCondition {
  // Operator might need more values if you use 'STANDALONE', 'WILDCARD', etc.
  operator: "AND" | "OR" | "STANDALONE" | "WILDCARD" | string; // Make string if more ops exist
  conditions?: RequirementCondition[]; // Nested conditions
  courses?: string[]; // List of course codes OR descriptive text
  pattern?: string; // Optional pattern (e.g., regex)
  description?: string; // Optional human-readable description <--- ADD THIS LINE
}

export interface ParsedCourseData {
  keywords: string[];
  requirements: RequirementsData;
  flattenedPrerequisites: string[];
  flattenedCorequisites: string[];
}

// --- Graph Related Types (Optional - can be colocated) ---
// Data associated with each node in the graph component
export interface GraphNodeData {
  label: string; // Text displayed on the node (course code or requirement text)
  isCourse: boolean; // Distinguishes course nodes from text requirement nodes
  type: "target" | "prerequisite" | "text_requirement"; // For styling/logic
}

// Structure expected by React Flow for nodes
export interface InputNode {
  id: string; // Unique ID (course code or generated ID for text nodes)
  type?: string; // React Flow node type (e.g., 'default', or custom types)
  data: GraphNodeData; // The custom data associated with the node
  position?: { x: number; y: number }; // Optional: Initial position (Dagre usually handles this)
  style?: React.CSSProperties; // Optional: Inline styles
}

// Structure expected by React Flow for edges
export interface AppEdge {
  id: string; // Unique edge ID
  source: string; // ID of the source node
  target: string; // ID of the target node
  animated?: boolean; // Optional: Animate the edge
  style?: React.CSSProperties; // Optional: Inline styles (e.g., for level coloring)
  data?: { depth?: number }; // Optional: Data associated with edge (like depth)
  // Add other React Flow edge props if needed
}
// --- End Graph Types ---
