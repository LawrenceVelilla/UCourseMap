/*


This file is just for prototyping and testing purposes.



*/

import { NextResponse } from "next/server";
import { Course } from "../../../../lib/types";

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
      prerequisites: undefined, // Changed from null
      corequisites: undefined, // Changed from null
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
      corequisites: undefined, // Changed from null
      notes: undefined, // Changed from null
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
        // Example: Math 30-1 OR Pure Math 30
        operator: "OR",
        courses: ["MATHEMATICS 30-1", "PURE MATHEMATICS 30"],
        description: "One of Mathematics 30-1 or Pure Mathematics 30",
      },
      corequisites: undefined, // Changed from null
      notes: "Credit may be obtained for only one of MATH 102, 125, 127.",
    },
    flattenedPrerequisites: ["MATHEMATICS 30-1", "PURE MATHEMATICS 30"], // Simplified for example
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
        // Example: Math 30-1 OR Math 30-2
        operator: "OR",
        courses: ["MATHEMATICS 30-1", "MATHEMATICS 30-2"],
        description: "Mathematics 30-1 or 30-2.",
      },
      corequisites: undefined, // Changed from null
      notes: undefined, // Changed from null
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
          { operator: "OR", courses: ["CMPUT 175", "CMPUT 274"] }, // Assumes CMPUT 274 exists
          { operator: "AND", courses: ["MATH 125"] }, // Could just be courses: ['MATH 125']
        ],
        description: "One of CMPUT 175 or 274, and MATH 125.",
      },
      corequisites: undefined, // Changed from null
      notes: undefined, // Changed from null
    },
    flattenedPrerequisites: ["CMPUT 175", "CMPUT 274", "MATH 125"], // Simplified
    flattenedCorequisites: [],
    url: "https://apps.ualberta.ca/catalogue/course/cmput/272",
    updatedAt: new Date().toISOString(),
  },
  // Add more courses as needed for testing
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
