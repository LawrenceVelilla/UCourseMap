// lib/types.ts (Create this file)

export interface Course {
    id: string; // Assuming UUID
    department: string;
    courseCode: string;
    title: string;
    units: { // Be more specific if possible
      credits?: number;
      feeIndex?: number;
      term?: string;
    } | null;
    rawDescription: string | null;
    parsedDescription: string | null;
    parsingStatus: string | null;
    lastParsedAt: string | null; // ISO String date
    requirements: RequirementsData | null;
    flattenedPrerequisites: string[] | null;
    flattenedCorequisites: string[] | null;
    url: string | null;
    createdAt: string; // ISO String date
    updatedAt: string; // ISO String date
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
  }
  
  // You might have other types from the template here too