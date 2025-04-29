import React from "react";

export interface Course {
  id?: string;
  department: string;
  courseCode: string;
  title: string;
  units: {
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
  operator: "AND" | "OR" | "STANDALONE" | "WILDCARD" | string;
  conditions?: RequirementCondition[];
  courses?: string[];
  pattern?: string;
  description?: string;
}

export interface ParsedCourseData {
  keywords: string[];
  requirements: RequirementsData;
  flattenedPrerequisites: string[];
  flattenedCorequisites: string[];
}

// Graph Related Types (Optional - can be colocated)
// Data associated with each node in the graph component
export interface GraphNodeData {
  label: string;
  isCourse: boolean;
  type: "target" | "prerequisite" | "text_requirement";
}

// Structure expected by React Flow for nodes
export interface InputNode {
  id: string;
  type?: string;
  data: GraphNodeData;
  position?: { x: number; y: number };
  style?: React.CSSProperties;
}

// Structure expected by React Flow for edges
export interface AppEdge {
  id: string;
  source: string;
  target: string;
  animated?: boolean;
  style?: React.CSSProperties;
  data?: { depth?: number };
}

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
  categoryId?: string;
}

export interface ProgramBlock {
  title: string | null;
  groups: ProgramGroup[];
  notesList: string[];
  category?: string; // Category this block belongs to (e.g., "Foundation Courses")
  parentBlockId?: string; // For hierarchical relationships
  blockType?: "requirement" | "option" | "note" | "category";
  unitsRequired?: number;
  order?: number;
}

export interface Program {
  programName: string;
  blocks: ProgramBlock[];
  categories?: {
    id: string;
    name: string;
    blocks: string[];
  }[];
}

export interface RequirementValidationResult {
  requirementId: string; // Unique ID (e.g., categoryId, blockId, groupId + index)
  description: string;
  status: "met" | "partially-met" | "unmet" | "overfilled";
  achievedUnits: number;
  requiredUnits: number;
  relevantCourses: {
    courseCode: string;
    status: "planned" | "completed" | "in-progress" | "not-started";
    units: number;
  }[];
}

// Interface for the state stored in Zustand
// (Consider moving store-specific types to the store file)
export interface CourseStatus {
  status: "planned" | "completed" | "in-progress" | "not-started";
  term?: string;
  year?: number;
  grade?: string;
}

// TODO: Make a full Zustand state shape here or keep it in the store file
// export interface ProgramPlanState { ... }

// For GraphView component
export interface NodeData {
  label: string;
  isCourse: boolean;
  type: string;
}

export interface EdgeData {
  depth: number;
}

// React Flow requires explicit types for nodes and edges
// export type InputNode = Node<NodeData>; // Original - might cause issues if Node type isn't correctly imported
// export type AppEdge = Edge<EdgeData>;

export interface GraphData {
  nodes: InputNode[];
  edges: AppEdge[];
}

// Component Prop Types

// Example props for a component displaying course details
export interface CourseDetailProps {
  course: Course;
}

// Props for the PrerequisiteGraph component
export interface PrerequisiteGraphProps {
  courseCode: string;
  className?: string;
}

// Props for components using ReactNode
export interface SomeComponentProps {
  children: React.ReactNode;
}

export interface AnotherComponentProps {
  header: React.ReactNode;
  content: string;
}
