"use client";

import { useState } from "react";
import { Program, ProgramCourse } from "../lib/types";
import { useProgramPlanStore } from "../utils/store/programPlanStore";

interface ProgramViewerProps {
  initialProgram?: Program;
}

// Class status styling
const getCourseClasses = (status: string | undefined) => {
  switch (status) {
    case "completed":
      return "bg-[#283618] text-white border-[#283618]";
    case "in-progress":
      return "bg-[#dda15e] border-[#dda15e]";
    case "planned":
      return "bg-yellow-100 border-yellow-300";
    default: // 'not-started' or undefined
      return "bg-white border-gray-300 hover:bg-gray-50";
  }
};

export default function ProgramViewer({ initialProgram }: ProgramViewerProps) {
  // Use Zustand store for state management
  const {
    program,
    setProgram,
    selectedCourses,
    addCourse,
    removeCourse,
    updateCourseStatus,
    completedUnits,
    plannedUnits,
    remainingUnits,
  } = useProgramPlanStore();

  useState(() => {
    if (initialProgram) {
      setProgram(initialProgram);
    }
  });

  if (!program) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-bold mb-4">No Program Selected</h2>
        <p>Please select a program to view requirements</p>
      </div>
    );
  }

  return (
    <div className="program-viewer">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{program.programName}</h1>
        <div className="stats flex gap-4">
          <div className="stat bg-[#283618] p-2 rounded">
            <div className="stat-title text-xs">Completed</div>
            <div className="stat-value text-lg">{completedUnits} units</div>
          </div>
          <div className="stat bg-[#dda15e] p-2 rounded">
            <div className="stat-title text-xs">Planned</div>
            <div className="stat-value text-lg">{plannedUnits} units</div>
          </div>
          <div className="stat bg-[#a3b18a] p-2 rounded">
            <div className="stat-title text-xs">Remaining</div>
            <div className="stat-value text-lg">{remainingUnits} units</div>
          </div>
        </div>
      </div>

      {program.categories?.map((category) => (
        <div key={category.id} className="category mb-8">
          <h2 className="text-xl font-semibold mb-4 p-2 rounded">{category.name}</h2>

          <div className="blocks ml-4">
            {category.blocks.map((blockId) => {
              // TODO: Refactor block lookup. Relying on 'block-<index>' format is fragile.
              // Ideally, ProgramBlock should have a unique ID, and category.blocks
              // should store those IDs. Then use:
              // const block = program.blocks.find(b => b.id === blockId);
              const blockIndex = parseInt(blockId.replace("block-", ""), 10); // Added radix 10
              // Add check for NaN index
              if (isNaN(blockIndex) || blockIndex < 0 || blockIndex >= program.blocks.length) {
                console.warn(`Invalid blockId format or index out of bounds: ${blockId}`);
                return null;
              }
              const block = program.blocks[blockIndex];

              // Add check if block is somehow undefined after index check (shouldn't happen but safe)
              if (!block || block.blockType === "category") return null;

              return (
                <div key={blockId} className="block mb-6">
                  {block.title && block.title !== category.name && (
                    <h3 className="text-lg font-medium mb-2">
                      {block.title}
                      {block.unitsRequired && (
                        <span className="text-sm font-normal ml-2 text-gray-600">
                          ({block.unitsRequired} units required)
                        </span>
                      )}
                    </h3>
                  )}

                  {block.groups.map((group, groupIndex) => (
                    <div key={`${blockId}-group-${groupIndex}`} className="group mb-4">
                      {group.groupTitle && group.groupTitle !== block.title && (
                        <h4 className="text-md font-medium mb-1 text-[#283618]">
                          {group.groupTitle}
                        </h4>
                      )}

                      {group.description.length > 0 && (
                        <div className="description mb-2">
                          {group.description.map((desc, descIndex) => (
                            <p key={`desc-${descIndex}`} className="text-sm text-gray-700">
                              {desc}
                            </p>
                          ))}
                        </div>
                      )}

                      {group.courses.length > 0 && (
                        <div className="courses grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {group.courses.map((course: ProgramCourse) => {
                            // Explicitly type course
                            const selection = selectedCourses.get(course.courseCode);
                            const isSelected = !!selection;
                            const status = selection?.status || "not-started";

                            return (
                              <div
                                key={course.courseCode}
                                className={`course relative p-2 rounded border cursor-pointer transition-colors ${getCourseClasses(status)}`} // Use helper function
                                onClick={() => {
                                  if (isSelected) {
                                    // Cycle through statuses: planned -> in-progress -> completed -> planned
                                    if (status === "not-started") {
                                      // Should only happen if added then immediately clicked? Add as planned.
                                      addCourse(course.courseCode, { status: "planned" });
                                    } else if (status === "planned") {
                                      updateCourseStatus(course.courseCode, {
                                        status: "in-progress",
                                      });
                                    } else if (status === "in-progress") {
                                      updateCourseStatus(course.courseCode, {
                                        status: "completed",
                                      });
                                    } else {
                                      // status === 'completed' -> cycle back to planned
                                      updateCourseStatus(course.courseCode, { status: "planned" });
                                    }
                                  } else {
                                    // Add course as planned if not selected
                                    addCourse(course.courseCode, { status: "planned" });
                                  }
                                }}
                              >
                                <div
                                  className={`font-medium ${status === "completed" ? "text-white" : "text-[#283618]"}`}
                                >
                                  {course.courseCode}
                                </div>{" "}
                                {/* Adjust text color for completed */}
                                <div
                                  className={`text-sm ${status === "completed" ? "text-gray-200" : "text-gray-700"}`}
                                >
                                  {course.title}
                                </div>{" "}
                                {/* Adjust text color for completed */}
                                {course.note && (
                                  <div
                                    className={`text-xs ${status === "completed" ? "text-gray-300" : "text-gray-500"} mt-1`}
                                  >
                                    {course.note}
                                  </div>
                                )}
                                {/* Add Remove Button */}
                                {isSelected && (
                                  <button
                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-700 text-white text-xs font-bold p-1 rounded-full leading-none w-4 h-4 flex items-center justify-center"
                                    onClick={(e) => {
                                      e.stopPropagation(); // Prevent the main div onClick from firing
                                      removeCourse(course.courseCode);
                                    }}
                                    aria-label={`Remove ${course.courseCode}`}
                                  >
                                    &times; {/* Multiplication sign for 'x' */}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}

                  {block.notesList.length > 0 && (
                    <div className="notes mt-2 text-sm text-gray-600">
                      <h4 className="font-medium">Notes:</h4>
                      <ol className="list-decimal list-inside">
                        {block.notesList.map((note, noteIndex) => (
                          <li key={`note-${noteIndex}`} className="ml-2">
                            {note}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
