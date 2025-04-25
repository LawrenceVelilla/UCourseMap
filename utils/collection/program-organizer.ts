import { Program, ProgramBlock } from "../../lib/types";

/**
 * Detects logical block categories from titles and content
 * Used to identify when a block serves as a heading/category
 *
 * @param block - Program block to analyze
 * @returns Boolean indicating if block is a category marker
 */
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

  // Check if block title matches any category pattern
  if (block.title) {
    return categoryPatterns.some((pattern) => pattern.test(block.title as string));
  }

  return false;
}

/**
 * Detects if a block is a unit choice block (e.g., "3 units from:")
 *
 * @param block - Program block to analyze
 * @returns Units required or 0 if not a unit choice block
 */
export function getUnitRequirement(block: ProgramBlock): number {
  if (!block.title) return 0;

  const match = block.title.match(/(\d+)\s+units\s+from/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }

  return 0;
}

/**
 * Processes a raw program JSON and organizes it into a more structured format
 *
 * @param rawProgram - Raw program data from JSON file
 * @returns Organized program with categories and relationships
 */
export function processRawProgram(rawProgram: any): Program {
  // Ensure program has the expected structure
  if (!rawProgram.programName || !Array.isArray(rawProgram.blocks)) {
    throw new Error("Invalid program format");
  }

  // Create the base program object
  const program: Program = {
    programName: rawProgram.programName,
    blocks: [],
    categories: [],
  };

  // Maps for organizing blocks
  const categoryMap = new Map<
    string,
    {
      id: string;
      name: string;
      blocks: string[];
    }
  >();

  const blockIdMap = new Map<number, string>();

  // Current active category
  let currentCategory = "";

  // Process each block
  rawProgram.blocks.forEach((rawBlock: any, index: number) => {
    // Create unique ID for block
    const blockId = `block-${index}`;
    blockIdMap.set(index, blockId);

    // Create the processed block
    const block: ProgramBlock = {
      title: rawBlock.title,
      groups: rawBlock.groups.map((g: any) => ({
        groupTitle: g.groupTitle,
        description: g.description,
        courses: g.courses || [],
      })),
      notesList: rawBlock.notesList || [],
      order: index,
    };

    // Check if this is a category block
    if (isCategoryBlock(block)) {
      // Start a new category
      currentCategory = block.title || `Category ${index}`;

      // Create category entry
      const categoryId = `category-${currentCategory.replace(/\s+/g, "-").toLowerCase()}`;
      categoryMap.set(currentCategory, {
        id: categoryId,
        name: currentCategory,
        blocks: [blockId],
      });

      // Mark as category type
      block.blockType = "category";
    } else {
      // This is a child block
      if (currentCategory) {
        // Add to current category
        const category = categoryMap.get(currentCategory);
        if (category) {
          category.blocks.push(blockId);
          block.category = currentCategory;
        }

        // Check if it's a unit choice block
        const units = getUnitRequirement(block);
        if (units > 0) {
          block.unitsRequired = units;
          block.blockType = "option";
        } else if (block.title === "Notes") {
          block.blockType = "note";
        } else {
          block.blockType = "requirement";
        }
      }
    }

    // Add block to program
    program.blocks.push(block);
  });

  // Convert category map to array
  program.categories = Array.from(categoryMap.values());

  return program;
}

/**
 * Processes an existing program JSON file and returns an improved version
 *
 * @param programPath - Path to the program JSON file
 * @returns Promise resolving to the processed program
 */
export async function improveProgram(programPath: string): Promise<Program> {
  try {
    // This would be a fetch in the browser or a file read in Node
    const rawProgram = await import(programPath);
    return processRawProgram(rawProgram.default);
  } catch (error) {
    console.error("Error processing program:", error);
    throw error;
  }
}
