'use client';

import Link from 'next/link';
import type { Course } from '@/lib/types';
import { Card, CardContent, CardDescription } from './ui/card';
interface CourseLinkListProps {
    courses: Array<Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>>;
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
                     code: course.courseCode.split(' ')[1] || '' // Extract code number after space
                 });
                 const href = `/?${searchParams.toString()}`;

                return (
                    <li key={course.id || course.courseCode}>
                         <Link href={href} className="text-sm rounded-md text-[#588157] transition-colors hover:bg-[#606c5d] hover:text-[#fefae0] duration-200">
                             {course.courseCode}: {course.title}
                         </Link>
                    </li>
                );
            })}
        </ul>

    );
}