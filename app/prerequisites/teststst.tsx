import { ArrowLeft, BookOpen, Check, HelpCircle, X } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/footer"; // Assuming this exists and is styled appropriately internally
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sidebar } from "@/components/sidebar"; // Assuming this exists

// Import your data fetching function and types
import { getCourseAndPrerequisiteData } from '@/lib/data'; // Adjust path if needed
import { Course, RequirementCondition } from '@/lib/types'; // Adjust path if needed

// Import the new client/helper components
import { PrerequisiteCheckerForm } from '@/components/PrerequisiteCheckerForm';
// Corrected import name casing
import { RequirementConditionDisplay } from '@/components/requirementConditionDisplay'; // Adjust path if needed

interface PrerequisitesPageProps {
    searchParams?: { // searchParams are optional
        dept?: string;
        code?: string;
    };
}

// --- Main Server Component ---
export default async function PrerequisitesPage({ searchParams }: PrerequisitesPageProps) {
    // Use searchParams directly
    const dept = searchParams?.dept;
    const code = searchParams?.code;

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

     // Prepare data structure for potential node graph component
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

    // --- Start of Return Statement ---
    return (
        // 1. Outermost container: Vertical flex, takes full screen height
        <div className="flex flex-col min-h-screen">

            {/* 2. Container for Sidebar + Main Content Area */}
            {/*    Horizontal flex, grows to fill space above footer */}
            <div className="flex flex-1">

                {/* Sidebar */}
                {/* Apply background color here if needed */}
                <div className="hidden md:block bg-[#f5f5f0]">
                    <Sidebar />
                </div>

                {/* Main Content Area Column */}
                {/* Grows horizontally, provides background */}
                <div className="flex-1 bg-[#f5f5f0] flex flex-col"> {/* Make this flex-col too */}

                    {/* Mobile Header */}
                    {/* Sticky header needs a container that scrolls */}
                    <header className="md:hidden bg-[#606c5d] text-white p-4 flex items-center justify-between sticky top-0 z-10">
                        <h1 className="text-xl font-bold">UniPlanner</h1>
                        <Button variant="ghost" size="icon" className="text-white">
                            <BookOpen size={20} />
                        </Button>
                    </header>

                    {/* Main scrollable content area */}
                    {/* Use <main> tag, give it flex-1 to grow and overflow-y-auto for scrolling */}
                    <main className="flex-1 overflow-y-auto container mx-auto py-8 px-4">
                        {/* Back Button */}
                        <div className="flex items-center gap-2 mb-6">
                            <Link href="/">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Dashboard
                                </Button>
                            </Link>
                        </div>

                        {/* Two-Column Layout for Content */}
                        <div className="flex flex-col md:flex-row gap-6">

                            {/* Left Column: Input and Results */}
                            <div className="md:w-2/3">
                                <h1 className="text-3xl font-bold mb-6">Prerequisite Checker</h1>
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Check Course Requirements</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Form Component */}
                                        <PrerequisiteCheckerForm />

                                        {/* Display Area */}
                                        <div className="mt-6 space-y-4">
                                            {/* Error Alerts */}
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

                                            {/* Course Details Display */}
                                            {courseData?.targetCourse && !fetchError && !notFoundError && (
                                                <div className="border rounded-md p-4 space-y-4">
                                                    {/* Title, Desc, Units */}
                                                    <h3 className="font-medium text-lg">
                                                        {courseData.targetCourse.courseCode} - {courseData.targetCourse.title}
                                                    </h3>
                                                    <p className="text-sm text-gray-600">
                                                        {courseData.targetCourse.parsedDescription || 'No description available.'}
                                                    </p>
                                                     <p className="text-sm text-gray-500">
                                                        Credits: {courseData.targetCourse.units?.credits ?? 'N/A'} | Term: {courseData.targetCourse.units?.term ?? 'N/A'}
                                                    </p>

                                                    {/* Prerequisites */}
                                                    <div>
                                                        <h4 className="font-medium mb-2">Prerequisites:</h4>
                                                        {(courseData.targetCourse.requirements?.prerequisites?.courses?.length || courseData.targetCourse.requirements?.prerequisites?.conditions?.length) ? (
                                                            <RequirementConditionDisplay condition={courseData.targetCourse.requirements.prerequisites} />
                                                        ) : (
                                                            <p className="text-sm text-gray-500">No specific prerequisites listed.</p>
                                                        )}
                                                    </div>

                                                    {/* Corequisites */}
                                                    <div>
                                                        <h4 className="font-medium mb-2">Corequisites:</h4>
                                                        {(courseData.targetCourse.requirements?.corequisites?.courses?.length || courseData.targetCourse.requirements?.corequisites?.conditions?.length) ? (
                                                            <RequirementConditionDisplay condition={courseData.targetCourse.requirements.corequisites} />
                                                        ) : (
                                                            <p className="text-sm text-gray-500">No specific corequisites listed.</p>
                                                        )}
                                                    </div>
                                                    {/* Placeholder for Met Requirements Logic */}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div> {/* End Left Column */}

                            {/* Right Column: Prerequisite Tree */}
                            <div className="md:w-1/3">
                                <Card className="mt-6 md:mt-[92px]"> {/* Adjust alignment */}
                                    <CardHeader>
                                        <CardTitle>Prerequisite Tree</CardTitle>
                                        <CardDescription>Visualize course dependencies</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                         {/* Node Graph Placeholder */}
                                         {nodeGraphData ? (
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
                            </div> {/* End Right Column */}

                        </div> {/* End Two-Column Layout */}
                    </main> {/* End Main scrollable content area */}

                </div> {/* End Main Content Area Column */}
            </div> {/* End Sidebar + Main Content container */}

            {/* 3. Footer */}
            {/* Direct child of the outermost flex-col div */}
            <Footer className="bg-[#f0f0e8] py-6 px-6 border-t text-center w-full" /> {/* Use w-full */}

        </div> // End Outermost container
    );
    // --- End of Return Statement ---
}