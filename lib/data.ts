// lib/data.ts
import 'server-only';
import { createClient } from '@/utils/supabase/server'; 
import { Course } from './types';

interface CourseParams {
  department: string;
  courseCode: string;
}

export async function getCourseData({ department, courseCode }: CourseParams): Promise<Course | null> {
  // *** Add await here ***
  const supabase = await createClient(); // <-- AWAIT the promise resolution

  const formattedCourseCode = `${department.toUpperCase()} ${courseCode}`;
  console.log(`Fetching data server-side for: ${formattedCourseCode}`);

  try {
    // Now 'supabase' is the actual client instance, so .from() exists
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('department', department.toUpperCase())
      .eq('courseCode', formattedCourseCode)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`Course ${formattedCourseCode} not found in DB.`);
        return null;
      } else {
        console.error("Supabase error fetching course:", error.message);
        throw error;
      }
    }
    return data as Course;

  } catch (err) {
    console.error(`Error in getCourseData for ${formattedCourseCode}:`, err);
    return null;
  }
}