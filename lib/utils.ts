import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Maps known requirement patterns (strings that are NOT standard course codes)
 * to more human-readable descriptions using regex matching.
 * Returns original string if it's likely a standard course code or no pattern matches.
 * Case-insensitive matching for patterns.
 */
export function mapRequirementPatternToDescription(pattern: string): string {
  if (!pattern || typeof pattern !== "string") {
    return pattern || ""; // Return empty/original if input is invalid
  }

  const trimmedPattern = pattern.trim();
  const upperPattern = trimmedPattern.toUpperCase();

  // --- STEP 1: Check if it looks like a STANDARD course code ---
  // This regex matches formats like: DEPT 123, DEPT123, DEPT 123A, DEPT123A
  const standardCourseCodeRegex = /^[A-Z]+\s*\d+[A-Z]*$/;
  if (standardCourseCodeRegex.test(upperPattern)) {
    // It looks like a standard course code, assume it is one.
    // Return the original trimmed string without mapping.
    return trimmedPattern;
  }
  // ------------------------------------------------------------

  // --- STEP 2: Check for your SPECIFIC regex pattern ---
  // Matches "DEPT L[0-9]{N}" format (case-insensitive)
  const levelPatternRegex = /^([A-Z]+)\s+([1-9])\[0-9\]\{(\d+)\}$/i; // Ensure Level digit is 1-9
  const levelMatch = trimmedPattern.match(levelPatternRegex);

  if (levelMatch) {
    const department = levelMatch[1].toUpperCase(); // Use uppercase for consistency
    const hundredDigit = parseInt(levelMatch[2], 10);
    // Assuming the quantifier {N} means N digits *after* the first one.
    // E.g., 2[0-9]{2} -> 200-level (hundredDigit = 2)
    // E.g., 1[0-9]{2} -> 100-level (hundredDigit = 1)
    const level = hundredDigit * 100;
    return `Any ${level}-level ${department} course`; // Added hyphen
  }
  // ----------------------------------------------------

  // --- STEP 3: Check for OTHER known non-course patterns (LEVEL, High School, etc.) ---
  // Using the previous structure for flexibility
  const otherPatternMatchers: Array<{
    regex: RegExp;
    handler: (match: RegExpMatchArray) => string;
  }> = [
    // Example: "300-LEVEL ARTS", "100 LEVEL SCIENCE"
    {
      regex: /^(\d+)[*-]?\s*LEVEL\s+([A-Z\s]+)$/i,
      handler: (match) => `Any ${match[1]}-level ${match[2].trim().toUpperCase()} course`,
    },
    // Example: "3* ARTS", "6* SCIENCE"
    {
      regex: /^(\d)\*\s+([A-Z\s]+)$/i,
      handler: (match) => `A ${match[1]}00-level ${match[2].trim().toUpperCase()} course or higher`,
    },
    // Add more specific non-course regex patterns here
  ];

  for (const matcher of otherPatternMatchers) {
    const match = trimmedPattern.match(matcher.regex);
    if (match) {
      return matcher.handler(match);
    }
  }

  // --- STEP 4: Check for EXACT non-course strings (High School, etc.) ---
  const exactMappings: { [key: string]: string } = {
    "MATHEMATICS 30-1": "Mathematics 30-1",
    "MATH 30-1": "Mathematics 30-1",
    // ... Add more highschool classes here. But maybe not needed?
    // I can still display them for more info and stuff.
  };
  if (exactMappings[upperPattern]) {
    return exactMappings[upperPattern];
  }
  // ----------------------------------------------------------------------

  // --- STEP 5: Fallback ---
  // If it didn't look like a standard course code in Step 1,
  // and didn't match any specific patterns/mappings in Steps 2-4,
  // return the original trimmed string. It might be other text like "Consent of department".
  return trimmedPattern;
}

// The shouldExcludeGraphNode function likely doesn't need changes now,
// as it operates on the output of mapRequirementPatternToDescription for filtering high school,
// and filters generic phrases based on the original input.
export function shouldExcludeGraphNode(nodeIdentifier: string): boolean {
  // It should filter based on the *original* identifier for generic phrases,
  // and based on the *mapped* description for things like mapped high school courses.
  if (!nodeIdentifier) return true;
  const upperId = nodeIdentifier.trim().toUpperCase();
  const exclusionPhrases: any[] = [];
  if (exclusionPhrases.some((pattern) => pattern.test(upperId))) {
    return true;
  }

  const mappedDesc = mapRequirementPatternToDescription(nodeIdentifier);
  const highSchoolMapped: any[] = [];
  if (highSchoolMapped.includes(mappedDesc)) {
    return true;
  }

  return false;
}
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
