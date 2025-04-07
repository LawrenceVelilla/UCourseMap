
import { Prisma } from '@prisma/client';

export interface Course {
    id?: string; // Assuming UUID
    department: string;
    courseCode: string;
    title: string;
    units: { // Be more specific if possible
      credits?: number;
      feeIndex?: number;
      term?: string;
    } | null;
    parsedDescription: string | null;
    requirements: RequirementsData | null;
    flattenedPrerequisites: string[] | null;
    flattenedCorequisites: string[] | null;
    url: string | null;
    updatedAt: string; // ISO String date
  }
export interface RawCourse {
    department: string;
    courseCode: string;
    title: string;
    units: { // Be more specific if possible
      credits?: number;
      feeIndex?: number;
      term?: string;
    } | null;
    description: string | null;
    url: string | null;
}

export function isRequirementsData(req: unknown | null | undefined): req is RequirementsData {
  if (!req || typeof req !== 'object' || Array.isArray(req)) {
    return false;
  }
  const reqObj = req as Record<string, undefined>

  return (
    (!reqObj.prerequisites || typeof reqObj.prerequisites === 'object') &&
    (!reqObj.corequisites || typeof reqObj.corequisites === 'object') &&
    (!reqObj.notes || typeof reqObj.notes === 'string' || reqObj.notes === null)
  );
}

  
export interface RequirementsData {
prerequisites?: RequirementCondition;
corequisites?: RequirementCondition;
notes?: string | null;
}

export interface RequirementCondition {
  // Operator might need more values if you use 'STANDALONE', 'WILDCARD', etc.
  operator: 'AND' | 'OR' | 'STANDALONE' | 'WILDCARD' | string; // Make string if more ops exist
  conditions?: RequirementCondition[]; // Nested conditions
  courses?: string[]; // List of course codes OR descriptive text
  pattern?: string; // Optional pattern (e.g., regex)
  description?: string; // Optional human-readable description <--- ADD THIS LINE
}
  
export interface ParsedCourseData {
    description: string;
    requirements: RequirementsData
    flattenedPrerequisites: string[];
    flattenedCorequisites: string[];
  }

