/**
 * This script converts the flat program JSON structure to the new categorized format
 * Run with: node scripts/convert-program-data.js
 */

const fs = require("fs");
const path = require("path");

// Paths
const INPUT_FILE = path.join(process.cwd(), "public/program_requirements.json");
const OUTPUT_FILE = path.join(process.cwd(), "public/program_requirements_structured.json");

// Patterns to identify category blocks
const CATEGORY_PATTERNS = [
  /Foundation Courses/i,
  /Senior Courses/i,
  /Required Courses/i,
  /Program Core/i,
  /Major Requirements/i,
  /Option Requirements/i,
  /Capstone/i,
];

function isCategoryBlock(blockTitle) {
  if (!blockTitle) return false;
  return CATEGORY_PATTERNS.some((pattern) => pattern.test(blockTitle));
}

function getUnitRequirement(blockTitle) {
  if (!blockTitle) return 0;

  const match = blockTitle.match(/(\d+)\s+units\s+from/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }

  return 0;
}

function processProgram(rawProgram) {
  // Create output structure
  const program = {
    programName: rawProgram.programName,
    blocks: [],
    categories: [],
  };

  // Maps for organizing blocks
  const categoryMap = new Map();
  const blockIdMap = new Map();

  // Current active category
  let currentCategory = "";

  // Process each block
  rawProgram.blocks.forEach((rawBlock, index) => {
    // Create unique ID for block
    const blockId = `block-${index}`;
    blockIdMap.set(index, blockId);

    // Create the processed block
    const block = {
      title: rawBlock.title,
      groups: rawBlock.groups.map((g) => ({
        groupTitle: g.groupTitle,
        description: g.description,
        courses: g.courses || [],
      })),
      notesList: rawBlock.notesList || [],
      order: index,
    };

    // Check if this is a category block
    if (isCategoryBlock(block.title)) {
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
        const units = getUnitRequirement(block.title);
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

async function convertProgram() {
  try {
    // Read input file
    console.log(`Reading program data from: ${INPUT_FILE}`);
    const rawData = fs.readFileSync(INPUT_FILE, "utf8");
    const rawProgram = JSON.parse(rawData);

    // Process program data
    const structuredProgram = processProgram(rawProgram);

    // Write output file
    console.log(`Writing structured program data to: ${OUTPUT_FILE}`);
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(structuredProgram, null, 2), "utf8");

    console.log("✅ Program conversion complete!");
    console.log(`Categories found: ${structuredProgram.categories.length}`);
    console.log(`Total blocks: ${structuredProgram.blocks.length}`);

    // Print category summary
    console.log("\nCategory summary:");
    structuredProgram.categories.forEach((category) => {
      console.log(`- ${category.name}: ${category.blocks.length} blocks`);
    });
  } catch (error) {
    console.error("Error converting program data:", error);
    process.exit(1);
  }
}

convertProgram();
