// lib/data.ts
import 'server-only';
import { PrismaClient, Prisma } from '@prisma/client'; // Import Prisma namespace too
import { Course, isRequirementsData, RequirementsData } from './types'; // Import types

const prisma = new PrismaClient();

/**
 * Fetches full details for a single course and maps it to the custom Course type.
 */
export async function getCourseDetails(departmentCode: string, courseCodeNumber: string): Promise<Course | null> {
    const upperDeptCode = departmentCode.toUpperCase();
    const fullCourseCode = `${upperDeptCode} ${courseCodeNumber}`;
    try {
        const dbCourse = await prisma.course.findUnique({ // Use a different variable name
            where: {
                department_courseCode_unique: {
                    department: upperDeptCode,
                    courseCode: fullCourseCode,
                }
            }
        });

        // If course not found in DB, return null
        if (!dbCourse) {
            return null;
        }

        // --- Manual Mapping from Prisma.Course to types.Course ---
        const mappedCourse: Course = {
            // id is optional in Course type, but Prisma always provides it for existing records
            id: dbCourse.id,
            department: dbCourse.department,
            courseCode: dbCourse.courseCode,
            title: dbCourse.title,

            // Handle JSON fields: Use type assertion (with caution) or proper parsing/validation
            // Assertion assumes the structure in the DB matches your type definition.
            // A safer alternative would be to use a validation library like Zod.
            units: dbCourse.units as Course['units'], // Asserting the type - risky if DB data is inconsistent

            parsedDescription: dbCourse.parsedDescription, // Types match (string | null)

            // Use the type guard for the requirements JSON - this is safer
            requirements: isRequirementsData(dbCourse.requirements)
                ? dbCourse.requirements // If guard passes, TS knows it matches RequirementsData
                : null,

            // Handle array fields: Prisma returns string[], type expects string[] | null.
            // Assign directly; string[] is assignable to string[] | null.
            flattenedPrerequisites: dbCourse.flattenedPrerequisites,
            flattenedCorequisites: dbCourse.flattenedCorequisites,

            url: dbCourse.url, // Types match (string | null)

            // Handle Date field: Convert Date object to ISO string
            updatedAt: dbCourse.updatedAt.toISOString(),
        };
        // --- End of Mapping ---

        return mappedCourse; // Return the explicitly typed object

    } catch (error) {
        console.error(`Error fetching details for course ${fullCourseCode}:`, error);
        // Consider logging the specific error or re-throwing for higher-level handling
        return null;
    }
}

/**
 * Fetches basic details (id, code, title) for a list of course codes.
 * Used to get info about prerequisites.
 * (This function seems okay as Prisma's selected fields match the Pick<>)
 */
export async function getMultipleCourseDetails(courseCodes: string[]): Promise<Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>[]> {
  if (!courseCodes || courseCodes.length === 0) {
    return [];
  }
  console.log(`Fetching details for courses: ${courseCodes.join(', ')}`);
  try {
    // Prisma's select directly matches the required Pick<> structure here
    const courses = await prisma.course.findMany({
      where: {
        courseCode: {
          in: courseCodes,
        },
      },
      select: {
        id: true,        // string
        department: true, // string
        courseCode: true, // string
        title: true,      // string
      },
    });
    // The structure returned by Prisma matches Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>
    // except for 'id' potentially being optional in Course type, but Prisma provides it.
    return courses;
  } catch (error) {
    console.error(`Error fetching multiple course details:`, error);
    return [];
  }
}


/**
 * Orchestrator function: Fetches target course and its prerequisite details.
 * (Simplified slightly as getCourseDetails now returns the correctly typed Course)
 */
export async function getCourseAndPrerequisiteData(departmentCode: string, courseCodeNumber: string) {
  // getCourseDetails now returns the correctly typed Course | null
  const targetCourse = await getCourseDetails(departmentCode, courseCodeNumber);

  if (!targetCourse) {
    // targetCourse is null, return the structure indicating not found
    return { targetCourse: null, prerequisiteCourses: [] };
  }

  // targetCourse is guaranteed to be of type Course here
  let prerequisiteCourses: Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>[] = [];

  // Access flattenedPrerequisites directly from the correctly typed targetCourse
  if (targetCourse.flattenedPrerequisites && targetCourse.flattenedPrerequisites.length > 0) {
    // Pass the non-null array to getMultipleCourseDetails
    prerequisiteCourses = await getMultipleCourseDetails(targetCourse.flattenedPrerequisites);
  }

  // No need to re-process `requirements` here, as `getCourseDetails` already handled
  // the typing and conversion (using the type guard). The targetCourse object
  // already contains `requirements` as `RequirementsData | null`.

  return {
    targetCourse: targetCourse, // Return the fully typed Course object
    prerequisiteCourses,
  };
}