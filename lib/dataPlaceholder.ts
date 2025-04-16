// lib/data.ts
import 'server-only'; // Ensures this module only runs on the server
import { PrismaClient, Prisma } from '@prisma/client';
// Adjust path as necessary - Ensure all types are correctly defined and exported from './types'
import { Course, RequirementsData, InputNode, AppEdge, isRequirementsData } from './types';
import { cache } from 'react'; // Use React's caching mechanism
import { z } from 'zod'; // Import Zod for runtime validation

// --- Prisma Client Setup (Singleton Pattern) ---
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient({
    // Optional: Add logging configuration if needed for debugging
    // log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// --- Helper Functions ---

/**
 * Parses a course string (e.g., "CMPUT 174") into department and code number.
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

/**
 * Set of known high school course patterns to ignore in prerequisites.
 * Uses uppercase for case-insensitive comparison. Add more as needed.
 */
const highSchoolPatterns = new Set([
    "MATHEMATICS 30-1", "MATH 30-1",
    "MATHEMATICS 31", "MATH 31",
    "PHYSICS 30",
    "CHEMISTRY 30",
    "BIOLOGY 30",
    "ENGLISH LANGUAGE ARTS 30-1", "ELA 30-1",
    // Add other common high school equivalents found in UAlberta requirements
]);

/**
 * Checks if a prerequisite string matches a known high school pattern.
 */
const isHighSchoolPrereq = (text: string): boolean => {
    const upperText = text.toUpperCase().trim(); // Normalize before checking
    // Check for exact matches in the set
    if (highSchoolPatterns.has(upperText)) {
        return true;
    }
    // Optional: Add regex checks here for more complex high school patterns if needed
    // e.g., /^(MATHEMATICS|MATH)\s+30-2$/i.test(text)
    return false;
};


// --- Zod Schema for validating raw CTE results ---
// Ensures the data structure returned by the raw SQL query matches expectations.
const RawCteResultSchema = z.object({
    id: z.string().uuid(),
    department: z.string(),
    courseCode: z.string(),
    title: z.string(),
    units: z.any().nullable(), // Use z.any() or define a precise Zod schema for your 'units' JSON structure
    keywords: z.array(z.string()),
    requirements: z.any().nullable(), // Use z.any() or define a precise Zod schema for 'RequirementsData' JSON
    flattenedPrerequisites: z.array(z.string()),
    flattenedCorequisites: z.array(z.string()),
    url: z.string().nullable(),
    updatedAt: z.date(), // Postgres returns Date objects for Timestamptz

    // CTE specific fields
    depth: z.number().int(), // Depth of the current node in the traversal
    source_code: z.string().nullable(), // The course code requiring this prerequisite (null for the root node)
});
// Type inferred from the Zod schema for convenience
type RawCteResult = z.infer<typeof RawCteResultSchema>;


// --- Main Data Fetching Functions ---

/**
 * Fetches full details for a single course by department and code number.
 * Uses React Cache for memoization within a single request lifecycle.
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
                id: dbCourse.id, // Keep ID if the Course type definition includes it
                department: dbCourse.department,
                courseCode: dbCourse.courseCode,
                title: dbCourse.title,
                units: dbCourse.units as Course['units'], // Consider adding Zod parsing here
                keywords: dbCourse.keywords,
                requirements: dbCourse.requirements as RequirementsData, // Consider adding Zod parsing here
                flattenedPrerequisites: dbCourse.flattenedPrerequisites,
                flattenedCorequisites: dbCourse.flattenedCorequisites,
                url: dbCourse.url,
                updatedAt: dbCourse.updatedAt.toISOString(), // Convert Date to ISO string for client compatibility
            };
            // Optional: Validate mappedCourse against a Zod schema for Course type
            return mappedCourse;

        } catch (error) {
            console.error(`[Data] Error in getCourseDetails for ${fullCourseCode}:`, error);
            return null; // Return null on error to handle gracefully downstream
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
export const getRecursivePrerequisitesCTE = cache(
    async (
        departmentCode: string,
        courseCodeNumber: string,
        maxDepth: number = 4 // Sensible default max depth for performance
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
                -- Anchor Member (Base Case): Select the starting course
                SELECT
                    c.id, c.department, c."courseCode", c.title, c.units, c.keywords,
                    c.requirements, c."flattenedPrerequisites", c."flattenedCorequisites",
                    c.url, c."updatedAt",
                    0 AS depth,                             -- Initial depth is 0
                    ARRAY[c."courseCode"] AS visited_path,  -- Path tracking for cycle detection
                    NULL::text AS source_code               -- Root node has no source in this traversal
                FROM
                    courses c -- Use the mapped table name "courses" from schema.prisma
                WHERE
                    c.department = ${deptUpper} AND c."courseCode" = ${fullCourseCode}

                UNION ALL

                -- Recursive Member: Find direct prerequisites of courses found in the previous step
                SELECT
                    prereq_course.id, prereq_course.department, prereq_course."courseCode", prereq_course.title,
                    prereq_course.units, prereq_course.keywords, prereq_course.requirements,
                    prereq_course."flattenedPrerequisites", prereq_course."flattenedCorequisites",
                    prereq_course.url, prereq_course."updatedAt",
                    pg.depth + 1,                           -- Increment depth
                    pg.visited_path || prereq_course."courseCode", -- Append current course to path
                    pg."courseCode" AS source_code          -- The course from the previous level is the source
                FROM
                    courses prereq_course
                JOIN
                    PrereqGraph pg ON prereq_course."courseCode" = ANY(pg."flattenedPrerequisites") -- Join based on prereq list in parent
                WHERE
                    NOT (prereq_course."courseCode" = ANY(pg.visited_path)) -- Cycle Detection check
                    AND pg.depth < ${maxDepth}              -- Apply max depth limit
            )
            -- Final Select: Get all unique rows generated by the CTE traversal
            SELECT * FROM PrereqGraph;
        `;

        try {
            // Execute the raw query using Prisma's tagged template function for safety
            const rawResults = await prisma.$queryRaw<unknown[]>(sql);

            // Validate the raw results at runtime using the Zod schema
            const validatedResults = z.array(RawCteResultSchema).parse(rawResults);

            // --- Post-Processing: Map validated results + add text nodes/edges ---
            const courseNodesMap = new Map<string, Course>();       // Stores found Course nodes (courseCode -> Course)
            const textNodesMap = new Map<string, InputNode>();      // Stores generated Text Requirement nodes (text -> InputNode)
            const finalEdges: AppEdge[] = [];                       // Accumulates all edges
            const knownCourseCodes = new Set<string>();             // Tracks course codes found by the CTE
            const nodeDepths = new Map<string, number>();           // Stores the shallowest depth found for each course

            // --- Pass 1: Process CTE results ---
            // Populate maps/sets for known courses and create edges between them
            for (const row of validatedResults) {
                knownCourseCodes.add(row.courseCode); // Add course code returned by CTE to our set

                // Store/update the node depth (take the minimum depth if reached via multiple paths)
                const currentMinDepth = nodeDepths.get(row.courseCode) ?? Infinity;
                nodeDepths.set(row.courseCode, Math.min(currentMinDepth, row.depth));

                // Store course node details if not already mapped (deduplication)
                if (!courseNodesMap.has(row.courseCode)) {
                    const courseNode: Course = { // Map DB row to application Course type
                        id: row.id,
                        department: row.department,
                        courseCode: row.courseCode,
                        title: row.title,
                        units: row.units as Course['units'],
                        keywords: row.keywords,
                        requirements: row.requirements as RequirementsData,
                        flattenedPrerequisites: row.flattenedPrerequisites,
                        flattenedCorequisites: row.flattenedCorequisites,
                        url: row.url,
                        updatedAt: row.updatedAt.toISOString(),
                    };
                    courseNodesMap.set(row.courseCode, courseNode);
                }

                // Add edge if it connects two courses FOUND BY THE CTE
                // (source_code is the parent course code, row.courseCode is the child/prereq course code)
                if (row.source_code) { // Ensure it's not the root node
                     const edgeId = `edge-${row.source_code}-to-${row.courseCode}-depth-${row.depth}`;
                     finalEdges.push({
                        id: edgeId,
                        source: row.source_code, // Parent course code
                        target: row.courseCode, // Child/Prereq course code found in DB
                        data: { depth: row.depth }, // Depth of the TARGET node
                        // Add other edge properties like 'animated' if needed
                    });
                }
            }

            // --- Pass 2: Identify and add missing/text prerequisites ---
            // Iterate through the actual Course nodes found by the CTE
            for (const [courseCode, courseNode] of courseNodesMap.entries()) {
                // Get the depth of the current course node (parent in this context)
                const sourceNodeDepth = nodeDepths.get(courseCode);
                if (sourceNodeDepth === undefined) continue; // Safety check

                // Check its listed prerequisites
                if (courseNode.flattenedPrerequisites) {
                    for (const prereqString of courseNode.flattenedPrerequisites) {
                        const normalizedPrereq = prereqString.toUpperCase().trim(); // Normalize for consistent checks/IDs

                        // Condition: Is this prerequisite string NOT a known course code AND NOT a high school req?
                        if (!knownCourseCodes.has(normalizedPrereq) && !isHighSchoolPrereq(prereqString)) {
                            // This is a text/missing prerequisite we need to represent

                            // Create the text node if it doesn't already exist in our text node map
                            if (!textNodesMap.has(normalizedPrereq)) {
                                const textNode: InputNode = {
                                    id: normalizedPrereq, // Use the normalized text as the unique ID
                                    data: {
                                        label: prereqString, // Display the original string
                                        isCourse: false,     // Flag as not a real course
                                        type: 'text_requirement', // Custom type for styling
                                    },
                                    // Position is typically handled by the layout algorithm (e.g., Dagre)
                                };
                                textNodesMap.set(normalizedPrereq, textNode);
                            }

                            // Create the edge from the current course (source) to this text node (target)
                            const targetNodeDepth = sourceNodeDepth + 1; // Text node is one level deeper
                            const edgeId = `edge-${courseCode}-to-${normalizedPrereq}-depth-${targetNodeDepth}`;

                            // Avoid adding duplicate edges (important if same text req listed multiple times?)
                             if (!finalEdges.some(e => e.id === edgeId)) {
                                finalEdges.push({
                                    id: edgeId,
                                    source: courseCode,         // Source is the current course node
                                    target: normalizedPrereq,   // Target is the text node's ID
                                    data: { depth: targetNodeDepth }, // Depth of the text node level
                                    // Optional: Add styling for edges pointing to text nodes
                                    // style: { stroke: '#aaa', strokeDasharray: '5 5' }
                                });
                            }
                        }
                    }
                }
            }

            // --- Combine Nodes from both maps ---
            const finalNodes: (Course | InputNode)[] = [
                ...Array.from(courseNodesMap.values()), // Add all Course objects
                ...Array.from(textNodesMap.values())    // Add all generated InputNode objects
            ];

            if (process.env.NODE_ENV === 'development') {
                 console.log(`[DataCTE] Found ${courseNodesMap.size} course nodes, ${textNodesMap.size} text nodes, and ${finalEdges.length} total edges.`);
            }

            return {
                nodes: finalNodes, // Return combined list of nodes
                edges: finalEdges, // Return the list of edges (course->course and course->text)
            };

        } catch (error) {
            // Catch and log both Zod validation errors and general query errors
            if (error instanceof z.ZodError) {
                 console.error("[DataCTE] Zod validation failed:", JSON.stringify(error.errors, null, 2));
            } else {
                console.error(`[DataCTE] Error fetching recursive prerequisites for ${fullCourseCode}:`, error);
            }
            // Return an empty structure on any error to prevent crashes downstream
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

// Note: The original `getRecursivePrerequisites` function (the one with N+1 problem) has been removed
// and replaced by `getRecursivePrerequisitesCTE`. If you need the old one for comparison,
// you can keep it commented out or rename it.

/*
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
*/