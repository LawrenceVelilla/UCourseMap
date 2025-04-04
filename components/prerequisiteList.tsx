// components/PrerequisiteList.tsx
import React from 'react'; // Still need React for JSX
import { RequirementCondition } from '@/lib/types'; // Use your types file
import Link from 'next/link'; // Use Next.js Link for internal navigation

// Keep the props interface - this defines the component's expected props
interface PrerequisiteListProps {
  condition: RequirementCondition | undefined; // Accept undefined
  currentDept: string; // Pass current department for link generation
}

// Define the component as a regular function
// Type the props object directly using the interface
// Add an explicit return type (JSX.Element or null) for clarity (optional but good practice)
const PrerequisiteList = ({ condition, currentDept }: PrerequisiteListProps) => {

  // Handle the case where there are no conditions to render
  if (!condition || (!condition.conditions && !condition.courses)) {
    // Return JSX directly, or null if you prefer nothing to render
    return <li className="ml-4">None</li>;
  }

  // Define the recursive rendering function inside the component
  const renderCondition = (cond: RequirementCondition, level = 0) => {
    const operatorText = cond.operator === 'AND' ? 'ALL of the following:' : 'ONE of the following:';
    const indent = level * 20; // Calculate indentation

    return (
      <li style={{ listStyleType: 'none', marginLeft: `${indent}px` }} className="mt-1 mb-1">
        <strong className="font-semibold">{operatorText}</strong>
        <ul className="mt-1 mb-1 pl-5 border-l border-gray-300 dark:border-gray-700"> {/* Basic styling */}
          {cond.conditions?.map((subCond, index) => (
            // Use a more robust key combining level and index
            <React.Fragment key={`cond-${level}-${index}`}>
              {renderCondition(subCond, level + 1)}
            </React.Fragment>
          ))}
          {cond.courses?.map((course, index) => {
            // Attempt to create a link - assumes format "DEPT CODE"
            const parts = course.trim().split(/\s+/);
            const dept = parts[0]?.toUpperCase();
            // Handle course codes like '101L' or multi-part codes
            const code = parts.slice(1).join('');
            // Basic validation for common patterns (adjust regex if needed)
            const isValidCourseCodeFormat = /^[A-Z]+$/.test(dept ?? '') && /^[0-9]+[A-Za-z]*$/.test(code);
            const linkDept = dept || currentDept.toUpperCase(); // Fallback to current dept

            return (
              <li key={`course-${level}-${index}`} className="list-disc list-inside ml-[-1em]"> {/* Disc marker */}
                {isValidCourseCodeFormat ? (
                  <Link href={`/courses/${linkDept.toLowerCase()}/${code.toLowerCase()}`} className="text-blue-600 dark:text-blue-400 hover:underline">
                    {course}
                  </Link>
                ) : (
                  course // Render as text if not a recognizable course format
                )}
              </li>
            );
          })}
        </ul>
      </li>
    );
  };

  // Start rendering from the top-level condition
  // The component returns the result of this function call
  return renderCondition(condition, 0);
};

export default PrerequisiteList;