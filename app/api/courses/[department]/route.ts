// app/api/courses/[department]/route.ts
<<<<<<< HEAD
import { NextResponse } from 'next/server';
import { getCoursesByDepartment } from '@/lib/data'; // Adjust path if needed
=======
import { NextResponse, NextRequest } from "next/server";
import { getCoursesByDepartment } from "@/lib/data"; // Adjust path if needed
>>>>>>> 6f6aa09 (feat: Implemented a 'search mode' where users can either search by title, or by course code. Also added zod validation on data collection functions)

interface Params {
  department: string;
}

export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  const departmentCode = params.department;

  if (!departmentCode) {
    return NextResponse.json({ message: "Department code is required" }, { status: 400 });
  }

  try {
    // Call the data fetching function
    const courses = await getCoursesByDepartment(departmentCode);

    // Note: getCoursesByDepartment already handles errors internally by returning []
    // If it threw errors, we'd need a try/catch here too.

    return NextResponse.json(courses);
  } catch (error) {
    // This catch is for unexpected errors during the process
    console.error(`API Error fetching courses for ${departmentCode}:`, error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
