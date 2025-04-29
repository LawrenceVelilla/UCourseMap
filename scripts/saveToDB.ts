import { PrismaClient, Prisma } from "@prisma/client";
import * as fs from "fs/promises"; // Use promises API
import * as path from "path";
import * as readline from "readline";
import { stdin as input, stdout as output } from "process";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

interface CourseJsonData {
  department: string;
  courseCode: string;
  title: string;
  units: Prisma.JsonValue;
  keywords: string[]; // Keywords field from AIParse
  requirements: Prisma.JsonValue;
  flattenedPrerequisites: string[] | [];
  flattenedCorequisites: string[] | [];
  url: string;

  // Removed parsedDescription
}

const directDbUrl = process.env.DIRECT_URL;
if (!directDbUrl) {
  console.error("\n❌ Error: DIRECT_DATABASE_URL environment variable is not set.");
  console.error("   Please ensure it's defined in your .env file for this script.\n");
  process.exit(1);
}

const prisma = new PrismaClient();

function fixDuplicatedDepartmentInCourseCode(course: CourseJsonData): CourseJsonData {
  const dept = course.department.trim().toUpperCase();

  // Check if course code has department repeated
  if (course.courseCode.startsWith(`${dept} ${dept}`)) {
    // Fix by removing the duplicate
    course.courseCode = course.courseCode.replace(`${dept} ${dept}`, dept);
    console.log(`[SaveDB] Fixed duplicated department in course code: ${course.courseCode}`);
  }

  return course;
}

export async function save(department: string) {
  let coursesJson: CourseJsonData[];
  const jsonFilePath = path.resolve(__dirname, "../data", `parsed_${department}courses.json`);
  const BATCH_SIZE = 50;

  const summary = { success: false, total: 0, upserted: 0, failed: 0 };

  try {
    console.log(`[SaveDB] Reading data from: ${jsonFilePath}`);
    const fileContent = await fs.readFile(jsonFilePath, "utf-8");
    if (!fileContent.trim()) {
      throw new Error(`JSON file is empty or contains only whitespace: ${jsonFilePath}`);
    }
    coursesJson = JSON.parse(fileContent);
    console.log(`[SaveDB] Parsed JSON data successfully.`);
  } catch (error: any) {
    console.error(
      `[SaveDB] Error reading or parsing JSON file (${jsonFilePath}): ${error.message}`,
    );
    return summary;
  }

  if (!Array.isArray(coursesJson)) {
    console.error(
      "[SaveDB] JSON data is not an array. Expected format: [ {course1}, {course2}, ... ]",
    );
    return summary;
  }

  summary.total = coursesJson.length;
  console.log(`[SaveDB] Found ${summary.total} courses in JSON file.`);
  if (summary.total === 0) {
    console.log("[SaveDB] No courses to load.");
    summary.success = true;
    return summary;
  }

  console.log(`[SaveDB] Starting upsert process in batches of ${BATCH_SIZE}...`);
  let coursesProcessed = 0;

  for (let i = 0; i < summary.total; i += BATCH_SIZE) {
    const batch = coursesJson.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    console.log(`[SaveDB] Processing Batch ${batchNumber} (${batch.length} courses)...`);

    const upsertPromises = batch.map(async (course) => {
      const fixedCourse = fixDuplicatedDepartmentInCourseCode(course);
      let processedData: Prisma.CourseCreateInput | null = null;
      const courseIdentifier = fixedCourse.courseCode?.trim() || "UNKNOWN_CODE";
      const departmentIdentifier = fixedCourse.department?.trim() || "UNKNOWN_DEPT";

      try {
        processedData = {
          department: departmentIdentifier.toUpperCase(),
          courseCode: courseIdentifier.toUpperCase(),
          title: course.title?.trim() || "Untitled Course",
          units: course.units ?? Prisma.JsonNull,
          keywords: course.keywords ?? [],
          requirements: course.requirements ?? Prisma.JsonNull,
          flattenedPrerequisites: course.flattenedPrerequisites ?? [],
          flattenedCorequisites: course.flattenedCorequisites ?? [],
          url: course.url ?? null,

          // Removed parsedDescription
        };

        if (
          processedData.department === "UNKNOWN_DEPT" ||
          processedData.courseCode === "UNKNOWN_CODE"
        ) {
          throw new Error(
            `Missing required department or courseCode for entry: ${JSON.stringify(course)}`,
          );
        }

        await prisma.course.upsert({
          where: {
            department_courseCode_unique: {
              department: processedData.department,
              courseCode: processedData.courseCode,
            },
          },
          update: {
            ...processedData,
            updatedAt: new Date(), // Update timestamp on upsert
          },
          create: processedData,
        });
        summary.upserted++;
      } catch (error: any) {
        console.error(
          `[SaveDB] Failed Batch ${batchNumber}: Course ${departmentIdentifier} ${courseIdentifier}. Error: ${error.message}`,
        );
        summary.failed++;
      } finally {
        coursesProcessed++;
      }
    });

    await Promise.all(upsertPromises);
    console.log(
      `[SaveDB] Batch ${batchNumber} processed. Status - Upserted: ${summary.upserted}, Failed: ${summary.failed}, Total Processed: ${coursesProcessed}/${summary.total}`,
    );
  }

  console.log("[SaveDB] ----------------------------------------");
  console.log("[SaveDB] Data loading summary:");
  console.log(`  Total courses in JSON: ${summary.total}`);
  console.log(`  Successfully upserted: ${summary.upserted}`);
  console.log(`  Failed to upsert:      ${summary.failed}`);
  console.log("[SaveDB] ----------------------------------------");

  summary.success = summary.failed === 0;
  return summary;
}

function getDepartmentInput(): Promise<string> {
  const rl = readline.createInterface({ input, output });
  return new Promise((resolve) => {
    rl.question(
      "[SaveDB] Please enter the department name (lowercase, e.g., cmput, math): ",
      (answer) => {
        rl.close(); // Close interface!
        resolve(answer.trim().toLowerCase());
      },
    );
  });
}

async function runStandaloneImport() {
  console.log("\n[SaveDB] Starting Standalone Database Save Script...");
  const department = await getDepartmentInput();
  if (!department) {
    console.error("[SaveDB] No department name entered. Exiting.");
    return;
  }

  try {
    console.log(`[SaveDB] Starting data import for department: ${department}`);
    await save(department);
    console.log(`[SaveDB] Data import process finished for department: ${department}.`);
  } catch (error) {
    console.error(
      `[SaveDB] An unexpected error occurred during standalone import for ${department}:`,
      error,
    );
  } finally {
    try {
      await prisma.$disconnect();
      console.log("[SaveDB] Prisma client disconnected successfully.");
    } catch (disconnectError) {
      console.error("[SaveDB] Error disconnecting Prisma client:", disconnectError);
    }
  }
}

if (require.main === module) {
  runStandaloneImport().catch((e) => {
    console.error("[SaveDB] A critical error occurred in standalone execution:", e);
    process.exit(1);
  });
}
