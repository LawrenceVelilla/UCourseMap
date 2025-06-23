import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/data";
import { z } from "zod";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { ipAddress } from "@vercel/edge";
import { Prisma } from "@prisma/client";
import { COURSE_SELECTORS, ERROR_MESSAGES, HTTP_STATUS } from "@/lib/constants";
import { parseSearchInput } from "@/lib/courseUtils";

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
    return new NextResponse(ERROR_MESSAGES.TOO_MANY_REQUESTS, {
      status: HTTP_STATUS.TOO_MANY_REQUESTS,
    });
  }

  // parse + validate
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const mode = request.nextUrl.searchParams.get("mode") ?? "code";

  // Validate using schema (handles both q and mode)
  const parse = SearchQuerySchema.safeParse({ q, mode });
  if (!parse.success) {
    const errorMessage = parse.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");
    return NextResponse.json(
      { error: `Invalid query parameters: ${errorMessage}` },
      { status: HTTP_STATUS.BAD_REQUEST },
    );
  }

  const term = parse.data.q.trim().toUpperCase();
  const searchMode = parse.data.mode;

  try {
    let whereClause: Prisma.CourseWhereInput;
    if (searchMode === "title") {
      whereClause = {
        title: { contains: term, mode: "insensitive" },
      };
    } else {
      // Default to 'code' search
      // Attempt to parse for specific code search, fallback to broader search
      const searchInfo = parseSearchInput(term);
      if (searchInfo.isSpecificSearch && searchInfo.department && searchInfo.courseCode) {
        // Specific course code search
        whereClause = {
          AND: [
            { department: { startsWith: searchInfo.department, mode: "insensitive" } },
            { courseCode: { contains: searchInfo.courseCode, mode: "insensitive" } },
          ],
        };
      } else {
        // General search for course code or department
        whereClause = {
          OR: [
            { courseCode: { contains: term, mode: "insensitive" } },
            { department: { contains: term, mode: "insensitive" } },
          ],
        };
      }
    }

    const courses = await prisma.course.findMany({
      where: whereClause, // Use the dynamically built clause
      select: COURSE_SELECTORS.BASIC,
      take: 10,
      orderBy: [{ courseCode: "asc" }],
    });
    return NextResponse.json(courses);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR },
    );
  }
}
