import { RequirementCondition } from "./types";

export function checkConditionMet(
  condition: RequirementCondition | null | undefined,
  completedCourses: Set<string>,
): boolean {
  // Base Case 1: No condition provided means the requirement is trivially met.
  if (!condition) {
    return true;
  }

  // Base Case 2: Condition has a list of courses.
  if (condition.courses && condition.courses.length > 0) {
    if (condition.operator === "OR") {
      return condition.courses.some((course) => completedCourses.has(course));
    } else {
      return condition.courses.every((course) => completedCourses.has(course));
    }
  }

  // Recursive Step: Condition has nested sub-conditions.
  if (condition.conditions && condition.conditions.length > 0) {
    if (condition.operator === "OR") {
      // For OR, recursively check if AT LEAST ONE sub-condition is met.
      return condition.conditions.some((subCond) => checkConditionMet(subCond, completedCourses));
    } else {
      // For AND, recursively check if ALL sub-conditions are met.
      return condition.conditions.every((subCond) => checkConditionMet(subCond, completedCourses));
    }
  }

  // Base Case 3: Condition exists but has NEITHER courses nor conditions (or they are empty arrays).
  console.warn("Requirement condition has neither courses nor conditions:", condition);
  return true; // Default
}

export function checkPrerequisitesMet(
  requirements: { prerequisites?: RequirementCondition | null } | null | undefined,
  completedCourses: Set<string>,
): boolean {
  if (!requirements || !requirements.prerequisites) {
    return true; // No prerequisites specified
  }
  return checkConditionMet(requirements.prerequisites, completedCourses);
}

export function checkCorequisitesMet(
  requirements: { corequisites?: RequirementCondition | null } | null | undefined,
  completedCourses: Set<string>, // Note: For coreqs, this might include *currently enrolled* courses too
): boolean {
  if (!requirements || !requirements.corequisites) {
    return true; // No corequisites specified
  }
  return checkConditionMet(requirements.corequisites, completedCourses);
}
