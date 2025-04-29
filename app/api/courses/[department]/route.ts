import { NextResponse } from "next/server";
import { getCoursesByDepartment } from "@/lib/data"; // Adjust path if needed

interface Params {
  department: string;
}

export async function GET(request: Request, context: any) {
  const departmentCode = context.params.department;

  if (!departmentCode) {
    return NextResponse.json({ message: "Department code is required" }, { status: 400 });
  }

  try {
    // Call the data fetching function
    const courses = await getCoursesByDepartment(departmentCode);

    return NextResponse.json(courses);
  } catch (error) {
    // This catch is for unexpected errors during the process
    console.error(`API Error fetching courses for ${departmentCode}:`, error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
