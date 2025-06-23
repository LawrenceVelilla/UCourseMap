import { z } from "zod";
import { HIGH_SCHOOL_PATTERNS } from "./constants";

/**
 * Consolidated course code utilities to eliminate duplication across the codebase
 */

// Zod schema for course code validation
export const CourseCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^([A-Z]{2,6})(?:\s([A-Z]+))?\s(\d{3}[A-Z]?)$/,
    'Invalid course code format, expected formats like "DEPT 123" or "DEPT 123A"',
  );

/**
 * Normalizes a course code to uppercase and trims whitespace
 */
export function normalizeCourseCode(code: string): string {
  return code.toUpperCase().trim();
}

/**
 * Validates if a string is a valid course code format
 */
export function isValidCourseCode(code: string): boolean {
  try {
    CourseCodeSchema.parse(code);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parses a course code string into department and course number components
 * @param code - Course code like "CMPUT 174" or "MATH 100"
 * @returns Object with department and courseNumber, or null if invalid
 */
export function parseCourseCode(code: string): { department: string; courseNumber: string } | null {
  const normalized = normalizeCourseCode(code);
  const match = normalized.match(/^([A-Z]{2,6})\s+(\d{3}[A-Z]?)$/);

  if (match) {
    return {
      department: match[1],
      courseNumber: match[2],
    };
  }

  return null;
}

/**
 * Creates a full course code from department and course number
 */
export function createFullCourseCode(department: string, courseNumber: string): string {
  return `${normalizeCourseCode(department)} ${normalizeCourseCode(courseNumber)}`;
}

/**
 * Checks if a text string looks like a course code (simple heuristic)
 */
export function looksLikeCourseCode(text: string): boolean {
  const trimmedText = text.trim();
  return /^[A-Z]+\s*\d+[A-Z]*$/i.test(trimmedText);
}

/**
 * Determines if a prerequisite string represents a high school requirement
 */
export function isHighSchoolPrerequisite(text: string): boolean {
  return HIGH_SCHOOL_PATTERNS.has(text.toUpperCase().trim());
}

/**
 * Parses course search input to extract department and course code parts
 * Used in search functionality
 */
export function parseSearchInput(term: string): {
  department?: string;
  courseCode?: string;
  isSpecificSearch: boolean;
} {
  const upperTerm = term.trim().toUpperCase();
  const codeParts = upperTerm.match(/^([A-Z]+)[\s]*(\d+[A-Z]*)$/);

  if (codeParts && codeParts[1] && codeParts[2]) {
    return {
      department: codeParts[1],
      courseCode: codeParts[2],
      isSpecificSearch: true,
    };
  }

  return { isSpecificSearch: false };
}

/**
 * Validates course code and throws descriptive error if invalid
 */
export function validateCourseCode(code: string): string {
  try {
    return CourseCodeSchema.parse(code);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(
        `Invalid course code format: ${code}. Expected format like "DEPT 123" or "DEPT 123A".`,
      );
    }
    throw error;
  }
}

/**
 * Extracts course codes from a text string (finds patterns that look like course codes)
 */
export function extractCourseCodesFromText(text: string): string[] {
  const courseCodeRegex = /\b[A-Z]{2,6}\s+\d{3}[A-Z]?\b/g;
  const matches = text.toUpperCase().match(courseCodeRegex);
  return matches ? [...new Set(matches)] : []; // Remove duplicates
}
