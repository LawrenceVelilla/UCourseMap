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

"use client";

import React, { useEffect, useRef, useState } from "react";
import { animate, stagger } from "animejs";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RequirementConditionDisplay } from "@/components/requirementConditionDisplay";
import { CourseLinkList } from "./courseLinkList";
import { Course } from "@/lib/types";
import Link from "next/link";
import { ExternalLink, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExpandableCardContent } from "./expandableCardContent";
import dynamic from "next/dynamic";
// Import types and constants separately
import type {
  InputNode as DetailedInputNode,
  AppEdge as DetailedAppEdge,
} from "@/components/DetailedPrerequisiteGraph";
import type {
  InputNode as SimpleInputNode,
  AppEdge as SimpleAppEdge,
} from "@/components/SimplePrerequisiteGraphDisplay";
import { levelColors } from "@/components/DetailedPrerequisiteGraph";

interface CourseResultDisplayProps {
  targetCourse: Course;
  simpleGraphNodes: SimpleInputNode[];
  simpleGraphEdges: SimpleAppEdge[];
  department: string;
  code: string;
  requiredByCourses?: Pick<Course, "id" | "department" | "courseCode" | "title">[];
  corequisiteForCourses?: Pick<Course, "id" | "department" | "courseCode" | "title">[];
}

const app_url = "https://apps.ualberta.ca";

// Dynamically import PrerequisiteGraphWrapper with SSR turned off
const DetailedPrerequisiteGraphWrapper = dynamic(
  () => import("@/components/DetailedPrerequisiteGraph"),
  {
    ssr: false,
    loading: () => (
      <div className="p-4 text-center min-h-[200px] flex items-center justify-center">
        <p>Loading graph...</p>
      </div>
    ),
  },
);

// Dynamically import SimplePrerequisiteGraphDisplay with SSR turned off
const SimplePrerequisiteGraphWrapper = dynamic(
  () => import("@/components/SimplePrerequisiteGraphDisplay"),
  {
    ssr: false,
    loading: () => (
      <div className="p-4 text-center min-h-[200px] flex items-center justify-center">
        <p>Loading graph...</p>
      </div>
    ),
  },
);

export function CourseResultDisplay({
  targetCourse,
  simpleGraphNodes,
  simpleGraphEdges,
  department,
  code,
  requiredByCourses,
  corequisiteForCourses,
}: CourseResultDisplayProps) {
  const bentoContainerRef = useRef<HTMLDivElement>(null); // Ref for the grid container
  const [graphView, setGraphView] = useState<"detailed" | "simple">("simple"); // Default to simple view
  const [detailedGraphNodes, setDetailedGraphNodes] = useState<DetailedInputNode[]>([]);
  const [detailedGraphEdges, setDetailedGraphEdges] = useState<DetailedAppEdge[]>([]);
  const [isLoadingDetailedGraph, setIsLoadingDetailedGraph] = useState<boolean>(false);
  const [detailedGraphError, setDetailedGraphError] = useState<string | null>(null);
  const [detailedGraphLoaded, setDetailedGraphLoaded] = useState<boolean>(false);

  // Reset view preference when course changes
  useEffect(() => {
    // Reset to simple view whenever a new course is loaded
    setGraphView("simple");
    // Reset detailed graph data states
    setDetailedGraphNodes([]);
    setDetailedGraphEdges([]);
    setDetailedGraphLoaded(false);
    setDetailedGraphError(null);
  }, [targetCourse.id, targetCourse.courseCode]);

  const fetchDetailedGraphData = async () => {
    if (detailedGraphLoaded) return; // Don't fetch if already loaded

    setIsLoadingDetailedGraph(true);
    setDetailedGraphError(null);

    try {
      const response = await fetch(`/api/courses/${department}/${code}/detailed-graph`);

      if (!response.ok) {
        throw new Error(
          `Failed to fetch detailed graph: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      setDetailedGraphNodes(data.nodes || []);
      setDetailedGraphEdges(data.edges || []);
      setDetailedGraphLoaded(true);
    } catch (error) {
      console.error("Error fetching detailed graph data:", error);
      setDetailedGraphError(
        error instanceof Error ? error.message : "Failed to load detailed graph",
      );
    } finally {
      setIsLoadingDetailedGraph(false);
    }
  };

  const handleViewToggle = (view: "detailed" | "simple") => {
    if (view === "detailed" && !detailedGraphLoaded && !isLoadingDetailedGraph) {
      fetchDetailedGraphData();
    }

    setGraphView(view);
  };

  useEffect(() => {
    if (targetCourse && bentoContainerRef.current) {
      const cards = bentoContainerRef.current.querySelectorAll(".bento-card");
      if (cards.length > 0) {
        animate(cards, {
          opacity: [0, 1],
          translateY: [20, 0],
          delay: stagger(100),
          duration: 500,
          easing: "easeOutQuad",
        });
      }
      // Todo: Add graph animations here
    }
    // Rerun animation if the target course changes
  }, [targetCourse]);

  const getContrastColor = (hexColor: string): string => {
    if (!hexColor) return "#000000";
    const hex = hexColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    // Formula for luminance (YIQ equation)
    const luminance = (r * 299 + g * 587 + b * 114) / 1000;
    return luminance >= 128 ? "#000000" : "#FFFFFF";
  };

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
      <Card
        className="
            bento-card md:col-span-2 shadow-md border border-gray-200
            dark:border-neutral-800  dark:bg-transparent dark:frosted
            "
      >
        {" "}
        {/* Spans 2 columns */}
        <CardHeader>
          {/* Course Code and Title */}
          <CardTitle className="text-3xl">
            {targetCourse.courseCode}: {targetCourse.title}
          </CardTitle>
          {/* Units */}
          {targetCourse.units && (
            <CardDescription className="text-sm text-muted-foreground pt-1">
              Units: {targetCourse.units.credits} | Term: {targetCourse.units.term}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Keyword Badges */}
          {targetCourse.keywords && targetCourse.keywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {targetCourse.keywords.map((keyword, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-[#606c5d] text-[#DAD7CD] shadow-md hover:text-[#344E41] dark:bg;white 
                                 dark:text-secondary-foreground dark:hover:bg-white dark:hover:text-black
                                 "
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No keywords available.</p>
          )}

          {targetCourse.url ? (
            <div>
              <Link
                href={app_url + targetCourse.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm text-[#606c5d] hover:underline"
              >
                View on UAlberta Catalogue <ExternalLink className="ml-1 h-3 w-3" />
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">No official link available.</p>
          )}

          <hr />

          {/* Internal Grid for Side-by-Side Requirements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Prerequisite Section */}
            <div className="prereq-section space-y-2">
              <Card
                className="h-auto shadow-md border border-gray-200
                                dark:border-neutral-800 dark:bg-transparent dark:frosted"
              >
                <CardHeader>
                  <CardTitle className="text-3xl">Prerequisites</CardTitle>
                  <hr />
                  <CardDescription>
                    Courses or conditions required before enrollment.{" "}
                    <span className="font-extrabold">
                      Click on a course to check its prerequisites.
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpandableCardContent collapsedHeight={150}>
                    {targetCourse.requirements?.prerequisites &&
                    (targetCourse.requirements.prerequisites.courses?.length ||
                      targetCourse.requirements.prerequisites.conditions?.length) ? (
                      <RequirementConditionDisplay
                        condition={targetCourse.requirements.prerequisites}
                      />
                    ) : (
                      <p className="text-sm text-gray-500">None listed.</p>
                    )}
                  </ExpandableCardContent>
                </CardContent>
              </Card>
            </div>

            {/* Corequisite Section */}
            <div className="coreq-section space-y-2">
              <Card
                className="h-max shadow-md border-2 border-gray-200
                                dark:border-neutral-800 dark:bg-transparent dark:frosted"
              >
                <CardHeader>
                  <CardTitle className="text-3xl">Corequisites</CardTitle>
                  <hr />
                  <CardDescription>
                    Courses or conditions that can be taken concurrently.{" "}
                    <span className="font-bold">Click on a course to check its corequisites.</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpandableCardContent collapsedHeight={150}>
                    {targetCourse.requirements?.corequisites &&
                    (targetCourse.requirements.corequisites.courses?.length ||
                      targetCourse.requirements.corequisites.conditions?.length) ? (
                      <RequirementConditionDisplay
                        condition={targetCourse.requirements.corequisites}
                      />
                    ) : (
                      <p className="text-sm text-gray-500">None listed.</p>
                    )}
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
      <Card
        className="bento-card md:col-span-1 shadow-md border border-gray-200
                           dark:border-neutral-800 dark:bg-transparent dark:frosted"
      >
        <CardHeader>
          <CardTitle className="text-3xl">Needed For</CardTitle>
          <CardDescription>
            Courses that require this course.
            <span className="font-bold">Click on a course to check its prerequisites.</span>
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
      <Card
        className="bento-card md:col-span-3
            border border-gray-200 dark:border-neutral-800 dark:bg-transparent dark:frosted"
      >
        {" "}
        {/* Spans 3 columns */}
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-3xl">Dependency Graph</CardTitle>
            <CardDescription>Visual representation of prerequisites.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={graphView === "simple" ? "default" : "outline"}
              onClick={() => handleViewToggle("simple")}
              className="cursor-pointer"
            >
              Simple
            </Badge>
            <Badge
              variant={graphView === "detailed" ? "default" : "outline"}
              onClick={() => handleViewToggle("detailed")}
              className="cursor-pointer"
            >
              Detailed
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-gray-500 mb-4 italic">
            Note: Graph shows dependencies but not detailed AND/OR logic.
          </p>

          {/* Legend for Edge Colors - shown for both graph types */}
          {(graphView === "detailed" && detailedGraphNodes.length > 0) ||
          (graphView === "simple" && simpleGraphNodes.length > 0) ? (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-sm font-medium mr-2 self-center">Legend:</span>
              {levelColors.map((color, index) => (
                <Badge
                  key={index}
                  variant="outline" // Use outline variant to prevent default bg
                  className="border border-gray-300 dark:border-gray-700 px-3 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: color,
                    color: getContrastColor(color),
                  }}
                >
                  Level {index + 1}
                </Badge>
              ))}
            </div>
          ) : null}

          {detailedGraphNodes.length > 0 ||
          detailedGraphEdges.length > 0 ||
          simpleGraphNodes.length > 0 ||
          simpleGraphEdges.length > 0 ? (
            <div className="min-h-[300px] md:min-h-[400px]">
              {graphView === "detailed" ? (
                isLoadingDetailedGraph ? (
                  <div className="flex items-center justify-center h-full min-h-[300px]">
                    <div className="flex flex-col items-center space-y-4">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                      <p>Loading detailed graph...</p>
                    </div>
                  </div>
                ) : detailedGraphError ? (
                  <div className="flex items-center justify-center h-full min-h-[300px]">
                    <Alert variant="destructive" className="max-w-md">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{detailedGraphError}</AlertDescription>
                    </Alert>
                  </div>
                ) : detailedGraphNodes.length > 0 ? (
                  <DetailedPrerequisiteGraphWrapper
                    key={`detailed-${targetCourse.id || targetCourse.courseCode}`}
                    initialNodes={detailedGraphNodes}
                    initialEdges={detailedGraphEdges}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full min-h-[300px]">
                    <p className="text-sm text-gray-500">
                      No detailed prerequisite data available.
                    </p>
                  </div>
                )
              ) : (
                <SimplePrerequisiteGraphWrapper
                  key={`simple-${targetCourse.id || targetCourse.courseCode}`}
                  initialNodes={simpleGraphNodes}
                  initialEdges={simpleGraphEdges}
                />
              )}
            </div>
          ) : (
            <div className="p-4 text-center min-h-[200px] flex items-center justify-center">
              <p className="text-sm text-gray-500">
                No prerequisite dependencies found to display.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
