<<<<<<< HEAD
// app/api/courses/[department]/route.ts
<<<<<<< HEAD
import { NextResponse } from 'next/server';
import { getCoursesByDepartment } from '@/lib/data'; // Adjust path if needed
=======
import { NextResponse, NextRequest } from "next/server";
import { getCoursesByDepartment } from "@/lib/data"; // Adjust path if needed
>>>>>>> 6f6aa09 (feat: Implemented a 'search mode' where users can either search by title, or by course code. Also added zod validation on data collection functions)
=======
import { NextResponse } from "next/server";
import { getCoursesByDepartment } from "@/lib/data"; // Adjust path if needed
>>>>>>> e3bf9f3 (chore: Rebase broke a coouple of GET endpoints along with leaving some merge headers)

interface Params {
  department: string;
}

<<<<<<< HEAD
export async function GET(
<<<<<<< HEAD
  request: Request,
  { params }: { params: Params }
=======
  request: NextRequest,
  context: any, // Use 'any' for the context parameter
>>>>>>> 2189e6d (feat: Implement Intial MVP for the Plan Builder and Program Planner)
) {
  const departmentCode = params.department;
=======
export async function GET(request: Request, context: any) {
  const departmentCode = context.params.department;
>>>>>>> e3bf9f3 (chore: Rebase broke a coouple of GET endpoints along with leaving some merge headers)

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
