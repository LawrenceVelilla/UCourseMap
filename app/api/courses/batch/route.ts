import { NextResponse } from "next/server";
import { Course } from "../../../../lib/types";

// Placeholder data for demonstration purposes
// IMPORTANT: Replace this with actual database fetching (e.g., Prisma)
const placeholderCourses: Course[] = [
  {
    id: "uuid-cmput-174",
    department: "CMPUT",
    courseCode: "CMPUT 174",
    title: "Introduction to Programming and Problem Solving I",
    units: { credits: 3, feeIndex: 1, term: "both" },
    keywords: ["programming", "python", "introductory"],
    requirements: {
      prerequisites: undefined,
      corequisites: undefined,
      notes: "Recommended for students with little or no programming background.",
    },
    flattenedPrerequisites: [],
    flattenedCorequisites: [],
    url: "https://apps.ualberta.ca/catalogue/course/cmput/174",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "uuid-cmput-175",
    department: "CMPUT",
    courseCode: "CMPUT 175",
    title: "Introduction to Programming and Problem Solving II",
    units: { credits: 3, feeIndex: 1, term: "both" },
    keywords: ["programming", "python", "data structures", "algorithms"],
    requirements: {
      prerequisites: {
        operator: "AND",
        courses: ["CMPUT 174"],
      },
      corequisites: undefined,
      notes: undefined,
    },
    flattenedPrerequisites: ["CMPUT 174"],
    flattenedCorequisites: [],
    url: "https://apps.ualberta.ca/catalogue/course/cmput/175",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "uuid-math-125",
    department: "MATH",
    courseCode: "MATH 125",
    title: "Linear Algebra I",
    units: { credits: 3, feeIndex: 1, term: "both" },
    keywords: ["math", "linear algebra", "vectors", "matrices"],
    requirements: {
      prerequisites: {
        operator: "OR",
        courses: ["MATHEMATICS 30-1", "PURE MATHEMATICS 30"],
        description: "One of Mathematics 30-1 or Pure Mathematics 30",
      },
      corequisites: undefined,
      notes: "Credit may be obtained for only one of MATH 102, 125, 127.",
    },
    flattenedPrerequisites: ["MATHEMATICS 30-1", "PURE MATHEMATICS 30"],
    flattenedCorequisites: [],
    url: "https://apps.ualberta.ca/catalogue/course/math/125",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "uuid-stat-151",
    department: "STAT",
    courseCode: "STAT 151",
    title: "Introduction to Applied Statistics I",
    units: { credits: 3, feeIndex: 1, term: "both" },
    keywords: ["statistics", "probability", "data analysis"],
    requirements: {
      prerequisites: {
        operator: "OR",
        courses: ["MATHEMATICS 30-1", "MATHEMATICS 30-2"],
        description: "Mathematics 30-1 or 30-2.",
      },
      corequisites: undefined,
      notes: undefined,
    },
    flattenedPrerequisites: ["MATHEMATICS 30-1", "MATHEMATICS 30-2"],
    flattenedCorequisites: [],
    url: "https://apps.ualberta.ca/catalogue/course/stat/151",
    updatedAt: new Date().toISOString(),
  },
  {
    id: "uuid-cmput-272",
    department: "CMPUT",
    courseCode: "CMPUT 272",
    title: "Formal Systems and Logic in Computing Science",
    units: { credits: 3, feeIndex: 1, term: "both" },
    keywords: ["logic", "proofs", "discrete math"],
    requirements: {
      prerequisites: {
        // Example: (CMPUT 175 OR CMPUT 274) AND MATH 125
        operator: "AND",
        conditions: [
          { operator: "OR", courses: ["CMPUT 175", "CMPUT 274"] },
          { operator: "AND", courses: ["MATH 125"] },
        ],
        description: "One of CMPUT 175 or 274, and MATH 125.",
      },
      corequisites: undefined,
      notes: undefined,
    },
    flattenedPrerequisites: ["CMPUT 175", "CMPUT 274", "MATH 125"],
    flattenedCorequisites: [],
    url: "https://apps.ualberta.ca/catalogue/course/cmput/272",
    updatedAt: new Date().toISOString(),
  },
];

interface BatchCourseRequestBody {
  courseCodes: string[];
}

export async function POST(request: Request) {
  try {
    const body: BatchCourseRequestBody = await request.json();
    const { courseCodes } = body;

    if (!Array.isArray(courseCodes)) {
      return NextResponse.json(
        { message: "Invalid request body. Expected { courseCodes: string[] }." },
        { status: 400 },
      );
    }

    // Filter placeholder data based on requested codes
    const foundCourses = placeholderCourses.filter((course) =>
      courseCodes.includes(course.courseCode),
    );

    // In a real app using Prisma:
    // const foundCourses = await prisma.course.findMany({
    //   where: {
    //     courseCode: {
    //       in: courseCodes,
    //     },
    //   },
    //   // Ensure all necessary fields, especially relations/JSON fields like requirements, are included
    // });

    console.log(`Fetched data for courses: ${foundCourses.map((c) => c.courseCode).join(", ")}`);
    return NextResponse.json(foundCourses, { status: 200 });
  } catch (error) {
    console.error("Error fetching batch course data:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { message: "Failed to fetch batch course data", error: errorMessage },
      { status: 500 },
    );
  }
}
