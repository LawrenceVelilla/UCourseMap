// lib/data.ts
import 'server-only';
import { PrismaClient, Prisma } from '@prisma/client';
// Adjust path as necessary
import { Course, isRequirementsData, RequirementsData, InputNode, AppEdge } from './types';
import { cache } from 'react';

const prisma = new PrismaClient();

/**
 * Helper function to parse "DEPT CODE" string into components.
 * Returns null if parsing fails. Case-insensitive.
 */
function parseCourseString(courseString: string): { department: string; codeNumber: string } | null {
    if (!courseString) return null;
    const trimmedInput = courseString.trim().toUpperCase();
    const match = trimmedInput.match(/^([A-Z]+)\s*(\d+[A-Z]*)$/);
    if (match && match[1] && match[2]) {
        // Return department uppercase, codeNumber as found (which is uppercase)
        return { department: match[1], codeNumber: match[2] };
    }
    return null;
}

/**
 * Fetches full details for a single course and maps it to the Course type.
 */
export const getCourseDetails = cache(
    async (departmentCode: string, courseCodeNumber: string): Promise<Course | null> => {
        const upperDept = departmentCode.toUpperCase();
        // Construct the full code ensuring uppercase consistency
        const fullCourseCode = `${upperDept} ${courseCodeNumber.toUpperCase()}`;
        console.log(`[Data] Fetching details for: ${fullCourseCode}`);
        try {
            const dbCourse = await prisma.course.findUnique({
                where: {
                    department_courseCode_unique: {
                        department: upperDept,
                        courseCode: fullCourseCode,
                    }
                }
            });

            if (!dbCourse) return null;

            // Manual Mapping (ensure fields match Course type and Prisma schema)
            const mappedCourse: Course = {
                id: undefined, // Prisma handles this
                department: dbCourse.department, // From DB (should be uppercase)
                courseCode: dbCourse.courseCode, // From DB (should be uppercase)
                title: dbCourse.title,
                units: dbCourse.units as Course['units'], // Ensure this is typed correctly
                requirements: dbCourse.requirements as RequirementsData, // Ensure this is typed correctly
                flattenedPrerequisites: dbCourse.flattenedPrerequisites,
                flattenedCorequisites: dbCourse.flattenedCorequisites,
                url: dbCourse.url,
                keywords: dbCourse.keywords, // Include keywords
                updatedAt: dbCourse.updatedAt.toISOString(), // Convert Date to ISO string
                // Removed parsedDescription
            };
            return mappedCourse;

        } catch (error) {
            console.error(`[Data] Error in getCourseDetails for ${fullCourseCode}:`, error);
            return null;
        }
    }
);

/**
 * Fetches basic details (id, code, title, dept) for a list of course codes.
 * Used for lists (like Required By / Coreq For).
 */
export const getMultipleCourseDetails = cache(
  async (courseCodes: string[]): Promise<Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>[]> => {
    if (!courseCodes || courseCodes.length === 0) return [];

    // Ensure codes are consistently formatted (uppercase) if necessary before query
    const upperCaseCodes = courseCodes.map(code => code.toUpperCase());
    console.log(`[Data] Fetching basic details for ${courseCodes.length} courses.`);
    try {
      const courses = await prisma.course.findMany({
        where: { courseCode: { in: upperCaseCodes } },
        select: { id: true, department: true, courseCode: true, title: true },
      });
      return courses;
    } catch (error) {
      console.error(`[Data] Error fetching multiple course details:`, error);
      return [];
    }
  }
);

/**
 * Orchestrator: Fetches target course details + basic details of its *direct* prerequisites.
 * Less used now that CourseInfoWrapper fetches more, but kept for potential simpler use cases.
 */
export const getCourseAndPrerequisiteData = cache(
  async (departmentCode: string, courseCodeNumber: string) => {
    console.log(`[Data] Fetching course+prereq data for ${departmentCode.toUpperCase()} ${courseCodeNumber}`);
    const targetCourse = await getCourseDetails(departmentCode, courseCodeNumber);

    if (!targetCourse) {
      return { targetCourse: null, prerequisiteCourses: [] };
    }

    let prerequisiteCourses: Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>[] = [];
    if (targetCourse.flattenedPrerequisites && targetCourse.flattenedPrerequisites.length > 0) {
      // Filter out non-course strings before fetching details
      const prereqCourseCodes = targetCourse.flattenedPrerequisites.filter(req => parseCourseString(req));
      prerequisiteCourses = await getMultipleCourseDetails(prereqCourseCodes);
    }

    return { targetCourse, prerequisiteCourses };
  }
);

/**
 * Interface for the data structure returned by the recursive fetcher.
 * NOTE: Edge does NOT include depth yet.
 */
interface RecursiveData {
    nodes: Course[]; // Store *full* course details for nodes
    edges: { source: string; target: string }[]; // Simple source->target edges using courseCode
}

/**
 * Recursively fetches prerequisite courses up to a maximum depth.
 * Builds lists of unique nodes (full Course details) and edges.
 * Includes cycle detection.
 * Does NOT currently return edge depth.
 */
export const getRecursivePrerequisites = cache(
    async (
        departmentCode: string,
        courseCodeNumber: string,
        maxDepth: number = 4, // Sensible default max depth
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


/**
 * Fetches courses that list the target course code in their flattenedPrerequisites.
 * Returns basic details suitable for lists.
 */
export const getCoursesRequiring = cache(
    async (targetCourseCode: string): Promise<Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>[]> => {
        if (!targetCourseCode) return [];
        const upperTargetCode = targetCourseCode.toUpperCase();
        console.log(`[Data] Fetching courses requiring prerequisite: ${upperTargetCode}`);
        try {
            const courses = await prisma.course.findMany({
                where: { flattenedPrerequisites: { has: upperTargetCode } },
                select: { id: true, department: true, courseCode: true, title: true },
                orderBy: { courseCode: 'asc' },
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
 * Returns basic details suitable for lists.
 */
export const getCoursesHavingCorequisite = cache(
    async (targetCourseCode: string): Promise<Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>[]> => {
        if (!targetCourseCode) return [];
        const upperTargetCode = targetCourseCode.toUpperCase();
        console.log(`[Data] Fetching courses having corequisite: ${upperTargetCode}`);
        try {
            const courses = await prisma.course.findMany({
                where: { flattenedCorequisites: { has: upperTargetCode } },
                select: { id: true, department: true, courseCode: true, title: true },
                 orderBy: { courseCode: 'asc' },
            });
            return courses;
        } catch (error) {
            console.error(`[Data] Error fetching courses having ${upperTargetCode}:`, error);
            return [];
        }
    }
);