import { NextResponse } from "next/server";
import { ERROR_MESSAGES, HTTP_STATUS } from "./constants";

/**
 * Standardized API error handling utility
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  console.error(`[API] Error in ${context}:`, error);

  const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";

  return NextResponse.json(
    {
      message: `Failed to ${context}`,
      error: errorMessage,
    },
    { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
  );
}

/**
 * Standardized API validation for department and course code parameters
 */
export function validateDepartmentAndCode(
  department?: string,
  courseCode?: string,
): NextResponse | null {
  if (!department && !courseCode) {
    return NextResponse.json(
      {
        message: `${ERROR_MESSAGES.DEPARTMENT_REQUIRED} and ${ERROR_MESSAGES.COURSE_CODE_REQUIRED}`,
      },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  if (!department) {
    return NextResponse.json(
      { message: ERROR_MESSAGES.DEPARTMENT_REQUIRED },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  if (!courseCode) {
    return NextResponse.json(
      { message: ERROR_MESSAGES.COURSE_CODE_REQUIRED },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  return null; // Validation passed
}

/**
 * Standardized API validation for department parameter only
 */
export function validateDepartment(department?: string): NextResponse | null {
  if (!department) {
    return NextResponse.json(
      { message: ERROR_MESSAGES.DEPARTMENT_REQUIRED },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  return null; // Validation passed
}

/**
 * Standardized success response helper
 */
export function createSuccessResponse<T>(data: T, status: number = HTTP_STATUS.OK): NextResponse {
  return NextResponse.json(data, { status });
}

/**
 * Standardized error response helper
 */
export function createErrorResponse(
  message: string,
  status: number = HTTP_STATUS.BAD_REQUEST,
  error?: string,
): NextResponse {
  const response: { message: string; error?: string } = { message };

  if (error) {
    response.error = error;
  }

  return NextResponse.json(response, { status });
}
