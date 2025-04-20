<<<<<<< HEAD
import { NextResponse } from 'next/server';
import { getCourseDetails } from '@/lib/data';
=======
import { NextResponse, NextRequest } from "next/server";
import { getCourseDetails } from "@/lib/data";
>>>>>>> 6f6aa09 (feat: Implemented a 'search mode' where users can either search by title, or by course code. Also added zod validation on data collection functions)

interface Params {
  department: string;
  courseCode: string;
}

export async function GET(
  request: Request,
  { params }: { params: Params }
) {
<<<<<<< HEAD
  const departmentCode = params.department;
  const courseCodeNumber = params.courseCode; 
=======
  // Access params via the context object (assuming structure)
  const departmentCode = context?.params?.department;
  const courseCodeNumber = context?.params?.courseCode;
>>>>>>> 6f6aa09 (feat: Implemented a 'search mode' where users can either search by title, or by course code. Also added zod validation on data collection functions)

  if (!departmentCode || !courseCodeNumber) {
    return NextResponse.json(
      { message: "Department and Course Code are required" },
      { status: 400 }
    );
  }

  try {
    // Call the data fetching function
    const course = await getCourseDetails(departmentCode, courseCodeNumber);

    if (!course) {
      // Data function returned null, meaning not found
      return NextResponse.json(
        { message: `Course ${departmentCode.toUpperCase()} ${courseCodeNumber} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    // Catch unexpected errors from the data function or processing
    console.error(`API Error fetching course ${departmentCode} ${courseCodeNumber}:`, error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
