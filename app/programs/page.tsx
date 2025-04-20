"use client";

import { useEffect, useState } from "react";

import Link from "next/link";

// --- Updated Interfaces (Add description to Group) ---
type Course = {
  courseCode: string | null;
  title: string | null;
  department: string | null;
  note: string | null;
};

// Represents a sub-group within a block, usually defined by an H3/H4
type Group = {
  groupTitle: string | null;
  description: string[]; // <-- Add description here
  courses: Course[];
};

// Represents a major section/block scraped
type Block = {
  title: string | null; // This might represent the first group title or general block heading
  groups: Group[];
  notesList: string[];
};

type ProgramData = {
  programName: string;
  // generalNote?: string; // If you have a top-level note
  blocks: Block[];
};
// ----------------------------------------------------

export default function ProgramsPage() {
  const [data, setData] = useState<ProgramData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/program_requirements.json") // Assuming it's in public/
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((jsonData) => setData(jsonData))
      .catch((e) => {
        console.error("Failed to load program data:", e);
        setError("Failed to load program requirements. Please try again later.");
      });
  }, []);

  if (error) {
    return <div className="text-red-500 p-4">Error: {error}</div>;
  }

  if (!data) {
    return <div className="p-4">Loading program requirements...</div>; // Or use loading.tsx
  }

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold border-b pb-2">{data.programName}</h1>
      {/* Render general note if needed */}

      {data.blocks.map((block, blockIndex) => (
        <section key={`block-${blockIndex}`} className="border-t pt-6">
          {/* Optional Block Title (if different from first group) */}
          {block.title && block.groups.length > 0 && block.title !== block.groups[0].groupTitle && (
            <h2 className="text-2xl font-semibold mb-4 text-primary-foreground/80">
              {block.title}
            </h2>
          )}

          {/* Iterate through GROUPS within the block */}
          {block.groups.map((group, groupIndex) => (
            <div key={`group-${blockIndex}-${groupIndex}`} className="mb-6 last:mb-0">
              {/* Group Title */}
              {group.groupTitle && (
                <h3 className="text-xl font-medium mb-2 text-secondary-foreground border-b pb-1">
                  {group.groupTitle}
                </h3>
              )}

              {/* --- Render Group Description --- */}
              {group.description && group.description.length > 0 && (
                <div className="prose prose-sm dark:prose-invert max-w-none mb-3 space-y-1 pl-4 text-muted-foreground">
                  {group.description.map((desc, descIndex) => (
                    // Using 'dangerouslySetInnerHTML' ONLY if you trust the source HTML structure implicitly.
                    // For plain text, just use <p>{desc}</p>
                    <p key={`desc-${blockIndex}-${groupIndex}-${descIndex}`}>{desc}</p>
                  ))}
                </div>
              )}
              {/* ----------------------------- */}

              {/* Courses List for this Group */}
              {group.courses && group.courses.length > 0 && (
                <ul className="list-disc list-inside space-y-1 pl-4">
                  {group.courses.map((course, courseIndex) => {
                    // Ensure department and code exist before creating link
                    const department = course.department; // Use original case for consistency?
                    const codeNumberMatch = course.courseCode?.match(/\d+[A-Z]*$/);
                    const codeNumber = codeNumberMatch ? codeNumberMatch[0] : null;

                    // Only render link if we have valid dept and code number
                    if (department && codeNumber && course.courseCode) {
                      return (
                        <li key={`course-${blockIndex}-${groupIndex}-${courseIndex}`}>
                          <Link
                            href={`/?dept=${encodeURIComponent(department)}&code=${encodeURIComponent(codeNumber)}`}
                            className="hover:underline focus:underline focus:outline-none focus:ring-2 focus:ring-ring rounded-sm"
                          >
                            {course.courseCode}
                            {course.title && ` - ${course.title}`}
                            {course.note && (
                              <span className="text-xs text-muted-foreground ml-1">
                                {course.note}
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    } else {
                      // Render as plain text if data is missing for linking
                      return (
                        <li
                          key={`course-${blockIndex}-${groupIndex}-${courseIndex}`}
                          className="text-muted-foreground"
                        >
                          {course.courseCode || "Missing Code"}
                          {course.title && ` - ${course.title}`}
                          {course.note && (
                            <span className="text-xs text-muted-foreground ml-1">
                              {course.note}
                            </span>
                          )}
                          <span className="text-xs italic"> (Link disabled - missing data)</span>
                        </li>
                      );
                    }
                  })}
                </ul>
              )}
              {/* Optional: Add handling if a group has description but no title/courses? */}
            </div>
          ))}

          {/* Notes List associated with the outer BLOCK */}
          {block.notesList && block.notesList.length > 0 && (
            <div className="mt-4 pt-4 border-t border-dashed">
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Notes:</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground pl-4">
                {block.notesList.map((note, noteIndex) => (
                  <li key={`note-${blockIndex}-${noteIndex}`}>{note}</li>
                ))}
              </ol>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
