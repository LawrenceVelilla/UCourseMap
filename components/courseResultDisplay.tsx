/*
This component is responsible for displaying the course result details.
It fetches the course data and prerequisite information,
handles errors, and prepares data for rendering.
It is designed to be used within a larger application context,
specifically for displaying course prerequisites and related information.
It includes error handling for various scenarios, including
network errors, course not found, and inconsistent data states.
It also prepares the data for rendering in a graph format,
allowing for a visual representation of course prerequisites.
It uses Anime.js for animations and includes a responsive design
to ensure a good user experience across devices.
It also includes placeholder cards for future features
and additional information.
*/

// TODO ADD CARD 2



'use client'; 

import React, { useEffect, useRef, useState } from 'react';
import { animate, stagger } from 'animejs'; 
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RequirementConditionDisplay } from '@/components/requirementConditionDisplay'; 
import PrerequisiteGraphWrapper, { InputNode, AppEdge } from '@/components/prerequisiteGraph'; 
import { CourseLinkList } from './courseLinkList'; 
import { Course } from "@/lib/types"; 
import Link from 'next/link';
import { ExternalLink, AlertCircle } from "lucide-react"; 
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; 
import { ExpandableCardContent } from './expandableCardContent';

interface CourseResultDisplayProps {
    targetCourse: Course;
    graphNodes: InputNode[];
    graphEdges: AppEdge[];
    // TODO: Add props for requiredByCourses / corequisiteForCourses later when implemented
    requiredByCourses?: Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>[];
    corequisiteForCourses?: Pick<Course, 'id' | 'department' | 'courseCode' | 'title'>[];
}

const app_url = "https://apps.ualberta.ca"

export function CourseResultDisplay({
    targetCourse,
    graphNodes,
    graphEdges,
    requiredByCourses,
    corequisiteForCourses
}: CourseResultDisplayProps) {

    const bentoContainerRef = useRef<HTMLDivElement>(null); // Ref for the grid container
   
    // Effect for animating cards on load/change --> Anime js
    useEffect(() => {
        if (targetCourse && bentoContainerRef.current) {
            // Ensure animation targets exist before animating
            const cards = bentoContainerRef.current.querySelectorAll('.bento-card');
            if (cards.length > 0) {
                 animate(
                    cards, 
                    { 
                        opacity: [0, 1],
                        translateY: [20, 0],
                        delay: stagger(100),
                        duration: 500,
                        easing: 'easeOutQuad'
                    }
                 );
            }
            // Todo: Add graph animations here
        }
        // Rerun animation if the target course changes
    }, [targetCourse]);

    if (!targetCourse) {
        return (
             <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Rendering Error</AlertTitle>
                <AlertDescription>Course data is missing. Cannot display results.</AlertDescription>
            </Alert>
        );
    }

    return (
        // Bento Grid Container 
        // 3 columns on medium screens and up, 1 column on small screens
        <div ref={bentoContainerRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Details/Keywords/Requirements Card */}
            <Card className="
            bento-card md:col-span-2 shadow-md border border-gray-200
            dark:border-neutral-800  dark:bg-transparent dark:frosted
            "
            > {/* Spans 2 columns */}
                 <CardHeader>
                     {/* Course Code and Title */}
                     <CardTitle className="text-3xl">{targetCourse.courseCode}: {targetCourse.title}</CardTitle>
                     {/* Units */}
                     {targetCourse.units && (
                         <CardDescription className="text-sm text-muted-foreground pt-1">
                              Units: {targetCourse.units.credits} | Term: {targetCourse.units.term}
                         </CardDescription>
                     )}
                 </CardHeader>
                 <CardContent className="space-y-4">
                     {/* Keyword Badges */}
                     {(targetCourse.keywords && targetCourse.keywords.length > 0) ? (
                         <div className="flex flex-wrap gap-2">
                             {targetCourse.keywords.map((keyword, index) => (
                                 <Badge key={index} variant="secondary" className="bg-[#606c5d] text-[#DAD7CD] shadow-md hover:text-[#344E41] ">{keyword}</Badge>
                             ))}
                         </div>
                     ) : (
                         <p className="text-sm text-muted-foreground italic">No keywords available.</p>
                     )}

                     
                     {targetCourse.url ? (
                         <div>
                             <Link href={app_url+targetCourse.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-sm text-[#606c5d] hover:underline">
                                 View on UAlberta Catalogue <ExternalLink className="ml-1 h-3 w-3" />
                             </Link>
                         </div>
                     ) : (
                         <p className="text-sm text-muted-foreground italic">No official link available.</p>
                     )}

                     <hr/>

                     {/* Internal Grid for Side-by-Side Requirements */}
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">

                         {/* Prerequisite Section */}
                         <div className="prereq-section space-y-2">
                            <Card className="h-auto shadow-md border border-gray-200
                                dark:border-neutral-800 dark:bg-transparent dark:frosted">
                                <CardHeader>
                                    <CardTitle className="text-3xl">Prerequisites</CardTitle>
                                    <hr/>
                                    <CardDescription>Courses or conditions required before enrollment. <span className='font-extrabold'>Click on a course to check its prerequisites.</span></CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ExpandableCardContent collapsedHeight={150}>
                                        {(targetCourse.requirements?.prerequisites &&
                                        (targetCourse.requirements.prerequisites.courses?.length ||
                                        targetCourse.requirements.prerequisites.conditions?.length))
                                        ? (<RequirementConditionDisplay condition={targetCourse.requirements.prerequisites} />)
                                        : (<p className="text-sm text-gray-500">None listed.</p>)
                                        }
                                    </ExpandableCardContent>
                                </CardContent>
                             
                             </Card>
                         </div>
                    
                         {/* Corequisite Section */}
                         <div className="coreq-section space-y-2">
                            <Card className="h-max shadow-md border-2 border-gray-200
                                dark:border-neutral-800 dark:bg-transparent dark:frosted">
                                <CardHeader>
                                    <CardTitle className="text-3xl">Corequisites</CardTitle>
                                    <hr/>
                                    <CardDescription>Courses or conditions that can be taken concurrently. <span className='font-bold'>Click on a course to check its corequisites.</span></CardDescription>
                                </CardHeader>
                                <CardContent>
                                <ExpandableCardContent collapsedHeight={150}>
                                        {(targetCourse.requirements?.corequisites &&
                                        (targetCourse.requirements.corequisites.courses?.length ||
                                        targetCourse.requirements.corequisites.conditions?.length))
                                        ? (<RequirementConditionDisplay condition={targetCourse.requirements.corequisites} />)
                                        : (<p className="text-sm text-gray-500">None listed.</p>)
                                        }
                                    </ExpandableCardContent> 
                                </CardContent>
                            </Card> 
                         </div>
                     </div>
                 </CardContent>
             </Card>

             {/* Card 2: "Needed For" Placeholder Card */}
             {/*

                TODO: only show a certain amount fo courses in the list
                        then add a "show more" button to expand the list
                        then move to the bottom


             */}
              <Card className="bento-card md:col-span-1 shadow-md border border-gray-200
                           dark:border-neutral-800 dark:bg-transparent dark:frosted">
                <CardHeader>
                    <CardTitle className='text-3xl'>Needed For</CardTitle>
                    <CardDescription>
                        Courses that require this course. 
                        <span className='font-bold'>Click on a course to check its prerequisites.</span>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="required-by" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="required-by">Required By</TabsTrigger>
                            <TabsTrigger value="corequisite-for">Corequisite For</TabsTrigger>
                        </TabsList>
                        <TabsContent value="required-by">
 
                            <CourseLinkList
                            courses={requiredByCourses || []}
                            emptyMessage="No courses found that require this as a prerequisite."
                            />
                        
                        </TabsContent>
                        <TabsContent value="corequisite-for">
                        
                            <CourseLinkList
                            courses={corequisiteForCourses || []}
                            emptyMessage="No courses found that require this as a corequisite."
                            />
                        
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
            {/* Card 3: Graph Card */}
            <Card className="bento-card md:col-span-3
            border border-gray-200 dark:border-neutral-800 dark:bg-transparent dark:frosted"> {/* Spans 2 columns */}
                <CardHeader>
                    <CardTitle className="text-3xl">Dependency Graph</CardTitle>
                    <CardDescription>Visual representation of prerequisites.</CardDescription>
                </CardHeader>
                <CardContent>
                     <p className="text-xs text-gray-500 mb-4 italic">Note: Graph shows dependencies but not detailed AND/OR logic.</p>
                     {graphNodes.length > 0 || graphEdges.length > 0 ? (
                        <div className="min-h-[300px] md:min-h-[400px]"> {/* Ensure minimum height */}
                            <PrerequisiteGraphWrapper
                                key={targetCourse.id || targetCourse.courseCode} // Key for re-rendering
                                initialNodes={graphNodes}
                                initialEdges={graphEdges}
                            />
                        </div>
                     ) : (
                         <div className="p-4 text-center min-h-[200px] flex items-center justify-center">
                             <p className="text-sm text-gray-500">No prerequisite dependencies found to display.</p>
                         </div>
                     )}
                 </CardContent>
             </Card>
            


            

            {/* Card 4: "Extra Info" Placeholder Card */}
            {/* Placeholder for Profs, etc. */}
            <Card className="bento-card md:col-span-1
            border border-gray-200 dark:border-neutral-800 dark:bg-transparent dark:frosted
            "> {/* Spans 1 column */}
                <CardHeader>
                    <CardTitle>Extra Info</CardTitle>
                    <CardDescription>Additional course insights.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Future features placeholder.</p>
                </CardContent>
            </Card>

        </div> 
    );
}