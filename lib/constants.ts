/**
 * Shared constants for the UCourseMap application
 */

// Brand colors used throughout the application
export const BRAND_COLORS = {
  primary: "#606c5d",
  primaryHover: "#4f594c",
  secondary: "#283618",
  accent: "#dda15e",
  accentLight: "#a3b18a",
} as const;

// Database selection objects to avoid duplication
export const COURSE_SELECTORS = {
  BASIC: {
    id: true,
    department: true,
    courseCode: true,
    title: true,
  },
  FULL: {
    id: true,
    department: true,
    courseCode: true,
    title: true,
    units: true,
    keywords: true,
    requirements: true,
    flattenedPrerequisites: true,
    flattenedCorequisites: true,
    url: true,
    updatedAt: true,
  },
} as const;

// High school prerequisite patterns for filtering
export const HIGH_SCHOOL_PATTERNS = new Set([
  "MATHEMATICS 30-1",
  "MATHEMATICS 31",
  "PURE MATHEMATICS 30",
  "PURE MATHEMATICS 31",
  "PHYSICS 30",
  "CHEMISTRY 30",
  "BIOLOGY 30",
  "ENGLISH LANGUAGE ARTS 30-1",
  "ELA 30-1",
]);

// Standard error messages
export const ERROR_MESSAGES = {
  INTERNAL_SERVER_ERROR: "Internal Server Error",
  COURSE_NOT_FOUND: "Course not found",
  INVALID_COURSE_CODE: "Invalid course code format",
  DEPARTMENT_REQUIRED: "Department code is required",
  COURSE_CODE_REQUIRED: "Course code is required",
  INVALID_REQUEST_BODY: "Invalid request body",
  TOO_MANY_REQUESTS: "Too Many Requests",
} as const;

// API response status codes
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
} as const;
