import { getCoursesByDepartment } from "@/lib/data";
import { handleApiError, validateDepartment, createSuccessResponse } from "@/lib/apiUtils";

export async function GET(request: Request, context: any) {
  const departmentCode = context.params.department;

  const validationError = validateDepartment(departmentCode);
  if (validationError) {
    return validationError;
  }

  try {
    // Call the data fetching function
    const courses = await getCoursesByDepartment(departmentCode);

    return createSuccessResponse(courses);
  } catch (error) {
    return handleApiError(error, `fetch courses for ${departmentCode}`);
  }
}
