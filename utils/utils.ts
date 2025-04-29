import { redirect } from "next/navigation";
import { Program, ProgramBlock, ProgramGroup, Course } from "../lib/types";

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success')} type - The type of message, either 'error' or 'success'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(type: "error" | "success", path: string, message: string) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

export function organizeProgram(program: Program): Program {
  const organizedProgram: Program = {
    programName: program.programName,
    blocks: [],
    categories: [],
  };

  // Initialize categories map to track category information
  const categories = new Map<
    string,
    {
      id: string;
      name: string;
      blocks: string[];
    }
  >();

  // Track primary category blocks (main headings)
  const categoryBlocks = new Set<string>();

  // First pass: identify main categories and assign IDs to blocks
  let currentCategory = "";
  let blockCounter = 0;

  program.blocks.forEach((block, index) => {
    // Generate ID for the block
    const blockId = `block-${blockCounter++}`;

    // Deep clone the block and assign an ID
    const clonedBlock: ProgramBlock = {
      ...block,
      order: index,
    };

    // Check if this is a main category block
    if (
      block.title &&
      !block.title.startsWith("3 units") &&
      !block.title.startsWith("6 units") &&
      !block.title.startsWith("12 units") &&
      block.title !== "Notes"
    ) {
      // This is likely a main category
      currentCategory = block.title;
      categoryBlocks.add(blockId);

      // Create a new category entry
      categories.set(currentCategory, {
        id: `category-${currentCategory.replace(/\s+/g, "-").toLowerCase()}`,
        name: currentCategory,
        blocks: [blockId],
      });

      // Mark this block as a category type
      clonedBlock.blockType = "category";
    } else {
      // This is a child block of the current category
      if (currentCategory && categories.has(currentCategory)) {
        // Add to current category's blocks
        categories.get(currentCategory)?.blocks.push(blockId);

        // Set the category for this block
        clonedBlock.category = currentCategory;

        // Determine block type
        if (block.title?.includes("units from")) {
          clonedBlock.blockType = "option";

          // Extract units required from the title (e.g., "3 units from:")
          const unitsMatch = block.title.match(/(\d+)\s+units/);
          if (unitsMatch && unitsMatch[1]) {
            clonedBlock.unitsRequired = parseInt(unitsMatch[1], 10);
          }
        } else if (block.title === "Notes") {
          clonedBlock.blockType = "note";
        } else {
          clonedBlock.blockType = "requirement";
        }
      }
    }

    // Add the organized block to the output
    organizedProgram.blocks.push(clonedBlock);
  });

  // Convert categories map to array
  organizedProgram.categories = Array.from(categories.values());

  return organizedProgram;
}

export function findCoursesByPrefix(program: Program, prefix: string): string[] {
  const courses: string[] = [];

  program.blocks.forEach((block) => {
    block.groups.forEach((group) => {
      group.courses.forEach((course) => {
        if (course.courseCode.startsWith(prefix)) {
          courses.push(course.courseCode);
        }
      });
    });
  });

  return courses;
}

export function findPrerequisitePaths(allCourses: Map<string, Course>, targetCourse: string) {
  // Track visited courses to avoid cycles
  const visited = new Set<string>();
  // Map of courses to their immediate prerequisites
  const dependencyMap = new Map<string, string[]>();
  // Paths from root courses (no prerequisites) to target
  const paths: string[][] = [];

  // Recursive function to build paths
  function buildPaths(course: string, currentPath: string[] = [], depth: number = 0): void {
    // Avoid infinite recursion and limit search depth
    if (visited.has(course) || depth > 10) return;
    visited.add(course);

    // Add course to current path
    const newPath = [...currentPath, course];

    // Get course data
    const courseData = allCourses.get(course);
    if (!courseData) return;

    // Get prerequisites
    const prereqs = courseData.flattenedPrerequisites || [];

    // Store in dependency map
    dependencyMap.set(course, [...prereqs]);

    // If no prerequisites, this is a root path
    if (prereqs.length === 0 && course === targetCourse) {
      paths.push(newPath);
      return;
    }

    // Recursively process prerequisites
    for (const prereq of prereqs) {
      buildPaths(prereq, newPath, depth + 1);
    }

    // If this is a terminal node (no prereqs), add the path
    if (prereqs.length === 0) {
      paths.push(newPath);
    }
  }

  // Start building paths from the target course
  buildPaths(targetCourse);

  return {
    paths,
    dependencyMap,
  };
}
