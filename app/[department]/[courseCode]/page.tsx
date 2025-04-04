// app/courses/[department]/[courseCode]/page.tsx (Create folders and file)
import { notFound } from 'next/navigation';
import { getCourseData } from '@/lib/data'; // Use your data fetching function
import PrerequisiteList from '@/components/prerequisiteList'; // Import the display component
import { Metadata } from 'next'; // For dynamic metadata

// Define Params type for the page component
interface PageParams {
  department: string;
  courseCode: string;
}

// --- Generate Metadata Dynamically ---
export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  // Fetch limited data just for title, or reuse getCourseData if efficient enough
  const course = await getCourseData(params); // Fetch full data
  return {
    title: course ? `${course.courseCode} - ${course.title} | UniPlanner` : 'Course Not Found | UniPlanner',
    description: course ? `Prerequisites and details for ${course.courseCode} - ${course.title}` : 'Course details page',
  };
}

// --- The Page Component (Server Component) ---
export default async function CourseDetailPage({ params }: { params: PageParams }) {
  const course = await getCourseData(params);

  // If course data fetch failed or course is null (not found)
  if (!course) {
    notFound(); // Triggers Next.js 404 page
  }

  // Use Tailwind classes provided by the template's setup
  return (
    <div className="flex-1 w-full flex flex-col gap-10 items-center px-4"> {/* Center content */}
        <div className="w-full max-w-4xl flex flex-col gap-6 py-8 lg:py-12"> {/* Max width container */}

            {/* Header Section */}
            <div className="border-b pb-4 mb-4">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                    {course.title}
                </h1>
                <p className="text-xl text-muted-foreground">
                    {course.courseCode} ({course.department})
                </p>
                {/* Display Units Nicely */}
                {course.units && (
                    <p className="text-sm text-muted-foreground mt-1">
                        Credits: {course.units.credits ?? 'N/A'} | Term: {course.units.term ?? 'N/A'}
                    </p>
                )}
            </div>

            {/* Description Section */}
            <section>
                <h2 className="text-2xl font-semibold mb-2">Description</h2>
                <p className="text-foreground/80 leading-relaxed"> {/* Slightly lighter text */}
                    {course.parsedDescription || course.rawDescription || 'No description available.'}
                </p>
            </section>

            {/* Requirements Section */}
            <section>
                <h2 className="text-2xl font-semibold mb-2">Requirements</h2>

                {/* Prerequisites */}
                <h3 className="text-xl font-medium mb-1">Prerequisites:</h3>
                {course.requirements?.prerequisites ? (
                    <ul className="list-none pl-0"> {/* Reset list style type */}
                        <PrerequisiteList
                            condition={course.requirements.prerequisites}
                            currentDept={course.department} // Pass department for link generation
                        />
                    </ul>
                ) : (
                    <p className="text-muted-foreground">None</p>
                )}

                {/* Corequisites (Add later if needed) */}
                 <h3 className="text-xl font-medium mt-4 mb-1">Corequisites:</h3>
                 {course.requirements?.corequisites ? (
                     <ul className="list-none pl-0">
                         <PrerequisiteList
                            condition={course.requirements.corequisites}
                            currentDept={course.department}
                          />
                     </ul>
                 ) : (
                     <p className="text-muted-foreground">None</p>
                 )}

                {/* Notes */}
                {course.requirements?.notes && (
                    <>
                        <h3 className="text-xl font-medium mt-4 mb-1">Notes:</h3>
                        <p className="text-foreground/80 italic">
                            {course.requirements.notes}
                        </p>
                    </>
                )}
            </section>

            {/* Graph View Placeholder */}
             <section>
                <h2 className="text-2xl font-semibold mb-2">Dependency Graph (Future)</h2>
                <div className="border border-dashed border-gray-400 rounded-md p-6 min-h-[200px] flex items-center justify-center text-muted-foreground">
                    Node Graph Visualization will go here.
                </div>
            </section>


             {/* Debug Raw Data (Optional) */}
            {/* <details className="mt-6">
                <summary className="cursor-pointer font-medium">Show Raw Requirements Data</summary>
                <pre className="mt-2 p-4 bg-secondary rounded-md overflow-x-auto text-sm">
                    {JSON.stringify(course.requirements, null, 2)}
                </pre>
            </details> */}
        </div>
    </div>
  );
}