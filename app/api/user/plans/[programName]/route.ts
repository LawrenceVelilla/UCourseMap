import { NextResponse } from "next/server";

// IMPORTANT: In-memory store for demonstration ONLY.
// Needs access to the SAME store as the POST route.
// In a real app with a DB, this wouldn't be an issue.
// A better approach for in-memory might be a singleton service.
// We'll simulate shared access for now.

// HACK: Accessing the store defined in the other route file.
// This relies on Node module caching to share the instance. Bad practice!
// Replace with DB or proper singleton service.
import { userPlansStore as userPlans } from "../route";

export function GET(request: Request, context: any) {
  try {
    // Decode the program name from the URL parameter
    const programName = decodeURIComponent(context?.params?.programName);

    if (!programName) {
      return NextResponse.json({ message: "Program name parameter is required." }, { status: 400 });
    }

    // Access the (hopefully) shared store
    const plan = userPlans[programName];

    if (!plan) {
      // If no plan exists, return an empty object instead of 404,
      // so the client can handle it gracefully (e.g., start a new plan).
      console.log(`No plan found for program: ${programName}. Returning empty plan.`);
      return NextResponse.json({}, { status: 200 });
      // Or return 404 if that's preferred:
      // return NextResponse.json({ message: `No plan found for program: ${programName}` }, { status: 404 });
    }

    // In a real app, fetch from a database:
    // const planRecord = await prisma.userPlan.findUnique({
    //   where: { userId_programName: { userId: 'currentUser', programName: programName } },
    // });
    // if (!planRecord) {
    //    return NextResponse.json({}, { status: 200 }); // Return empty object if not found
    // }
    // const plan = planRecord.planData; // Assuming planData is the stored JSON

    console.log(`Loading plan for program: ${programName}`);
    return NextResponse.json(plan, { status: 200 });
  } catch (error) {
    console.error("Error loading user plan:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { message: "Failed to load user plan", error: errorMessage },
      { status: 500 },
    );
  }
}
