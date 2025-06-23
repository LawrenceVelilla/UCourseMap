import { getCourseDetails } from "@/lib/data";
import {
  handleApiError,
  validateDepartmentAndCode,
  createSuccessResponse,
  createErrorResponse,
} from "@/lib/apiUtils";
import { ERROR_MESSAGES, HTTP_STATUS } from "@/lib/constants";

interface Params {
  department: string;
  courseCode: string;
}

export async function GET(request: Request, context: any) {
  const departmentCode = context.params.department;
  const courseCodeNumber = context.params.courseCode;

  const validationError = validateDepartmentAndCode(departmentCode, courseCodeNumber);
  if (validationError) {
    return validationError;
  }

  try {
    // Call the data fetching function
    const course = await getCourseDetails(departmentCode, courseCodeNumber);

    if (!course) {
      // Data function returned null, meaning not found
      return createErrorResponse(
        `Course ${departmentCode.toUpperCase()} ${courseCodeNumber} not found`,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    return createSuccessResponse(course);
  } catch (error) {
    return handleApiError(error, `fetch course ${departmentCode} ${courseCodeNumber}`);
  }
}
