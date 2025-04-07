import { NextRequest, NextResponse } from 'next/server';
import { getCoursesByDepartment } from '@/lib/data'; 

// Define the params with the correct type that Next.js expects
type Params = {
  department: string;
  courseCode: string;
};

export async function GET(
  request: NextRequest,
  context: { params: {department: string, courseCode: string} }
) {
  // Access params directly
  const { department, courseCode } = context.params;

  // Basic validation
  if (!department) {
    return NextResponse.json(
      { message: 'Department code parameter is required in the URL path' },
      { status: 400 } 
    );
  }

  if (!courseCode) {
    return NextResponse.json(
      { message: 'Course code parameter is required in the URL path' },
      { status: 400 }
    );
  }

  try {
    // Call the data fetching function
    const courses = await getCoursesByDepartment(department);

    // Since this is a specific course route, you might want to filter for the specific course
    const specificCourse = courses.find(course => course.courseCode === courseCode);
    
    if (!specificCourse) {
      return NextResponse.json(
        { message: `Course ${courseCode} not found in department ${department}` },
        { status: 404 }
      );
    }

    // Return the specific course as JSON
    return NextResponse.json(specificCourse);

  } catch (error) {
    console.error(`API Error fetching course ${department} ${courseCode}:`, error);
    return NextResponse.json(
      { message: 'Internal Server Error while fetching course data' },
      { status: 500 }
    );
  }
}