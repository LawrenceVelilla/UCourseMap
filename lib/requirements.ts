// lib/requirements.ts
import { RequirementCondition } from './types'; // Import the specific type

/**
 * Recursively checks if a given RequirementCondition is met by a set of completed courses.
 *
 * @param condition The RequirementCondition object (nested structure) to check. Can be null/undefined.
 * @param completedCourses A Set of completed course codes (e.g., "CMPUT 174", "STAT 151"). Use Set for efficiency.
 * @returns boolean - True if the condition is met, false otherwise.
 */
export function checkConditionMet(
    condition: RequirementCondition | null | undefined,
    completedCourses: Set<string>
): boolean {

    // Base Case 1: No condition provided means the requirement is trivially met.
    if (!condition) {
        return true;
    }

    // Base Case 2: Condition has a list of courses.
    if (condition.courses && condition.courses.length > 0) {
        if (condition.operator === 'OR') {
            // For OR, check if AT LEAST ONE course in the list is completed.
            return condition.courses.some(course => completedCourses.has(course));
        } else { // Operator is 'AND'
            // For AND, check if ALL courses in the list are completed.
            return condition.courses.every(course => completedCourses.has(course));
        }
    }

    // Recursive Step: Condition has nested sub-conditions.
    if (condition.conditions && condition.conditions.length > 0) {
        if (condition.operator === 'OR') {
            // For OR, recursively check if AT LEAST ONE sub-condition is met.
            return condition.conditions.some(subCond => checkConditionMet(subCond, completedCourses));
        } else { // Operator is 'AND'
            // For AND, recursively check if ALL sub-conditions are met.
            return condition.conditions.every(subCond => checkConditionMet(subCond, completedCourses));
        }
    }

    // Base Case 3: Condition exists but has NEITHER courses nor conditions (or they are empty arrays).
    // This usually means the requirement is met (e.g., an empty AND group is true, an empty OR group is false,
    // but often represents a placeholder or edge case where requirement is considered satisfied).
    // Adjust this logic if empty conditions should mean something else in your context.
    console.warn("Requirement condition has neither courses nor conditions:", condition);
    return true; // Defaulting to true for empty/malformed conditions
}

/**
 * Checks if the prerequisites for a course are met.
 *
 * @param requirements The RequirementsData object (or null) from the Course.
 * @param completedCourses A Set of completed course codes.
 * @returns boolean - True if prerequisites are met, false otherwise.
 */
export function checkPrerequisitesMet(
    requirements: { prerequisites?: RequirementCondition | null } | null | undefined,
    completedCourses: Set<string>
): boolean {
    if (!requirements || !requirements.prerequisites) {
        return true; // No prerequisites specified
    }
    return checkConditionMet(requirements.prerequisites, completedCourses);
}

/**
 * Checks if the corequisites for a course are met.
 *
 * @param requirements The RequirementsData object (or null) from the Course.
 * @param completedCourses A Set of completed course codes (or currently enrolled courses).
 * @returns boolean - True if corequisites are met, false otherwise.
 */
export function checkCorequisitesMet(
    requirements: { corequisites?: RequirementCondition | null } | null | undefined,
    completedCourses: Set<string> // Note: For coreqs, this might include *currently enrolled* courses too
): boolean {
    if (!requirements || !requirements.corequisites) {
        return true; // No corequisites specified
    }
    return checkConditionMet(requirements.corequisites, completedCourses);
}