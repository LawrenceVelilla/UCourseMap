import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/data'; // Assuming prisma client is exported from here
import { z } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { ipAddress } from '@vercel/edge';

// Initialize Redis client
// Ensure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are in your .env
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Initialize Rate Limiter
// Allow 10 requests from the same IP in a 10-second window
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true, // Enable analytics for monitoring
  prefix: '@upstash/ratelimit', // Optional prefix for Redis keys
});

// Define a schema for the query parameter for validation
const SearchQuerySchema = z.object({
  q: z.string().min(1, "Search query cannot be empty."), // Require at least 1 character
});

export async function GET(request: NextRequest) {
  // Rate Limiting Check
  const ip = ipAddress(request) || '127.0.0.1'; // Get client IP address
  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    // Limit exceeded
    console.warn(`[API Search] Rate limit exceeded for IP: ${ip}`);
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
    });
  }

  const { searchParams } = request.nextUrl;
  const queryParam = searchParams.get('q');

  // Validate the query parameter
  const validation = SearchQuerySchema.safeParse({ q: queryParam });

  if (!validation.success || !queryParam) {
    return NextResponse.json(
      { error: 'Missing or invalid search query parameter "q".', details: validation.error?.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const searchTerm = validation.data.q.trim().toUpperCase(); // Normalize search term
  const searchResultLimit = 10; // Limit the number of results (Renamed from 'limit')

  if (process.env.NODE_ENV === 'development') {
    console.log(`[API Search] Searching for: "${searchTerm}"`);
  }

  try {
    const courses = await prisma.course.findMany({
      where: {
        OR: [
          // Case-insensitive search using Prisma's `mode: 'insensitive'` (for PostgreSQL)
          // Adjust if using a different DB that doesn't support insensitive mode directly
          {
            courseCode: {
              contains: searchTerm,
              mode: 'insensitive', // Use 'insensitive' for case-insensitive search
            },
          },
          {
            title: {
              contains: searchTerm,
              mode: 'insensitive',
            },
          },
          // Optionally add department search
          // {
          //   department: {
          //     contains: searchTerm,
          //     mode: 'insensitive',
          //   }
          // }
        ],
      },
      select: {
        id: true,
        department: true,
        courseCode: true,
        title: true,
      },
      take: searchResultLimit, // Limit the results (Use renamed variable)
      orderBy: [ // Prioritize matches starting with the term
        // The following _relevance block might require enabling the 'fullTextSearch'
        // preview feature in your schema.prisma, especially if not using PostgreSQL.
        // If it causes errors, you might need to remove it or configure full-text indexing.
        // {
        //    _relevance: {
        //      fields: ['courseCode', 'title'],
        //      search: searchTerm, // Adjust based on DB full-text search needs
        //      sort: 'desc'
        //    }
        // },
        { courseCode: 'asc' }, // Fallback sort order
      ]
    });

    if (process.env.NODE_ENV === 'development') {
        console.log(`[API Search] Found ${courses.length} results for "${searchTerm}"`);
    }

    return NextResponse.json(courses);

  } catch (error) {
    console.error(`[API Search] Error searching for "${searchTerm}":`, error);
    return NextResponse.json(
      { error: 'An error occurred while searching for courses.' },
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