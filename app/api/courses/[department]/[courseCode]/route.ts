import { NextRequest, NextResponse } from 'next/server';
import { getCoursesByDepartment } from '@/lib/data'; 

// Interface defining the expected URL path parameter
interface DepartmentRouteParams {
  department: string;
}

interface CourseRouteParams {
  department: string;
  courseCode: string;
}


/**
 * API Route Handler for GET requests to /api/courses/[department]
 * Fetches and returns all courses listed under a specific department.
 */
export async function GET(
  request: NextRequest, // Use NextRequest
  context: { params: CourseRouteParams } // Context object with params
) {
  // Destructure the department code from params
  const { department, courseCode } = context.params;

  // Basic validation
  if (!department) {
    return NextResponse.json(
      { message: 'Department code parameter is required in the URL path' },
      { status: 400 } // Bad Request
    );
  }

  // Optional: Add more specific validation for department format
  // if (!/^[a-zA-Z]+$/.test(department)) {
  //   return NextResponse.json({ message: 'Invalid department code format' }, { status: 400 });
  // }

  try {
    // Call the data fetching function - **** Ensure this function exists! ****
    // If getCoursesByDepartment doesn't exist, you'll need to create it in lib/data.ts
    // using prisma.course.findMany({ where: { department: department.toUpperCase() } })
    const courses = await getCoursesByDepartment(department);

    // Check if the function returned results (it might return empty array if none found)
    // No specific check needed here unless you want to return 404 if department has 0 courses

    // Return the array of courses (or empty array) as JSON
    return NextResponse.json(courses);

  } catch (error) {
    // Catch unexpected errors during data fetching
    console.error(`API Error fetching courses for department ${department}:`, error);
    return NextResponse.json(
      { message: 'Internal Server Error while fetching department courses' },
      { status: 500 } // Internal Server Error
    );
  }
}

// Add other HTTP methods if needed