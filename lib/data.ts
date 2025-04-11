import 'server-only'; 
import { PrismaClient, Prisma } from '@prisma/client';
import { Course, RequirementsData, InputNode, AppEdge, isRequirementsData } from './types';
import { cache } from 'react';
import { z } from 'zod'; 


const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient({
});
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// --- Helper Functions ---

/**
 * Parses a course string (e.g., "CMPUT 17") into department and code number.
 * Returns null if the format is invalid.
 */
function parseCourseString(courseString: string): { department: string; codeNumber: string } | null {
    if (!courseString) return null;
    const trimmedInput = courseString.trim().toUpperCase();
    // Regex to capture standard UAlberta course format
    const match = trimmedInput.match(/^([A-Z]+)\s*(\d+[A-Z]*)$/);
    if (match && match[1] && match[2]) {
        // Return consistent uppercase department and code number
        return { department: match[1], codeNumber: match[2] };
    }
   return null;
}


// --- Main Data Fetching Functions ---

/**
<<<<<<< HEAD
<<<<<<< HEAD
=======
 * Fetches full details for a single course and maps it to the Course type.
=======
 * Fetches full details for a single course by department and code number.
 * Uses React Cache for memoization within a single request lifecycle.
>>>>>>> 3d6741f (Implemented the RecursiveCTE to solve N+1 problem)
 */
export const getCourseDetails = cache(
    async (departmentCode: string, courseCodeNumber: string): Promise<Course | null> => {
        const upperDept = departmentCode.toUpperCase();
        const codeNumUpper = courseCodeNumber.toUpperCase();
        const fullCourseCode = `${upperDept} ${codeNumUpper}`;
        // Limit logging in production for performance/security
        if (process.env.NODE_ENV === 'development') {
            console.log(`[Data] Fetching details for: ${fullCourseCode}`);
        }
        try {
            const dbCourse = await prisma.course.findUnique({
                where: {
                    department_courseCode_unique: {
                        department: upperDept,
                        courseCode: fullCourseCode,
                    }
                }
            });

            if (!dbCourse) {
                console.warn(`[Data] Course not found: ${fullCourseCode}`);
                return null;
            }

            // Map database result to application's Course type
            // Perform runtime validation/parsing for JSON fields if necessary
            const mappedCourse: Course = {
                id: dbCourse.id, 
                department: dbCourse.department,
                courseCode: dbCourse.courseCode,
                title: dbCourse.title,
                units: dbCourse.units as Course['units'], // Adding Zod parsing here
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
    }
);

/**
 * Fetches basic details (id, code, title, dept) for multiple course codes.
 * Optimized for list displays (e.g., "Required By", "Corequisite For").
 * Uses React Cache.
 */
export const getMultipleCourseDetails = cache(
    async (courseCodes: string[]): Promise<Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>[]> => {
        if (!courseCodes || courseCodes.length === 0) return [];

        // Ensure consistent casing if necessary, though Prisma handles it well
        const upperCaseCodes = courseCodes.map(code => code.toUpperCase().trim());
        if (process.env.NODE_ENV === 'development') {
             console.log(`[Data] Fetching basic details for ${courseCodes.length} courses.`);
        }
        try {
            const courses = await prisma.course.findMany({
                where: { courseCode: { in: upperCaseCodes } },
                // Select only the absolutely necessary fields for the list display
                select: { id: true, department: true, courseCode: true, title: true },
            });
            // Direct return as selected fields match the desired Pick<...> type
            return courses;
        } catch (error) {
            console.error(`[Data] Error fetching multiple course details:`, error);
            return []; // Return empty array on error
        }
    }
);

/**
 * Recursively fetches prerequisite courses using a PostgreSQL Recursive CTE.
 * Returns structured data including nodes (both Course objects and InputNode for text requirements)
 * and edges (AppEdge with depth information). Filters out high school requirements.
 * Uses Zod for runtime validation of raw SQL query results.
 * Uses React Cache.
 */


const highSchoolPatterns = new Set([
  "MATHEMATICS 30-1",
  "MATHEMATICS 31",
  "PURE MATHEMATICS 30",
  "PURE MATHEMATICS 31",
  "PHYSICS 30",
  "CHEMISTRY 30",
  "BIOLOGY 30",
  "ENGLISH LANGUAGE ARTS 30-1", "ELA 30-1"
]);
const isHighSchoolPrereq = (text: string): boolean => {
  return highSchoolPatterns.has(text.toUpperCase().trim());
};

// --- Zod Schema for validating raw CTE results ---
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

// --- Helper for Pass 1: Process CTE rows into Course Nodes and Course–Course Edges ---
function processCourseNodes(
  validatedResults: RawCteResult[],
  courseNodesMap: Map<string, Course>,
  nodeDepths: Map<string, number>,
  finalEdges: AppEdge[]
): void {
  for (const row of validatedResults) {
    // Record course code in the known courses set via the map key.
    const courseCode = row.courseCode;
    // Update node depth: keep the minimum depth seen.
    const currentMin = nodeDepths.get(courseCode) ?? Infinity;
    nodeDepths.set(courseCode, Math.min(currentMin, row.depth));

    // Deduplicate: Add this row only once.
    if (!courseNodesMap.has(courseCode)) {
      const courseNode: Course = {
        id: row.id,
        department: row.department,
        courseCode: courseCode,
        title: row.title,
        units: row.units as Course['units'],
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

// --- Helper for Pass 2: Process missing (text) prerequisites ---
function processTextPrerequisites(
  courseNodesMap: Map<string, Course>,
  nodeDepths: Map<string, number>,
  finalEdges: AppEdge[]
): Map<string, InputNode> {
  const textNodesMap = new Map<string, InputNode>();

  for (const [courseCode, courseNode] of courseNodesMap.entries()) {
    const sourceDepth = nodeDepths.get(courseCode);
    if (sourceDepth === undefined) continue;

    // Check each prerequisite in the flattened list
    if (courseNode.flattenedPrerequisites) {
      for (const prereqString of courseNode.flattenedPrerequisites) {
        const normalizedPrereq = prereqString.toUpperCase().trim();
        // Only add if it's not already a known course and not a high school requirement
        if (!courseNodesMap.has(normalizedPrereq) && !isHighSchoolPrereq(prereqString)) {
          // Create text node if missing
          if (!textNodesMap.has(normalizedPrereq)) {
            const textNode: InputNode = {
              id: normalizedPrereq,
              data: {
                label: prereqString,
                isCourse: false,
                type: 'text_requirement',
              },
              // Position will be handled by layout
            };
            textNodesMap.set(normalizedPrereq, textNode);
          }
          // Create edge from current course node to this text node
          const targetDepth = sourceDepth + 1;
          const edgeId = `edge-${courseCode}-to-${normalizedPrereq}-depth-${targetDepth}`;
          if (!finalEdges.some(e => e.id === edgeId)) {
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

// --- Main Improved CTE Function ---
export const getRecursivePrerequisitesCTE = cache(
  async (
    departmentCode: string,
    courseCodeNumber: string,
    maxDepth: number = 6
  ): Promise<{ nodes: (Course | InputNode)[], edges: AppEdge[] }> => {
    const deptUpper = departmentCode.toUpperCase();
    const codeNumUpper = courseCodeNumber.toUpperCase();
    const fullCourseCode = `${deptUpper} ${codeNumUpper}`;

    if (process.env.NODE_ENV === 'development') {
      console.log(`[DataCTE] Fetching recursive prerequisites for: ${fullCourseCode} up to depth ${maxDepth}`);
    }

    // --- The Recursive CTE SQL Query ---
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
      // Execute the recursive CTE query
      const rawResults = await prisma.$queryRaw<unknown[]>(sql);
      const validatedResults = z.array(RawCteResultSchema).parse(rawResults);

      // --- Post-Processing: Modularized in two passes ---
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
        ...Array.from(textNodesMap.values())
      ];

      if (process.env.NODE_ENV === 'development') {
        console.log(`[DataCTE] Found ${courseNodesMap.size} course nodes, ${textNodesMap.size} text nodes, and ${finalEdges.length} total edges.`);
      }

      return { nodes: finalNodes, edges: finalEdges };

    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error("[DataCTE] Zod validation failed:", JSON.stringify(error.errors, null, 2));
      } else {
        console.error(`[DataCTE] Error fetching recursive prerequisites for ${fullCourseCode}:`, error);
      }
      return { nodes: [], edges: [] };
    }
  }
);



/**
 * Fetches courses that list the target course code in their flattenedPrerequisites.
 * Returns basic details suitable for list displays ("Required By").
 * Uses React Cache.
 */
export const getCoursesRequiring = cache(
    async (targetCourseCode: string): Promise<Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>[]> => {
        if (!targetCourseCode) return [];
        const upperTargetCode = targetCourseCode.toUpperCase().trim();
         if (process.env.NODE_ENV === 'development') {
            console.log(`[Data] Fetching courses requiring prerequisite: ${upperTargetCode}`);
        }
        try {
            const courses = await prisma.course.findMany({
                // Use Prisma's efficient array 'has' filter for text[] columns
                where: { flattenedPrerequisites: { has: upperTargetCode } },
                select: { id: true, department: true, courseCode: true, title: true },
                orderBy: { courseCode: 'asc' }, // Consistent ordering
            });
            return courses;
        } catch (error) {
            console.error(`[Data] Error fetching courses requiring ${upperTargetCode}:`, error);
            return [];
        }
    }
);

/**
 * Fetches courses that list the target course code in their flattenedCorequisites.
 * Returns basic details suitable for list displays ("Corequisite For").
 * Uses React Cache.
 */
export const getCoursesHavingCorequisite = cache(
    async (targetCourseCode: string): Promise<Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>[]> => {
        if (!targetCourseCode) return [];
        const upperTargetCode = targetCourseCode.toUpperCase().trim();
         if (process.env.NODE_ENV === 'development') {
            console.log(`[Data] Fetching courses having corequisite: ${upperTargetCode}`);
        }
        try {
            const courses = await prisma.course.findMany({
                // Use Prisma's efficient array 'has' filter for text[] columns
                where: { flattenedCorequisites: { has: upperTargetCode } },
                select: { id: true, department: true, courseCode: true, title: true },
                orderBy: { courseCode: 'asc' }, // Consistent ordering
            });
            return courses;
        } catch (error) {
            console.error(`[Data] Error fetching courses having ${upperTargetCode}:`, error);
            return [];
        }
    }
);


// --- DEPRECATED / REMOVED FUNCTIONS ---
// The original `getRecursivePrerequisites` (N+1 version) has been removed.
// The `getCourseAndPrerequisiteData` might be less useful now with the CTE providing
// full recursive data, but can be kept if simple direct prereq lists are needed elsewhere.

/**
 * Orchestrator: Fetches target course details + basic details of its *direct* prerequisites.
 * Less critical now with CTE, but kept for potential simpler use cases or reference.
 * Uses React Cache.
 */
 export const getCourseAndPrerequisiteData = cache(
     async (departmentCode: string, courseCodeNumber: string) => {
         const targetCourse = await getCourseDetails(departmentCode, courseCodeNumber);

         if (!targetCourse) {
             return { targetCourse: null, prerequisiteCourses: [] };
         }

         let prerequisiteCourses: Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>[] = [];
         // Check if flattenedPrerequisites is an array and has items
         if (Array.isArray(targetCourse.flattenedPrerequisites) && targetCourse.flattenedPrerequisites.length > 0) {
             // Filter out non-course strings *before* fetching details
             const prereqCourseCodes = targetCourse.flattenedPrerequisites
     .map(req => {
         const parsed = parseCourseString(req);
         // Create the full course code if parsing succeeded
         return parsed ? `${parsed.department} ${parsed.codeNumber}` : null;
     })
     .filter((code): code is string => !!code);

             if (prereqCourseCodes.length > 0) {
                 prerequisiteCourses = await getMultipleCourseDetails(prereqCourseCodes);
             }
         }

         return { targetCourse, prerequisiteCourses };
     }
);

<<<<<<< HEAD
/**
>>>>>>> 5dc1d31 (Fixed parser and data pipeline to remove parsed description and use keywords instead to avoid any ToS violations)
 * Interface for the data structure returned by the recursive fetcher.
 * NOTE: Edge does NOT include depth yet.
 */
interface RecursiveData {
    nodes: Course[]; // Store *full* course details for nodes
    edges: { source: string; target: string }[]; // Simple source->target edges using courseCode
}
=======
// Note: The original `getRecursivePrerequisites` function (the one with N+1 problem) has been removed
// and replaced by `getRecursivePrerequisitesCTE`. If you need the old one for comparison,
// you can keep it commented out or rename it.
>>>>>>> 3d6741f (Implemented the RecursiveCTE to solve N+1 problem)

/*
export const getRecursivePrerequisites = cache(
    async (
        departmentCode: string,
        courseCodeNumber: string,
        maxDepth: number = , // Sensible default max depth
        _visited: Set<string> = new Set() // Internal cycle detection
    ): Promise<RecursiveData> => {

        const deptUpper = departmentCode.toUpperCase();
        const codeNumUpper = courseCodeNumber.toUpperCase();
        const fullCourseCode = `${deptUpper} ${codeNumUpper}`;

        // --- Base Cases ---
        if (_visited.has(fullCourseCode)) return { nodes: [], edges: [] }; // Cycle
        if (maxDepth <= 0) return { nodes: [], edges: [] }; // Depth limit
        // --- End Base Cases ---

        _visited.add(fullCourseCode);

        const targetCourse = await getCourseDetails(deptUpper, codeNumUpper);
        if (!targetCourse) {
            _visited.delete(fullCourseCode); // Backtrack visited if not found
            return { nodes: [], edges: [] };
        }

        const allNodesMap = new Map<string, Course>();
        allNodesMap.set(fullCourseCode, targetCourse);
        const allEdges: { source: string; target: string }[] = [];
        const prerequisites = targetCourse.flattenedPrerequisites || [];

        // console.log(`[Data] Recursively fetching for ${fullCourseCode} (Depth: ${maxDepth})`);

        for (const prereqCode of prerequisites) {
            const parsedPrereq = parseCourseString(prereqCode); // Check if it's a course code

            // Add edge regardless of whether target is course or text
            allEdges.push({ source: fullCourseCode, target: prereqCode.toUpperCase() }); // Store target uppercase

            if (parsedPrereq) { // Only recurse if it's a parsable course code
                const subData = await getRecursivePrerequisites(
                    parsedPrereq.department,
                    parsedPrereq.codeNumber,
                    maxDepth - 1,
                    _visited
                );
                subData.nodes.forEach(node => allNodesMap.set(node.courseCode, node)); // Deduplicate nodes
                allEdges.push(...subData.edges); // Add edges from sub-tree
            }
        }

        _visited.delete(fullCourseCode); // Allow visiting via different paths

        return {
            nodes: Array.from(allNodesMap.values()),
            edges: allEdges, // Edges might contain duplicates if graph has multiple paths; React Flow usually handles this
        };
    }
);
*/