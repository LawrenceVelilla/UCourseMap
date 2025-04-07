import 'server-only'
import { PrismaClient, Prisma } from '@prisma/client'; 
import { Course, isRequirementsData, RequirementsData } from './types'; 

const prisma = new PrismaClient();

/**
 * Fetches full details for a single course and maps it to the custom Course type.
 * Used as a building block by other functions.
 */
export async function getCourseDetails(departmentCode: string, courseCodeNumber: string): Promise<Course | null> {
    const upperDeptCode = departmentCode.toUpperCase();
    const fullCourseCode = `${upperDeptCode} ${courseCodeNumber}`;
    try {
        const dbCourse = await prisma.course.findUnique({
            where: {
                department_courseCode_unique: {
                    department: upperDeptCode,
                    courseCode: fullCourseCode,
                }
            }
        });

        if (!dbCourse) {
            // console.log(`getCourseDetails: Course ${fullCourseCode} not found in DB.`);
            return null; // Explicitly return null if not found
        }

        // --- Manual Mapping from Prisma.Course to types.Course ---
        const mappedCourse: Course = {
            id: dbCourse.id,
            department: dbCourse.department,
            courseCode: dbCourse.courseCode,
            title: dbCourse.title,
            units: dbCourse.units as Course['units'], // Requires validation or trust in DB structure
            parsedDescription: dbCourse.parsedDescription,
            requirements: isRequirementsData(dbCourse.requirements)
                ? dbCourse.requirements
                : null,
            flattenedPrerequisites: dbCourse.flattenedPrerequisites,
            flattenedCorequisites: dbCourse.flattenedCorequisites,
            url: dbCourse.url,
            updatedAt: dbCourse.updatedAt.toISOString(),
            // Add any other fields defined in your `Course` type if they exist in the DB
            // rawDescription: dbCourse.rawDescription,
        };
        return mappedCourse;

    } catch (error) {
        console.error(`Error in getCourseDetails for ${fullCourseCode}:`, error);
        return null; // Return null on error
    }
}

/**
 * Fetches basic details (id, code, title, dept) for a list of course codes.
 * Used primarily for displaying the list of direct prerequisites.
 */
export async function getMultipleCourseDetails(courseCodes: string[]): Promise<Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>[]> {
  if (!courseCodes || courseCodes.length === 0) {
    return [];
  }
  // console.log(`Fetching basic details for courses: ${courseCodes.join(', ')}`); // Less verbose log
  try {
    const courses = await prisma.course.findMany({
      where: {
        courseCode: {
          in: courseCodes,
        },
      },
      select: {
        id: true,
        department: true,
        courseCode: true,
        title: true,
      },
    });
    // Type assertion might be needed if Prisma's return type doesn't exactly match Pick<>
    // but select usually ensures this structure.
    return courses;
  } catch (error) {
    console.error(`Error fetching multiple course details:`, error);
    return []; // Return empty array on error
  }
}


/**
 * Orchestrator function: Fetches target course and *basic details* of its *direct* prerequisites.
 * Suitable for list-based display.
 */
export async function getCourseAndPrerequisiteData(departmentCode: string, courseCodeNumber: string) {
  const targetCourse = await getCourseDetails(departmentCode, courseCodeNumber);

  if (!targetCourse) {
    return { targetCourse: null, prerequisiteCourses: [] };
  }

  let prerequisiteCourses: Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>[] = [];
  if (targetCourse.flattenedPrerequisites && targetCourse.flattenedPrerequisites.length > 0) {
    prerequisiteCourses = await getMultipleCourseDetails(targetCourse.flattenedPrerequisites);
  }

  return {
    targetCourse: targetCourse, // Already correctly typed from getCourseDetails
    prerequisiteCourses,
  };
}

/**
 * Helper function to parse "DEPT CODE" string into components.
 * Returns null if parsing fails.
 */
function parseCourseString(courseString: string): { department: string; codeNumber: string } | null {
    if (!courseString) return null;
    const trimmedInput = courseString.trim().toUpperCase();
    // Regex: Dept(letters) + Optional Space + Number + Optional trailing letters
    const match = trimmedInput.match(/^([A-Z]+)\s*(\d+[A-Z]*)$/);
    if (match && match[1] && match[2]) {
        return { department: match[1], codeNumber: match[2] };
    }
    // console.warn(`Could not parse course string: "${courseString}"`);
    return null;
}

/**
 * NEW FUNCTION: Fetches all courses for a specific department.
 * Returns only basic details suitable for lists or autocomplete.
 */
export async function getCoursesByDepartment(departmentCode: string): Promise<Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>[]> {
  const upperDeptCode = departmentCode.toUpperCase();
  console.log(`Fetching courses for department: ${upperDeptCode}`); // Add log
  try {
    const courses = await prisma.course.findMany({
      where: {
        // Filter by the department code (case-insensitive search might be better depending on DB collation, but uppercase match is safer)
        department: upperDeptCode,
      },
      select: {
        // Select only the fields needed for the list/API response
        id: true,
        department: true,
        courseCode: true,
        title: true,
      },
      orderBy: {
        // Optional: Order courses numerically/alphabetically
        courseCode: 'asc',
      },
    });
    return courses; // Prisma's selected fields match the Pick<> type
  } catch (error) {
    console.error(`Error fetching courses for department ${upperDeptCode}:`, error);
    return []; // Return empty array on error, as the API route expects
  }
}


/**
 * Interface for the data structure returned by the recursive fetcher.
 */
interface RecursiveData {
    nodes: Course[]; // Store *full* course details for nodes (uses our mapped Course type)
    edges: { source: string; target: string }[]; // Simple source->target edges using courseCode
}

/**
 * Recursively fetches prerequisite courses up to a maximum depth.
 * Builds lists of unique nodes (full Course details) and edges.
 * Includes cycle detection using the `_visited` set.
 */
export async function getRecursivePrerequisites(
    departmentCode: string,
    courseCodeNumber: string,
    maxDepth: number = 3, // Default max depth to prevent excessive fetching
    _visited: Set<string> = new Set() // Internal set to track visited courses in this call stack
): Promise<RecursiveData> {

    const deptUpper = departmentCode.toUpperCase();
    const fullCourseCode = `${deptUpper} ${courseCodeNumber}`;

    // --- Base Cases for Recursion ---
    // 1. Already visited this course in this specific fetching path (cycle detected)
    if (_visited.has(fullCourseCode)) {
        // console.log(`Cycle detected or already visited: ${fullCourseCode}`);
        return { nodes: [], edges: [] };
    }
    // 2. Reached maximum depth
    if (maxDepth <= 0) {
        // console.log(`Max depth reached at: ${fullCourseCode}`);
        return { nodes: [], edges: [] };
    }
    // --- End Base Cases ---

    // Mark current course as visited FOR THIS RECURSIVE PATH
    _visited.add(fullCourseCode);

    // Fetch details for the current course
    const targetCourse = await getCourseDetails(deptUpper, courseCodeNumber);

    // If the current course doesn't exist, stop this branch of recursion
    if (!targetCourse) {
        console.warn(`Recursive fetch: Course ${fullCourseCode} not found.`);
         _visited.delete(fullCourseCode); // Remove from visited as it wasn't actually processed
        return { nodes: [], edges: [] };
    }

    // Initialize results: start with the current course node
    // Use a Map for nodes to easily handle deduplication based on courseCode key
    const allNodesMap = new Map<string, Course>();
    allNodesMap.set(fullCourseCode, targetCourse);

    const allEdges: { source: string; target: string }[] = [];
    const prerequisites = targetCourse.flattenedPrerequisites || [];

    // console.log(`Recursively fetching for ${fullCourseCode} (Depth: ${maxDepth}, Prereqs: ${prerequisites.length})`);

    // Recursively fetch for each prerequisite
    for (const prereqCode of prerequisites) {
        const parsedPrereq = parseCourseString(prereqCode);

        if (parsedPrereq) {
            // Add edge from the current course to this prerequisite
            allEdges.push({ source: fullCourseCode, target: prereqCode });

            // --- Recursive Call ---
            const subData = await getRecursivePrerequisites(
                parsedPrereq.department,
                parsedPrereq.codeNumber,
                maxDepth - 1, // Decrease depth for the next level
                _visited          // Pass the *same* visited set down
            );
            // --- End Recursive Call ---

            // Merge results from the sub-call
            subData.nodes.forEach(node => {
                // Add node to map only if it's not already there
                if (!allNodesMap.has(node.courseCode)) {
                    allNodesMap.set(node.courseCode, node);
                }
            });
            // Add all edges found in the sub-tree
            allEdges.push(...subData.edges);

        } else {
             console.warn(`Could not parse prerequisite code during recursive fetch: "${prereqCode}" from ${fullCourseCode}`);
        }
    }

     // IMPORTANT: Remove the current node from the visited set before returning up the stack.
     // This allows the same course to be visited via *different paths* in the tree.
     _visited.delete(fullCourseCode);

    // Return the consolidated nodes (from Map values) and edges
    return {
        nodes: Array.from(allNodesMap.values()),
        edges: allEdges,
    };
}