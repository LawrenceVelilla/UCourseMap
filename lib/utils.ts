import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { ProgramBlock } from "./types";

/**
 * Maps known requirement patterns (strings that are NOT standard course codes)
 * to more human-readable descriptions using regex matching.
 * Returns original string if it's likely a standard course code or no pattern matches.
 * Case-insensitive matching for patterns.
 */
export function mapRequirementPatternToDescription(pattern: string): string {
  if (!pattern || typeof pattern !== "string") {
    return pattern || "";
  }

  const trimmedPattern = pattern.trim();
  const upperPattern = trimmedPattern.toUpperCase();

  // Check if it looks like a STANDARD course code
  const standardCourseCodeRegex = /^[A-Z]+\s*\d+[A-Z]*$/;
  if (standardCourseCodeRegex.test(upperPattern)) {
    // If it looks like a standard course code, return it as is.
    return trimmedPattern;
  }

  // Check for your SPECIFIC regex pattern (case sensitive)
  const levelPatternRegex = /^([A-Z]+)\s+([1-9])\[0-9\]\{(\d+)\}$/i;
  const levelMatch = trimmedPattern.match(levelPatternRegex);

  if (levelMatch) {
    const department = levelMatch[1].toUpperCase();
    const hundredDigit = parseInt(levelMatch[2], 10);
    const level = hundredDigit * 100;
    return `Any ${level}-level ${department} course`;
  }

  // Check for OTHER known non-course patterns (LEVEL, High School, etc.)
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
  ];

  for (const matcher of otherPatternMatchers) {
    const match = trimmedPattern.match(matcher.regex);
    if (match) {
      return matcher.handler(match);
    }
  }

  // Check for EXACT non-course strings (High School, etc.)
  const exactMappings: { [key: string]: string } = {
    "MATHEMATICS 30-1": "Mathematics 30-1",
    "MATH 30-1": "Mathematics 30-1",

    // I can still display them for more info and stuff.
  };
  if (exactMappings[upperPattern]) {
    return exactMappings[upperPattern];
  }

  // Fallback
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

export function isCategoryBlock(block: ProgramBlock): boolean {
  // Patterns that indicate category blocks
  const categoryPatterns = [
    /Foundation Courses/i,
    /Senior Courses/i,
    /Required Courses/i,
    /Program Core/i,
    /Major Requirements/i,
    /Option Requirements/i,
    /Capstone/i,
  ];

  if (block.title) {
    return categoryPatterns.some((pattern) => pattern.test(block.title as string));
  }

  return false;
}

export function getUnitRequirement(block: ProgramBlock): number {
  if (!block.title) return 0;

  const unitMatch = block.title.match(/(\d+)\s+units\s+from/i);
  if (unitMatch && unitMatch[1]) {
    return parseInt(unitMatch[1], 10);
  }

  // Check if title is ONLY a number (representing units)
  const numberOnlyMatch = block.title.match(/^(\d+)$/);
  if (numberOnlyMatch && numberOnlyMatch[1]) {
    return parseInt(numberOnlyMatch[1], 10);
  }

  // Check for patterns like "X units"
  const simpleUnitsMatch = block.title.match(/(\d+)\s+units/i);
  if (simpleUnitsMatch && simpleUnitsMatch[1]) {
    return parseInt(simpleUnitsMatch[1], 10);
  }

  return 0;
}
