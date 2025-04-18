// app/api/courses/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/data';
import { z } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { ipAddress } from '@vercel/edge';

// Set up Redis + rate limiter
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
});

// Validate `q` param
const SearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query cannot be empty.'),
});

export async function GET(request: NextRequest) {
  // rate‑limit by IP
  const ip = ipAddress(request) || '127.0.0.1';
  const { success } = await ratelimit.limit(ip);
  if (!success) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  // parse + validate
  const q = request.nextUrl.searchParams.get('q') ?? '';
  const parse = SearchQuerySchema.safeParse({ q });
  if (!parse.success) {
    return NextResponse.json(
      { error: 'Missing or invalid "q" parameter.' },
      { status: 400 }
    );
  }

  const term = parse.data.q.trim().toUpperCase();
  try {
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          { courseCode: { contains: term, mode: 'insensitive' } },
          { title: { contains: term, mode: 'insensitive' } },
        ],
      },
      select: { id: true, department: true, courseCode: true, title: true },
      take: 10,
      orderBy: [{ courseCode: 'asc' }],
    });
    return NextResponse.json(courses);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
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