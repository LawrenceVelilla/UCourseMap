// import { Prisma } from "@prisma/client"; // Commented out or deleted
import React from "react";

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

export interface ProgramCourse {
  courseCode: string;
  title: string;
  department: string;
  note: string | null;
}

export interface ProgramGroup {
  groupTitle: string | null;
  description: string[];
  courses: ProgramCourse[];
  unitsRequired?: number; // For "3 units from:" type groups
  categoryId?: string; // For linking related groups under a category
}

export interface ProgramBlock {
  title: string | null;
  groups: ProgramGroup[];
  notesList: string[];
  category?: string; // Category this block belongs to (e.g., "Foundation Courses")
  parentBlockId?: string; // For hierarchical relationships
  blockType?: "requirement" | "option" | "note" | "category";
  unitsRequired?: number; // Total units required for this block
  order?: number; // For maintaining the original sequence
}

export interface Program {
  programName: string;
  blocks: ProgramBlock[];
  categories?: {
    // Optional categorization of blocks
    id: string;
    name: string;
    blocks: string[]; // IDs of blocks in this category
  }[];
}

// --- Plan Validation Types ---
export interface RequirementValidationResult {
  requirementId: string; // Unique ID (e.g., categoryId, blockId, groupId + index)
  description: string; // Human-readable description (e.g., Category Name, Block Title, Group Title)
  status: "met" | "partially-met" | "unmet" | "overfilled"; // Status of the requirement
  achievedUnits: number;
  requiredUnits: number;
  relevantCourses: {
    // Courses selected by the user relevant to this requirement
    courseCode: string;
    status: "planned" | "completed" | "in-progress" | "not-started";
    units: number;
  }[];
}
// --- End Plan Validation Types ---

// Interface for the state stored in Zustand
// (Consider moving store-specific types to the store file)
export interface CourseStatus {
  status: "planned" | "completed" | "in-progress" | "not-started";
  term?: string;
  year?: number;
  grade?: string;
}

// You might want to define the full Zustand state shape here or keep it in the store file
// export interface ProgramPlanState { ... }

// For GraphView component
export interface NodeData {
  label: string;
  isCourse: boolean;
  type: string;
  // Add other relevant data for nodes
}

export interface EdgeData {
  depth: number;
  // Add other relevant data for edges
}

// React Flow requires explicit types for nodes and edges
// export type InputNode = Node<NodeData>; // Original - might cause issues if Node type isn't correctly imported
// export type AppEdge = Edge<EdgeData>;

export interface GraphData {
  nodes: InputNode[];
  edges: AppEdge[];
}

// --- Component Prop Types ---

// Example props for a component displaying course details
export interface CourseDetailProps {
  course: Course;
  // other props...
}

// Props for the PrerequisiteGraph component
export interface PrerequisiteGraphProps {
  courseCode: string;
  className?: string;
}

// Props for components using ReactNode
export interface SomeComponentProps {
  children: React.ReactNode; // Ensure React is imported
}

export interface AnotherComponentProps {
  header: React.ReactNode; // Ensure React is imported
  content: string;
}
