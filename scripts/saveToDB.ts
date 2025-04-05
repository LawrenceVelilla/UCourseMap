// scripts/loadCourses.ts
import { PrismaClient, Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as fs from 'fs';
import * as path from 'path';

interface CourseJsonData {
  department: string;
  courseCode: string;
  title: string;
  units: Prisma.JsonValue | null;
  rawDescription: string | null;
  parsedDescription: string | null;
  parsingStatus: string | null;
  lastParsedAt: string | null; // Expecting ISO date string or null
  requirements: Prisma.JsonValue | null;
  flattenedPrerequisites: string[] | null;
  flattenedCorequisites: string[] | null;
  url: string | null;
}

const prisma = new PrismaClient();
const jsonFilePath = path.resolve(__dirname, '../parsed_courses.json');
const BATCH_SIZE = 37;

async function main() {
  console.log(`Reading course data from: ${jsonFilePath}`);
  let coursesJson: CourseJsonData[];

  try {
    const fileContent = fs.readFileSync(jsonFilePath, 'utf-8');
    console.log(`File: ${fileContent}`);
    if (!fileContent.trim()) {
      throw new Error("JSON file is empty or contains only whitespace.");
    }
    coursesJson = JSON.parse(fileContent);
    console.log(`Parsed JSON data successfully.`);
    console.log(`Data: ${JSON.stringify(coursesJson, null, 2)}`);
  } catch (error: any) {
    console.error(`Error reading or parsing JSON file: ${error.message}`);
    process.exit(1);
  }

  if (!Array.isArray(coursesJson)) {
    console.error("JSON data is not an array. Expected format: [ {course1}, {course2}, ... ]");
    process.exit(1);
  }

  const totalCourses = coursesJson.length;
  console.log(`Found ${totalCourses} courses in JSON file.`);
  if (totalCourses === 0) {
    console.log("No courses to load.");
    return;
  }

  console.log(`Starting upsert process in batches of ${BATCH_SIZE}...`);
  let coursesProcessed = 0;
  let coursesUpserted = 0;
  let coursesFailed = 0;

  for (let i = 0; i < totalCourses; i += BATCH_SIZE) {
    const batch = coursesJson.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    console.log(`Processing Batch ${batchNumber} (${batch.length} courses)...`);

    const upsertPromises = batch.map(async (course) => {
      let processedData: Prisma.CourseCreateInput | null = null; // Initialize as null
      try {
        // --- Improved Date Handling ---
        let parsedDate: Date | null = null;
        const dateString = course.lastParsedAt;

        if (dateString && typeof dateString === 'string' && dateString.trim()) {
          const tempDate = new Date(dateString);
          // Check if Date object is valid. Invalid dates have getTime() === NaN
          if (!isNaN(tempDate.getTime())) {
            parsedDate = tempDate;
          } else {
            console.warn(`[${course.courseCode || 'UNKNOWN'}]: Invalid date string "${dateString}". Setting lastParsedAt to null.`);
          }
        } else if (dateString) {
           console.warn(`[${course.courseCode || 'UNKNOWN'}]: Unexpected non-string type for lastParsedAt: ${typeof dateString}. Setting to null.`);
        }
        // --- End Improved Date Handling ---

        processedData = {
          department: course.department?.trim() || 'UNKNOWN',
          courseCode: course.courseCode?.trim() || 'UNKNOWN',
          title: course.title?.trim() || 'Untitled Course',
          units: course.units ?? Prisma.JsonNull,
          parsedDescription: course.parsedDescription ?? null,
          requirements: course.requirements ?? Prisma.JsonNull,
          flattenedPrerequisites: course.flattenedPrerequisites ?? [],
          flattenedCorequisites: course.flattenedCorequisites ?? [],
          url: course.url ?? null,
        };

        await prisma.course.upsert({
          where: {
            department_courseCode_unique: {
              department: processedData.department,
              courseCode: processedData.courseCode,
            },
          },
          update: {
             ...processedData,
             updatedAt: new Date(),
          },
          create: processedData,
        });
        coursesUpserted++;
      } catch (error: any) {
        console.error(`Failed to upsert course ${course.courseCode || (processedData?.courseCode) || 'UNKNOWN'}: ${error.message}`);
        // If you want more detail on the specific failure:
        // console.error("Course Data:", JSON.stringify(course));
        // console.error("Processed Data:", JSON.stringify(processedData)); // Log the data object that caused the failure
        // console.error("Error:", error);
        coursesFailed++;
      } finally {
        coursesProcessed++;
      }
    });

    await Promise.all(upsertPromises);
    console.log(`Batch ${batchNumber} processed. Total processed: ${coursesProcessed}/${totalCourses}`);
  }

  console.log("----------------------------------------");
  console.log("Data loading summary:");
  console.log(`Total courses in JSON: ${totalCourses}`);
  console.log(`Successfully upserted: ${coursesUpserted}`);
  console.log(`Failed to upsert:      ${coursesFailed}`);
  console.log("----------------------------------------");
}

main()
  .catch((e) => {
    console.error("An unexpected error occurred:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    console.log("Prisma client disconnected.");
  });