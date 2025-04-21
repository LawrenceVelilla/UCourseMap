"use client";

import Link from "next/link";

import type { Course } from "@/lib/types";

interface CourseLinkListProps {
  courses: Array<Pick<Course, "id" | "department" | "courseCode" | "title">>;
  emptyMessage?: string;
}

export function CourseLinkList({ courses, emptyMessage = "None found." }: CourseLinkListProps) {
  if (!courses || courses.length === 0) {
    return <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>;
  }

  return (
    <ul className="space-y-1 list-disc list-inside">
      {courses.map((course) => {
        const searchParams = new URLSearchParams({
          dept: course.department.toLowerCase(),
          code: course.courseCode.split(" ")[1] || "", // Extract code number after space
        });
        const href = `/?${searchParams.toString()}`;

        return (
          <li key={course.id || course.courseCode}>
            <span className="group pl-2 pr-2 rounded-md transition-colors duration-200 hover:bg-[#606c5d]">
              <Link href={href} className="text-[#588157] group-hover:text-white">
                {course.courseCode}: {course.title}
              </Link>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
