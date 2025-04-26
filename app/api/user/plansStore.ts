import { CourseStatus } from "@/lib/types"; // Adjust the import path as necessary

// IMPORTANT: In-memory store for demonstration ONLY.
// Replace with a database (e.g., Prisma + PostgreSQL) for persistence.
// This is a temporary solution and will reset on server restart
const userPlansStore: Record<string, Record<string, CourseStatus>> = {}; // { programName: { courseCode: CourseStatus } }

export default userPlansStore;
