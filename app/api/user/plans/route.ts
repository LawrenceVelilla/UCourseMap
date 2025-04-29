import { NextResponse } from "next/server";
import { CourseStatus } from "../../../../lib/types";
import userPlansStore from "../plansStore";

interface SavePlanRequestBody {
  programName: string;
  // Client sends selectedCourses Map converted to an object
  selectedCourses: Record<string, CourseStatus>;
}

export async function POST(request: Request) {
  try {
    const body: SavePlanRequestBody = await request.json();
    const { programName, selectedCourses } = body;

    if (
      !programName ||
      typeof programName !== "string" ||
      !selectedCourses ||
      typeof selectedCourses !== "object"
    ) {
      return NextResponse.json(
        { message: "Invalid request body. Missing or invalid programName or selectedCourses." },
        { status: 400 },
      );
    }

    console.log(`Saving plan for program: ${programName}`);

    userPlansStore[programName] = selectedCourses;

    // Use prisma database for actual implementation
    // await prisma.userPlan.upsert({
    //   where: { userId_programName: { userId: 'currentUser', programName: programName } }, // Assuming user auth
    //   update: { planData: selectedCourses },
    //   create: { userId: 'currentUser', programName: programName, planData: selectedCourses },
    // });

    return NextResponse.json(
      { message: `Plan for ${programName} saved successfully.` },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error saving user plan:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { message: "Failed to save user plan", error: errorMessage },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Current in-memory plans (for debugging)",
    plans: Object.keys(userPlansStore),
  });
}
