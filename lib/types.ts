// lib/types.ts (Create this file)

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
  
export interface RequirementsData {
prerequisites?: RequirementCondition;
corequisites?: RequirementCondition;
notes?: string | null;
}

export interface RequirementCondition {
operator: 'AND' | 'OR';
conditions?: RequirementCondition[];
courses?: string[];
pattern?: string; // Optional pattern for regex matching
}
  
export interface ParsedCourseData {
    description: string;
    requirements: RequirementsData
    flattenedPrerequisites: string[];
    flattenedCorequisites: string[];
  }
  