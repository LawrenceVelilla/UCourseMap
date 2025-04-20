// app/api/courses/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/data";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { ipAddress } from "@vercel/edge";
import { Prisma } from "@prisma/client";

// Set up Redis + rate limiter
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  analytics: true,
});

// Validate query params
const SearchQuerySchema = z.object({
  q: z.string().min(1, "Search query cannot be empty."),
  mode: z.enum(["code", "title"]).optional().default("code"),
});

export async function GET(request: NextRequest) {
  // rate‑limit by IP
  const ip = ipAddress(request) || "127.0.0.1";
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  // parse + validate
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const mode = request.nextUrl.searchParams.get("mode") ?? "code";

  // Validate using schema (handles both q and mode)
  const parse = SearchQuerySchema.safeParse({ q, mode });
  if (!parse.success) {
    // Combine Zod errors into a readable message
    const errorMessage = parse.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");
    return NextResponse.json(
      { error: `Invalid query parameters: ${errorMessage}` },
      { status: 400 }
    );
  }

  const term = parse.data.q.trim().toUpperCase();
  const searchMode = parse.data.mode;

  try {
    // Build the WHERE clause dynamically based on search mode
    let whereClause: Prisma.CourseWhereInput;
    if (searchMode === "title") {
      whereClause = {
        title: { contains: term, mode: "insensitive" },
      };
    } else {
      // Default to 'code' search
      // Attempt to parse for specific code search, fallback to broader search
      const codeParts = term.match(/^([A-Z]+)[\s]*(\d+[A-Z]*)$/);
      if (codeParts && codeParts[1] && codeParts[2]) {
        // More specific search if format matches DEPT NUM
        whereClause = {
          AND: [
            { department: { startsWith: codeParts[1], mode: "insensitive" } },
            { courseCode: { contains: codeParts[2], mode: "insensitive" } }, // Contains allows for suffixes like 101A
          ],
        };
      } else {
        // Broader search across code and department if format is ambiguous
        whereClause = {
          OR: [
            { courseCode: { contains: term, mode: "insensitive" } },
            { department: { contains: term, mode: "insensitive" } }, // Include department search for terms like 'CMPUT'
          ],
        };
      }
    }

    const courses = await prisma.course.findMany({
      where: whereClause, // Use the dynamically built clause
      select: { id: true, department: true, courseCode: true, title: true },
      take: 10,
      orderBy: [{ courseCode: "asc" }],
    });
    return NextResponse.json(courses);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

// Optional: Define CORS headers if your frontend is on a different domain/port during development
// export async function OPTIONS(request: NextRequest) {
//   return new Response(null, {
//     status: 204,
//     headers: {
//       'Access-Control-Allow-Origin': '*', // Adjust for production
//       'Access-Control-Allow-Methods': 'GET, OPTIONS',
//       'Access-Control-Allow-Headers': 'Content-Type, Authorization',
//     },
//   });
// }
