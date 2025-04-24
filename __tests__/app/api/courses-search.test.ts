import { NextRequest } from "next/server";
import { GET } from "@/app/api/courses/search/route";

// Mock dependencies
jest.mock("next/server", () => ({
  NextRequest: jest.fn(),
  NextResponse: {
    json: jest.fn((data, options) => ({ data, options })),
    error: jest.fn(),
  },
}));

// Mock Redis
jest.mock("@upstash/redis", () => ({
  Redis: jest.fn().mockImplementation(() => ({
    // Mock Redis methods as needed
  })),
}));

// Mock Ratelimit properly with static method
jest.mock("@upstash/ratelimit", () => {
  const slidingWindowMock = jest.fn().mockReturnValue({});

  function RatelimitMock() {
    return {
      limit: jest.fn().mockResolvedValue({ success: true }),
    };
  }

  // Add static method to the constructor function
  RatelimitMock.slidingWindow = slidingWindowMock;

  return {
    Ratelimit: RatelimitMock,
  };
});

jest.mock("@vercel/edge", () => ({
  ipAddress: jest.fn().mockReturnValue("127.0.0.1"),
}));

jest.mock("@/lib/data", () => ({
  prisma: {
    course: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  },
}));

// Import actual prisma client after mocking
import { prisma } from "@/lib/data";

describe("Courses Search API Route", () => {
  let mockRequest: jest.Mocked<NextRequest>;
  let mockSearchParams: Map<string, string>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock search params
    mockSearchParams = new Map();

    // Setup NextRequest mock
    const mockGetFn = jest.fn() as jest.MockedFunction<(name: string) => string | null>;
    mockGetFn.mockImplementation((key) => mockSearchParams.get(key) || null);

    mockRequest = {
      nextUrl: {
        searchParams: {
          get: mockGetFn,
        },
      },
    } as unknown as jest.Mocked<NextRequest>;
  });

  test("returns 400 status for empty query", async () => {
    mockSearchParams.set("q", "");
    // Update the mock implementation for this test
    (mockRequest.nextUrl.searchParams.get as jest.Mock).mockImplementation(
      (key) => mockSearchParams.get(key) || null,
    );

    await GET(mockRequest);

    const NextResponse = require("next/server").NextResponse;
    expect(NextResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining("Invalid query parameters"),
      }),
      expect.objectContaining({ status: 400 }),
    );
  });

  test("searches by code when mode is code", async () => {
    mockSearchParams.set("q", "CMPUT 272");
    mockSearchParams.set("mode", "code");
    const mockGetFn = jest.fn() as jest.MockedFunction<(name: string) => string | null>;
    mockGetFn.mockImplementation((key) => mockSearchParams.get(key) || null);

    mockRequest = {
      nextUrl: {
        searchParams: {
          get: mockGetFn,
        },
      },
    } as unknown as jest.Mocked<NextRequest>;
    // Mock the database response
    (prisma.course.findMany as jest.Mock).mockResolvedValue([
      {
        id: "1",
        department: "CMPUT",
        courseCode: "272",
        title: "Formal Systems and Logic",
      },
    ]);

    await GET(mockRequest);

    // Verify prisma was called with appropriate filters
    expect(prisma.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            { department: expect.objectContaining({ startsWith: "CMPUT" }) },
            { courseCode: expect.objectContaining({ contains: "272" }) },
          ]),
        }),
        take: 10,
      }),
    );

    // Verify response was correctly formatted
    const NextResponse = require("next/server").NextResponse;
    expect(NextResponse.json).toHaveBeenCalledWith([
      {
        id: "1",
        department: "CMPUT",
        courseCode: "272",
        title: "Formal Systems and Logic",
      },
    ]);
  });

  test("searches by title when mode is title", async () => {
    mockSearchParams.set("q", "logic");
    mockSearchParams.set("mode", "title");
    const mockGetFn = jest.fn() as jest.MockedFunction<(name: string) => string | null>;
    mockGetFn.mockImplementation((key) => mockSearchParams.get(key) || null);

    mockRequest = {
      nextUrl: {
        searchParams: {
          get: mockGetFn,
        },
      },
    } as unknown as jest.Mocked<NextRequest>;

    // Mock the database response
    (prisma.course.findMany as jest.Mock).mockResolvedValue([
      {
        id: "1",
        department: "CMPUT",
        courseCode: "272",
        title: "Formal Systems and Logic",
      },
    ]);

    await GET(mockRequest);

    // Verify prisma was called with appropriate filters
    expect(prisma.course.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          title: expect.objectContaining({
            contains: expect.any(String),
            mode: "insensitive",
          }),
        }),
        take: 10,
      }),
    );
  });
});
