"use client";

import React, { useEffect } from "react";
import { useProgramPlanStore } from "../utils/store/programPlanStore";
import { RequirementValidationResult, RequirementCondition } from "../lib/types";

// Helper function ( move later)
const getCourseStatusText = (status: string | undefined) => {
  switch (status) {
    case "completed":
      return "Completed";
    case "in-progress":
      return "In Progress";
    case "planned":
      return "Planned";
    default:
      return "Not Started";
  }
};

// Helper function for requirement status styling
const getRequirementStatusBadge = (status: RequirementValidationResult["status"]) => {
  switch (status) {
    case "met":
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Met
        </span>
      );
    case "partially-met":
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Partially Met
        </span>
      );
    case "unmet":
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          Not Met
        </span>
      );
    // case 'overfilled': // Optional: handle overfilled status if needed
    //   return (...);
    default:
      return null;
  }
};

// Prerequisite Rendering Component
const RenderCondition: React.FC<{ condition: RequirementCondition }> = ({ condition }) => {
  console.log("RenderCondition received:", condition);
  return (
    <div className="ml-4 border-l pl-4 my-1">
      {condition.description && (
        <p className="text-xs italic text-gray-600 mb-1">({condition.description})</p>
      )}
      {condition.operator && condition.operator !== "STANDALONE" && (
        <span className="text-xs font-semibold uppercase mr-1">{condition.operator}:</span>
      )}
      {condition.courses && condition.courses.length > 0 && (
        <ul className="list-disc list-inside text-sm">
          {condition.courses.map((course, index) => (
            <li key={index} className="text-gray-800">
              {course}
            </li>
          ))}
        </ul>
      )}
      {condition.conditions && condition.conditions.length > 0 && (
        <div className="mt-1">
          {condition.conditions.map((subCondition, index) => (
            <RenderCondition key={index} condition={subCondition} />
          ))}
        </div>
      )}
      {/* Handle pattern if needed */}
      {condition.pattern && <p className="text-sm text-gray-800">Pattern: {condition.pattern}</p>}
    </div>
  );
};
// Function to extract course codes from a requirement condition
const extractPrereqCodes = (condition: RequirementCondition | null | undefined): string[] => {
  if (!condition) return [];

  let codes: string[] = [];

  if (condition.courses) {
    codes = codes.concat(condition.courses);
  }

  if (condition.conditions) {
    condition.conditions.forEach((subCondition) => {
      codes = codes.concat(extractPrereqCodes(subCondition));
    });
  }

  // TODO: Potentially handle condition.pattern if it represents course codes

  return codes;
};

export default function PlanBuilder() {
  const {
    program,
    selectedCourses,
    completedUnits,
    plannedUnits,
    removeCourse,
    requirementStatus,
    prerequisiteInfo,
    fetchPrerequisitesForCourse,
  } = useProgramPlanStore();

  const selectedCoursesArray = Array.from(selectedCourses.entries());

  const selectedCourseKeys = selectedCoursesArray
    .map(([key]) => key)
    .sort()
    .join(",");

  useEffect(() => {
    console.log("PlanBuilder useEffect triggered. selectedCourses keys:", selectedCourseKeys);
    const keysToFetch = selectedCourseKeys ? selectedCourseKeys.split(",") : [];

    keysToFetch.forEach((courseCode) => {
      if (!prerequisiteInfo.has(courseCode)) {
        console.log(`PlanBuilder: Triggering fetchPrerequisitesForCourse for ${courseCode}`);
        // Fetch data - intentionally not awaited in loop, mark as void
        void fetchPrerequisitesForCourse(courseCode);
      }
    });
  }, [selectedCourseKeys, fetchPrerequisitesForCourse, prerequisiteInfo]);

  // Calculate unique prerequisites for the new display
  const allPrereqCodes = selectedCoursesArray.reduce((acc, [courseCode]) => {
    const prereqs = prerequisiteInfo.get(courseCode);
    return acc.concat(extractPrereqCodes(prereqs));
  }, [] as string[]);

  const uniquePrereqCodes = Array.from(new Set(allPrereqCodes)).sort();

  // Log prerequisiteInfo state before rendering
  console.log("PlanBuilder rendering. prerequisiteInfo state:", prerequisiteInfo);

  if (!program) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-bold mb-4">No Program Loaded</h2>
        <p>Please select a program first to build a plan.</p>
      </div>
    );
  }

  // TODO: Group courses by status or semester later

  return (
    <div className="plan-builder p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Plan for {program.programName}</h1>
        {/* Reuse the stats display */}
        <div className="stats flex gap-4">
          <div className="stat bg-[#283618] p-2 rounded">
            <div className="stat-title text-xs">Completed</div>
            <div className="stat-value text-lg">{completedUnits} units</div>
          </div>
          <div className="stat bg-[#dda15e] p-2 rounded">
            <div className="stat-title text-xs">Planned</div>
            <div className="stat-value text-lg">{plannedUnits} units</div>
          </div>
        </div>
      </div>

      <div className="selected-courses mt-6">
        <h2 className="text-xl font-semibold mb-4">Selected Courses</h2>
        {selectedCoursesArray.length === 0 ? (
          <p className="text-gray-600">
            No courses selected yet. Go to the Program Viewer to add courses.
          </p>
        ) : (
          <ul className="space-y-2">
            {selectedCoursesArray.map(([courseCode, details]) => (
              <li
                key={courseCode}
                className="p-3 border rounded-md bg-white shadow-sm flex justify-between items-center"
              >
                <div>
                  <span className="font-medium text-lg text-[#283618]">{courseCode}</span>
                  {/* Assuming details might have title - needs adjustment based on actual store structure */}
                  {/* <span className="text-sm text-gray-700 ml-2">{details.title}</span> */}
                  <span
                    className={`ml-4 px-2 py-0.5 rounded-full text-xs font-medium 
                    ${
                      details.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : details.status === "in-progress"
                          ? "bg-blue-100 text-blue-800"
                          : details.status === "planned"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                    }
                  `}
                  >
                    {getCourseStatusText(details.status)}
                  </span>
                </div>
                {/* Placeholder for future actions like changing status or viewing prerequisites */}
                <div className="flex gap-2">
                  {/* Example: Add status change buttons or prerequisite view button here */}
                  <button
                    onClick={() => removeCourse(courseCode)}
                    className="text-red-500 hover:text-red-700 text-sm"
                    aria-label={`Remove ${courseCode} from plan`}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Requirement Validation Section */}
      <div className="requirement-validation mt-8">
        <h2 className="text-xl font-semibold mb-4">Requirement Check</h2>
        {requirementStatus.length === 0 ? (
          <p className="text-gray-500">No specific unit requirements found or calculated yet.</p>
        ) : (
          <ul className="space-y-3">
            {requirementStatus.map((req) => (
              <li key={req.requirementId} className="p-4 border rounded-md bg-white shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-gray-800">{req.description}</h3>
                  {getRequirementStatusBadge(req.status)}
                </div>
                <p className="text-sm text-gray-600">
                  Required: <span className="font-semibold">{req.requiredUnits} units</span>
                </p>
                <p className="text-sm text-gray-600">
                  Achieved (Completed):{" "}
                  <span className="font-semibold">{req.achievedUnits} units</span>
                </p>
                {/* Optional: Display relevant courses */}
                {req.relevantCourses.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">
                      Your selections relevant to this requirement:
                    </p>
                    <ul className="list-disc list-inside text-xs space-y-1">
                      {req.relevantCourses.map((rc) => (
                        <li
                          key={rc.courseCode}
                          className={`${rc.status === "completed" ? "text-green-700" : "text-gray-600"}`}
                        >
                          {rc.courseCode} ({rc.units} units) - {getCourseStatusText(rc.status)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {req.status === "unmet" || req.status === "partially-met" ? (
                  <p className="text-xs text-red-600 mt-1">
                    Need {req.requiredUnits - req.achievedUnits} more completed units.
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="prerequisite-view mt-8">
        <h2 className="text-xl font-semibold mb-4">Unique Prerequisites Needed</h2>
        {selectedCoursesArray.length === 0 ? (
          <p className="text-gray-500">Select courses to see their combined prerequisites.</p>
        ) : uniquePrereqCodes.length === 0 ? (
          <p className="text-gray-500">None of the selected courses have listed prerequisites.</p>
        ) : (
          <div className="p-4 border rounded-md bg-white shadow-sm">
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-700">
              {uniquePrereqCodes.map((code) => (
                <li key={code}>{code}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
