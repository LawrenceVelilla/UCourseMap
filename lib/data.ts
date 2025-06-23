import "server-only";
import { PrismaClient, Prisma } from "@prisma/client";
import { Course, RequirementsData, InputNode, AppEdge } from "./types";
import { cache } from "react";
import { z } from "zod";
import { COURSE_SELECTORS } from "./constants";
import { normalizeCourseCode, CourseCodeSchema, isHighSchoolPrerequisite } from "./courseUtils";
import dotenv from "dotenv";
dotenv.config();

const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/**
 * Fetches full details for a single course and maps it to the Course type.
 */
export const getCourseDetails = cache(
  async (departmentCode: string, courseCodeNumber: string): Promise<Course | null> => {
    const upperDept = departmentCode.toUpperCase();
    const codeNumUpper = courseCodeNumber.toUpperCase();
    const fullCourseCode = `${upperDept} ${codeNumUpper}`;
    // Limit logging in production for performance/security
    if (process.env.NODE_ENV === "development") {
      console.log(`[Data] Fetching details for: ${fullCourseCode}`);
    }
    try {
      const dbCourse = await prisma.course.findUnique({
        where: {
          department_courseCode_unique: {
            department: upperDept,
            courseCode: fullCourseCode,
          },
        },
      });

      if (!dbCourse) {
        console.warn(`[Data] Course not found: ${fullCourseCode}`);
        return null;
      }
      const mappedCourse: Course = {
        id: dbCourse.id,
        department: dbCourse.department,
        courseCode: dbCourse.courseCode,
        title: dbCourse.title,
        units: dbCourse.units as Course["units"], // Adding Zod parsing here
        keywords: dbCourse.keywords,
        requirements: dbCourse.requirements as RequirementsData, // Adding Zod parsing here
        flattenedPrerequisites: dbCourse.flattenedPrerequisites,
        flattenedCorequisites: dbCourse.flattenedCorequisites,
        url: dbCourse.url,
        updatedAt: dbCourse.updatedAt.toISOString(),
      };
      return mappedCourse;
    } catch (error) {
      console.error(`[Data] Error in getCourseDetails for ${fullCourseCode}:`, error);
      return null;
    }
  },
);

/**
 * Fetches basic details (id, code, title, dept) for multiple course codes.
 * Optimized for list displays (e.g., "Required By", "Corequisite For").
 * Uses React Cache.
 */
export const getMultipleCourseDetails = cache(
  async (
    courseCodes: string[],
  ): Promise<Pick<Course, "id" | "department" | "courseCode" | "title">[]> => {
    if (!courseCodes || courseCodes.length === 0) return [];

    // Ensure consistent casing if necessary, though Prisma handles it well
    const upperCaseCodes = courseCodes.map(normalizeCourseCode);
    if (process.env.NODE_ENV === "development") {
      console.log(`[Data] Fetching basic details for ${courseCodes.length} courses.`);
    }
    try {
      const courses = await prisma.course.findMany({
        where: { courseCode: { in: upperCaseCodes } },
        select: COURSE_SELECTORS.BASIC,
      });
      return courses;
    } catch (error) {
      console.error(`[Data] Error fetching multiple course details:`, error);
      return []; // Return empty array on error
    }
  },
);

/**
 * Fetches basic details (id, code, title, dept) for all courses in a given department.
 * Optimized for list displays.
 * Uses React Cache.
 */
export const getCoursesByDepartment = cache(
  async (
    departmentCode: string,
  ): Promise<Pick<Course, "id" | "department" | "courseCode" | "title">[]> => {
    if (!departmentCode) return [];
    const upperDept = normalizeCourseCode(departmentCode);
    if (process.env.NODE_ENV === "development") {
      console.log(`[Data] Fetching basic details for courses in department: ${upperDept}`);
    }
    try {
      const courses = await prisma.course.findMany({
        where: { department: upperDept },
        select: COURSE_SELECTORS.BASIC,
        orderBy: { courseCode: "asc" },
      });
      return courses;
    } catch (error) {
      console.error(`[Data] Error fetching courses for department ${upperDept}:`, error);
      return [];
    }
  },
);

/**
 * Recursively fetches prerequisite courses using a PostgreSQL Recursive CTE.
 * Returns structured data including nodes (both Course objects and InputNode for text requirements)
 * and edges (AppEdge with depth information). Filters out high school requirements.
 * Uses Zod for runtime validation of raw SQL query results.
 * Uses React Cache.
 */

const RawCteResultSchema = z.object({
  id: z.string().uuid(),
  department: z.string(),
  courseCode: z.string(),
  title: z.string(),
  units: z.any().nullable(),
  keywords: z.array(z.string()),
  requirements: z.any().nullable(),
  flattenedPrerequisites: z.array(z.string()),
  flattenedCorequisites: z.array(z.string()),
  url: z.string().nullable(),
  updatedAt: z.date(),
  depth: z.number().int(),
  source_code: z.string().nullable(),
});
type RawCteResult = z.infer<typeof RawCteResultSchema>;

function processCourseNodes(
  validatedResults: RawCteResult[],
  courseNodesMap: Map<string, Course>,
  nodeDepths: Map<string, number>,
  finalEdges: AppEdge[],
): void {
  for (const row of validatedResults) {
    // Record course code in the known courses set via the map key.
    const courseCode = row.courseCode;
    const currentMin = nodeDepths.get(courseCode) ?? Infinity;
    nodeDepths.set(courseCode, Math.min(currentMin, row.depth));

    // Deduplicate: Add this row only once.
    if (!courseNodesMap.has(courseCode)) {
      const courseNode: Course = {
        id: row.id,
        department: row.department,
        courseCode: courseCode,
        title: row.title,
        units: row.units as Course["units"],
        keywords: row.keywords,
        requirements: row.requirements as RequirementsData,
        flattenedPrerequisites: row.flattenedPrerequisites,
        flattenedCorequisites: row.flattenedCorequisites,
        url: row.url,
        updatedAt: row.updatedAt.toISOString(),
      };
      courseNodesMap.set(courseCode, courseNode);
    }

    // Create edge from parent's course code to current course code (if not root)
    if (row.source_code) {
      const edgeId = `edge-${row.source_code}-to-${courseCode}-depth-${row.depth}`;
      finalEdges.push({
        id: edgeId,
        source: row.source_code,
        target: courseCode,
        data: { depth: row.depth },
      });
    }
  }
}

// Function for processing text-based prerequisites
function processTextPrerequisites(
  courseNodesMap: Map<string, Course>,
  nodeDepths: Map<string, number>,
  finalEdges: AppEdge[],
): Map<string, InputNode> {
  const textNodesMap = new Map<string, InputNode>();

  for (const [courseCode, courseNode] of courseNodesMap.entries()) {
    const sourceDepth = nodeDepths.get(courseCode);
    if (sourceDepth === undefined) continue;

    if (courseNode.flattenedPrerequisites) {
      for (const prereqString of courseNode.flattenedPrerequisites) {
        const normalizedPrereq = prereqString.toUpperCase().trim();
        // Only add if it's not already a known course and not a high school requirement
        if (!courseNodesMap.has(normalizedPrereq) && !isHighSchoolPrerequisite(prereqString)) {
          // Create text node if missing
          if (!textNodesMap.has(normalizedPrereq)) {
            const textNode: InputNode = {
              id: normalizedPrereq,
              data: {
                label: prereqString,
                isCourse: false,
                type: "text_requirement",
              },
            };
            textNodesMap.set(normalizedPrereq, textNode);
          }

          const targetDepth = sourceDepth + 1;
          const edgeId = `edge-${courseCode}-to-${normalizedPrereq}-depth-${targetDepth}`;
          if (!finalEdges.some((e) => e.id === edgeId)) {
            finalEdges.push({
              id: edgeId,
              source: courseCode,
              target: normalizedPrereq,
              data: { depth: targetDepth },
            });
          }
        }
      }
    }
  }
  return textNodesMap;
}

// Main function to fetch recursive prerequisites using CTE
export const getRecursivePrerequisitesCTE = cache(
  async (
    departmentCode: string,
    courseCodeNumber: string,
    maxDepth: number = 6,
  ): Promise<{ nodes: (Course | InputNode)[]; edges: AppEdge[] }> => {
    const deptUpper = normalizeCourseCode(departmentCode);
    const codeNumUpper = normalizeCourseCode(courseCodeNumber);
    const fullCourseCode = `${deptUpper} ${codeNumUpper}`;

    // Validate and normalize input
    try {
      CourseCodeSchema.parse(fullCourseCode); // Use schema
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(`[DataCTE] Invalid course code format for ${fullCourseCode}:`, error);
        // Re-throw the ZodError to be handled by the caller (consistent with getCoursesByDependency)
        throw error;
      } else {
        // Handle unexpected errors during validation (should be rare)
        console.error(`[DataCTE] Unexpected error during validation for ${fullCourseCode}:`, error);
        throw new Error("Unexpected validation error"); // Throw a generic error
      }
    }
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[DataCTE] Fetching recursive prerequisites for: ${fullCourseCode} up to depth ${maxDepth}`,
      );
    }

    const sql = Prisma.sql`
      WITH RECURSIVE PrereqGraph AS (
          SELECT
              c.id, c.department, c."courseCode", c.title, c.units, c.keywords,
              c.requirements, c."flattenedPrerequisites", c."flattenedCorequisites",
              c.url, c."updatedAt",
              0 AS depth,
              ARRAY[c."courseCode"] AS visited_path,
              NULL::text AS source_code
          FROM courses c
          WHERE c.department = ${deptUpper} AND c."courseCode" = ${fullCourseCode}

          UNION ALL

          SELECT
              prereq_course.id, prereq_course.department, prereq_course."courseCode", prereq_course.title,
              prereq_course.units, prereq_course.keywords, prereq_course.requirements,
              prereq_course."flattenedPrerequisites", prereq_course."flattenedCorequisites",
              prereq_course.url, prereq_course."updatedAt",
              pg.depth + 1,
              pg.visited_path || prereq_course."courseCode",
              pg."courseCode" AS source_code
          FROM courses prereq_course
          JOIN PrereqGraph pg ON prereq_course."courseCode" = ANY(pg."flattenedPrerequisites")
          WHERE NOT (prereq_course."courseCode" = ANY(pg.visited_path))
            AND pg.depth < ${maxDepth}
      )
      SELECT * FROM PrereqGraph;
    `;

    try {
      const rawResults = await prisma.$queryRaw<unknown[]>(sql);
      const validatedResults = z.array(RawCteResultSchema).parse(rawResults);

      // Initialize maps for course nodes and edges
      const courseNodesMap = new Map<string, Course>();
      const nodeDepths = new Map<string, number>();
      const finalEdges: AppEdge[] = [];

      // Pass 1: Process rows as course nodes and course-to-course edges
      processCourseNodes(validatedResults, courseNodesMap, nodeDepths, finalEdges);

      // Pass 2: Process missing prerequisites as text nodes
      const textNodesMap = processTextPrerequisites(courseNodesMap, nodeDepths, finalEdges);

      // Combine course nodes and text nodes into a single nodes array
      const finalNodes: (Course | InputNode)[] = [
        ...Array.from(courseNodesMap.values()),
        ...Array.from(textNodesMap.values()),
      ];

      if (process.env.NODE_ENV === "development") {
        console.log(
          `[DataCTE] Found ${courseNodesMap.size} course nodes, ${textNodesMap.size} text nodes, and ${finalEdges.length} total edges.`,
        );
      }

      return { nodes: finalNodes, edges: finalEdges };
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("[DataCTE] Zod validation failed:", JSON.stringify(error.errors, null, 2));
      } else {
        console.error(
          `[DataCTE] Error fetching recursive prerequisites for ${fullCourseCode}:`,
          error,
        );
      }
      return { nodes: [], edges: [] };
    }
  },
);

async function getCoursesByDependency(
  field: "flattenedPrerequisites" | "flattenedCorequisites",
  rawCourseCode: string,
  options?: { take?: number; skip?: number },
): Promise<Pick<Course, "id" | "department" | "courseCode" | "title">[]> {
  // 2.a Validate & normalize
  const courseCode = CourseCodeSchema.parse(rawCourseCode);

  try {
    // 2.b Build findMany args with optional pagination
    const findManyArgs: Parameters<typeof prisma.course.findMany>[0] = {
      where: { [field]: { has: courseCode } },
      select: COURSE_SELECTORS.BASIC,
      orderBy: { courseCode: "asc" as const },
      ...(options?.take !== undefined ? { take: options.take } : {}),
      ...(options?.skip !== undefined ? { skip: options.skip } : {}),
    };

    if (process.env.NODE_ENV === "development") {
      console.log(`[Data] Fetching courses where ${field} has ${courseCode}`, options);
    }

    return await prisma.course.findMany(findManyArgs);
  } catch (err) {
    // 2.c Surface errors so you can monitor/fail tests
    console.error(`[Data] Error in getCoursesByDependency(${field}, ${courseCode}):`, err);
    throw err;
  }
}

/**
 * "What classes has this as a prerequisite?"
 */
export const getCoursesRequiring = cache(
  async (targetCourseCode: string, options?: { take?: number; skip?: number }) => {
    return getCoursesByDependency("flattenedPrerequisites", targetCourseCode, options);
  },
);

/**
 * "What classes has this as a corequisite?"
 */
export const getCoursesHavingCorequisite = cache(
  async (targetCourseCode: string, options?: { take?: number; skip?: number }) => {
    return getCoursesByDependency("flattenedCorequisites", targetCourseCode, options);
  },
);
