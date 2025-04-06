// app/courses/[department]/[courseCode]/page.tsx (Example Snippet)
import { notFound } from 'next/navigation';
import { getCourseDetails } from '@/lib/data'; // Direct import
import PrerequisiteList from '@/components/prerequisiteList';
// ... other imports

interface PageParams {
  department: string;
  courseCode: string; // The number part from URL segment
}

export default async function CourseDetailPage({ params }: { params: PageParams }) {
  // Fetch data directly using the server-side function
  const course = await getCourseDetails(params.department, params.courseCode);

  if (!course) {
    notFound(); // Trigger 404 page
  }

  return (
    <div>
      {/* ... render title, code, units ... */}

      {/* Pass requirements object directly */}
      <PrerequisiteList requirements={course.requirements} currentDept={course.department}/>

      {/* Pass description path (if using storage for desc) */}
      {/* <DescriptionDisplay storagePath={course.descriptionStoragePath} /> */}

      {/* OR Display description directly if stored in DB */}
       {course.parsedDescription && (
         <section>
            <h2 className="text-2xl font-semibold mb-2">Description</h2>
            <p className="whitespace-pre-wrap">{course.parsedDescription}</p>
         </section>
       )}

      {/* ... other sections ... */}
    </div>
  );
}