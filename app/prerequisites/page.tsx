// app/prerequisites/page.tsx
import { ArrowLeft, BookOpen, Check, HelpCircle, X } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sidebar } from "@/components/sidebar"; // Assuming this exists

// Import your data fetching function and types
import { getCourseAndPrerequisiteData } from '@/lib/data'; // Adjust path
import { Course, RequirementCondition } from '@/lib/types'; // Adjust path

// Import the new client/helper components
import { PrerequisiteCheckerForm } from '@/components/PrerequisiteCheckerForm';
import { RequirementConditionDisplay } from '@/components/requirementConditionDisplay';

interface PrerequisitesPageProps {
    searchParams?: { // searchParams are optional
        dept?: string;
        code?: string;
    };
}

// --- Main Server Component ---
export default async function PrerequisitesPage({ searchParams }: PrerequisitesPageProps) {
    const params = await searchParams; // Ensure we have the latest search params
    const dept = params?.dept;
    const code = params?.code;

    let courseData: Awaited<ReturnType<typeof getCourseAndPrerequisiteData>> | null = null;
    let fetchError: string | null = null;
    let notFoundError: boolean = false;

    // Fetch data ONLY if dept and code are present in URL
    if (dept && code) {
        console.log(`Fetching data for ${dept.toUpperCase()} ${code}...`);
        try {
            // Basic validation before hitting the DB
            if (!/^[a-z]+$/.test(dept) || !/^\d+[a-z]*$/.test(code)) {
                 throw new Error("Invalid department or code format in URL.");
            }
            courseData = await getCourseAndPrerequisiteData(dept, code);
            if (!courseData?.targetCourse) {
                console.log(`Course ${dept.toUpperCase()} ${code} not found.`);
                notFoundError = true;
            } else {
                 console.log(`Data received for ${courseData.targetCourse.courseCode}`);
            }
        } catch (error) {
            console.error(`Error fetching course data for ${dept} ${code}:`, error);
            fetchError = error instanceof Error ? error.message : "An unknown error occurred while fetching course data.";
        }
    }
    // Node graph data --> Need to pass this to graph component, still need to implement
    // Plan -- > Use a library like react-flow or d3.js to visualize the graph then GATE logic and color to display
     const nodeGraphData = courseData?.targetCourse ? {
        nodes: [
            { id: courseData.targetCourse.courseCode, label: `${courseData.targetCourse.courseCode}: ${courseData.targetCourse.title}`, type: 'target' },
            ...(courseData.prerequisiteCourses?.map(prereq => ({
                id: prereq.courseCode,
                label: `${prereq.courseCode}: ${prereq.title}`,
                type: 'prerequisite'
            })) ?? [])
        ],
        edges: courseData.prerequisiteCourses?.map(prereq => ({
            id: `edge-${courseData.targetCourse!.courseCode}-${prereq.courseCode}`,
            source: courseData.targetCourse!.courseCode,
            target: prereq.courseCode
        })) ?? []
    } : null;


    return (
        <div className="flex min-h-screen bg-[#f5f5f0]">
            {/* Sidebar */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            {/* Main Content */}
            <div className="flex-1">
                {/* Mobile Header */}
                <header className="md:hidden bg-[#606c5d] text-white p-4 flex items-center justify-between">
                    <h1 className="text-xl font-bold">UniPlanner</h1>
                    {/* Mobile Menu Button ---> In the future, make this toggelable*/}
                    <Button variant="ghost" size="icon" className="text-white">
                        <BookOpen size={20} />
                    </Button>
                </header>

                <div className="container mx-auto py-8 px-4">
                    <div className="flex items-center gap-2 mb-6">
                        <Link href="/">
                            <Button variant="ghost" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Dashboard
                            </Button>
                        </Link>
                    </div>

                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Left Column: Input and Results */}
                        <div className="md:w-2/3">
                            <h1 className="text-3xl font-bold mb-6">Prerequisite Checker</h1>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Check Course Requirements</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {/* Client Component for the form */}
                                    <PrerequisiteCheckerForm />

                                    {/* Display Area: Shows based on fetch results */}
                                    <div className="mt-6 space-y-4">
                                        {fetchError && (
                                            <Alert variant="destructive">
                                                <AlertTitle>Error</AlertTitle>
                                                <AlertDescription>{fetchError}</AlertDescription>
                                            </Alert>
                                        )}
                                        {notFoundError && (
                                             <Alert variant="default" className="bg-yellow-50 border-yellow-200">
                                                <AlertTitle>Course Not Found</AlertTitle>
                                                <AlertDescription>
                                                    The course {dept?.toUpperCase()} {code} could not be found in the database. Please check the code and try again.
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        {/* Display Course Details if found */}
                                        {courseData?.targetCourse && !fetchError && !notFoundError && (
                                            <div className="border rounded-md p-4 space-y-4">
                                                <h3 className="font-medium text-lg">
                                                    {courseData.targetCourse.courseCode} - {courseData.targetCourse.title}
                                                </h3>
                                                <p className="text-sm text-gray-600">
                                                    {courseData.targetCourse.parsedDescription || 'No description available.'}
                                                </p>
                                                 <p className="text-sm text-gray-500">
                                                    Credits: {courseData.targetCourse.units?.credits ?? 'N/A'} | Term: {courseData.targetCourse.units?.term ?? 'N/A'}
                                                </p>

                                                {/* Structured Prerequisites */}
                                                <div>
                                                    <h4 className="font-medium mb-2">Prerequisites:</h4>
                                                    {courseData.targetCourse.requirements?.prerequisites && (courseData.targetCourse.requirements.prerequisites.courses?.length || courseData.targetCourse.requirements.prerequisites.conditions?.length) ? (
                                                        <RequirementConditionDisplay condition={courseData.targetCourse.requirements.prerequisites} />
                                                    ) : (
                                                        <p className="text-sm text-gray-500">No specific prerequisites listed.</p>
                                                    )}
                                                </div>

                                                  {/* Structured Corequisites */}
                                                  <div>
                                                    <h4 className="font-medium mb-2">Corequisites:</h4>
                                                    {courseData.targetCourse.requirements?.corequisites && (courseData.targetCourse.requirements.corequisites.courses?.length || courseData.targetCourse.requirements.corequisites.conditions?.length) ? (
                                                        <RequirementConditionDisplay condition={courseData.targetCourse.requirements.corequisites} />
                                                    ) : (
                                                        <p className="text-sm text-gray-500">No specific corequisites listed.</p>
                                                    )}
                                                </div>

                        
                                                {/* Placeholder for 'Met Requirements' Logic */}
                                                {/* <div className="bg-red-50 p-3 rounded-md border border-red-200 mt-4">
                                                    <p className="text-red-700 text-sm">
                                                        You do not meet all the prerequisites for this course. (Logic not implemented yet)
                                                    </p>
                                                </div> */}
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Prerequisite Tree */}
                        <div className="md:w-1/3">
                            <Card className="mt-6 md:mt-[92px]"> {/* Adjust margin to roughly align with results card */}
                                <CardHeader>
                                    <CardTitle>Prerequisite Tree</CardTitle>
                                    <CardDescription>Visualize course dependencies</CardDescription>
                                </CardHeader>
                                <CardContent>
                                     {nodeGraphData ? (
                                        // Placeholder: You would pass nodeGraphData to an actual graph component here
                                        <div className="p-4 border rounded-md bg-[#f0f0e8] text-left text-xs overflow-auto max-h-[400px]">
                                            <p className="text-sm text-gray-600 mb-2 font-medium">Data for Visualization:</p>
                                            <pre><code>{JSON.stringify(nodeGraphData, null, 2)}</code></pre>
                                        </div>
                                    ) : (
                                        <div className="p-4 border rounded-md bg-[#f0f0e8] text-center">
                                            <p className="text-sm text-gray-500">
                                                {dept && code ? 'Loading tree or no data...' : 'Check a course to view its prerequisite tree'}
                                            </p>
                                        </div>
                                     )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper function (can be moved to lib/utils.ts)
function parseCourseCodeForLink(input: string): { dept: string; code: string } | null {
    const trimmedInput = input.trim().toUpperCase();
    const match = trimmedInput.match(/^([A-Z]+)\s*(\d+[A-Z]*)$/);
    if (match && match[1] && match[2]) {
        return { dept: match[1], code: match[2] };
    }
    return null;
}