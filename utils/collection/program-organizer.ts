import { Program, ProgramBlock } from "../../lib/types";

export function isCategoryBlock(block: ProgramBlock): boolean {
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

  const match = block.title.match(/(\d+)\s+units\s+from/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }

  return 0;
}

export function processRawProgram(rawProgram: any): Program {
  // Ensure program has the expected structure
  if (!rawProgram.programName || !Array.isArray(rawProgram.blocks)) {
    throw new Error("Invalid program format");
  }

  const program: Program = {
    programName: rawProgram.programName,
    blocks: [],
    categories: [],
  };

  const categoryMap = new Map<
    string,
    {
      id: string;
      name: string;
      blocks: string[];
    }
  >();

  const blockIdMap = new Map<number, string>();

  let currentCategory = "";

  // Process each block
  rawProgram.blocks.forEach((rawBlock: any, index: number) => {
    const blockId = `block-${index}`;
    blockIdMap.set(index, blockId);

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

    if (isCategoryBlock(block)) {
      currentCategory = block.title || `Category ${index}`;
      const categoryId = `category-${currentCategory.replace(/\s+/g, "-").toLowerCase()}`;
      categoryMap.set(currentCategory, {
        id: categoryId,
        name: currentCategory,
        blocks: [blockId],
      });

      block.blockType = "category";
    } else {
      if (currentCategory) {
        const category = categoryMap.get(currentCategory);
        if (category) {
          category.blocks.push(blockId);
          block.category = currentCategory;
        }

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

    program.blocks.push(block);
  });

  program.categories = Array.from(categoryMap.values());

  return program;
}

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
