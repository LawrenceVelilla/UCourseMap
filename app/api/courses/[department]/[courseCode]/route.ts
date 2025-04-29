import { NextResponse, NextRequest } from "next/server";
import { getCourseDetails } from "@/lib/data";

// interface Params { // No longer strictly needed with 'any'
//   department: string;
//   courseCode: string;
// }

export async function GET(
  request: NextRequest,
  context: any, // Use 'any' for the context parameter
) {
  // Access params via the context object (assuming structure)
  const departmentCode = context?.params?.department;
  const courseCodeNumber = context?.params?.courseCode;

  if (!departmentCode || !courseCodeNumber) {
    return NextResponse.json(
      { message: "Department and Course Code are required" },
      { status: 400 },
    );
  }

  try {
    const course = await getCourseDetails(departmentCode, courseCodeNumber);

    if (!course) {
      return NextResponse.json(
        { message: `Course ${departmentCode.toUpperCase()} ${courseCodeNumber} not found` },
        { status: 404 },
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error(`API Error fetching course ${departmentCode} ${courseCodeNumber}:`, error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
