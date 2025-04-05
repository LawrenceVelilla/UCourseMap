// lib/data.ts
import 'server-only'; // Ensure this runs only on the server
import { PrismaClient } from '@prisma/client';
import { Course } from './types'; // Import your Course type

// Initialize Prisma Client instance
// It's generally recommended to instantiate it once and reuse it
// See Prisma docs for best practices in Next.js (potentially using a singleton pattern)
const prisma = new PrismaClient();

/**
 * Fetches basic details for all courses in a specific department.
 * Used for list views. Selects only necessary fields.
 */
export async function getCoursesByDepartment(departmentCode: string): Promise<Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>[]> {
  // Validate or sanitize departmentCode if necessary
  const upperDeptCode = departmentCode.toUpperCase();
  console.log(`Fetching courses for department: ${upperDeptCode}`);

  try {
    const courses = await prisma.course.findMany({
      where: {
        department: upperDeptCode,
      },
      select: { // Only select fields needed for the list view
        id: true,
        department: true,
        courseCode: true,
        title: true,
        // Do NOT select large fields like requirements or description here
      },
      orderBy: {
        courseCode: 'asc', // Order courses naturally
      },
    });
    return courses;
  } catch (error) {
    console.error(`Error fetching courses for department ${upperDeptCode}:`, error);
    // Depending on your error strategy, you might return [] or throw
    return [];
  }
  // Note: No need for Supabase client here, Prisma uses DATABASE_URL
}


/**
 * Fetches full details for a single course, identified by department and course code.
 * Used for the course detail page.
 */
export async function getCourseDetails(departmentCode: string, courseCodeNumber: string): Promise<Course | null> {
    // Validate/sanitize inputs if necessary
    const upperDeptCode = departmentCode.toUpperCase();
    // Combine dept + number for the lookup key used in Prisma model
    const fullCourseCode = `${upperDeptCode} ${courseCodeNumber}`;
    console.log(`Fetching details for course: ${fullCourseCode}`);

    try {
        const course = await prisma.course.findUnique({
            where: {
                // Use the unique constraint name defined in your schema
                department_courseCode_unique: {
                    department: upperDeptCode,
                    courseCode: fullCourseCode,
                }
            }
            // No 'select' needed here, defaults to selecting all fields defined in the model
        });

        if (!course) {
            console.log(`Course not found: ${fullCourseCode}`);
            return null;
        }

        // Prisma returns Date objects for DateTime fields, and JsonValue for Json fields
        // Ensure the return type matches your Course interface (adjust interface if needed)
        // Explicit casting might be needed if types don't perfectly align, or use zod for validation.
        return course as Course; // Be careful with direct casting

    } catch (error) {
        console.error(`Error fetching details for course ${fullCourseCode}:`, error);
        return null; // Return null on error
    }
}

// --- Future functions ---
// export async function searchCourses(query: string) { ... }
// export async function getGraphData(departmentCode: string, courseCodeNumber: string) { ... }