import Link from 'next/link';
import { RequirementCondition } from '@/lib/types'; 
import { cn } from '@/lib/utils'; 

// --- HELPER FUNCTIONS ---
function parseCourseCodeForLink(input: string): { dept: string; code: string } | null {
    if (!input) return null;
    const trimmedInput = input.trim().toUpperCase();
    const matchSpace = trimmedInput.match(/^([A-Z]+)\s+(\d+[A-Z]*)$/);
    if (matchSpace && matchSpace[1] && matchSpace[2]) {
        return { dept: matchSpace[1], code: matchSpace[2] };
    }
    const matchNoSpace = trimmedInput.match(/^([A-Z]+)(\d+[A-Z]*)$/);
     if (matchNoSpace && matchNoSpace[1] && matchNoSpace[2]) {
        if (matchNoSpace[1].length >= 2 && matchNoSpace[1].length <= 5) {
             return { dept: matchNoSpace[1], code: matchNoSpace[2] };
        }
    }
    return null;
}

function looksLikeCourseCode(text: string): boolean {
    return parseCourseCodeForLink(text) !== null;
}

// --- COMPONENT ---

export function RequirementConditionDisplay({ condition }: { condition: RequirementCondition }) {

    // --- Handle nodes that are purely descriptive (description or pattern) ---
    const descriptiveText = condition.description?.trim() || condition.pattern?.trim();
    if (descriptiveText) {
        // Render descriptive text directly. Parent LI provides bullet context.
        return ( <span className="font-italic text-[#333] dark:text-[#fefae0]">{descriptiveText}</span> );
    }

    // --- Determine Operator Text (only for AND/OR) ---
    const operatorText = condition.operator === 'AND'
      ? 'ALL of:'
      : (condition.operator === 'OR' ? 'ONE of:' : null);

<<<<<<< HEAD
    // --- Determine if this node requires its own UL structure ---
    // Needs UL if it has an operator (AND/OR) OR if it has nested conditions.
    const needsOwnUl = !!operatorText || (condition.conditions && condition.conditions.length > 0);
    const hasDirectCourses = condition.courses && condition.courses.length > 0;
    const hasNestedConditions = condition.conditions && condition.conditions.length > 0;

    return (
        <>
            {/* 1. Display Operator Text (if applicable) - Changed <p> to <span> */}
            {operatorText && (
                 <span // <-- Use span with inline-block to avoid block behavior causing line break after bullet
                 className='ml-1 mr-1 font-medium italic text-sm text-size-sm inline-block align-baseline'> {/* Added inline-block, align-baseline, mr-1 */}
                     {operatorText}
                 </span>
            )}
=======
  return (
    <>
      {/* 1. Display Operator Text (if applicable) - Changed <p> to <span> */}
      {operatorText && (
        <span // <-- Use span with inline-block to avoid block behavior causing line break after bullet
          className="ml-1 mr-1 font-medium italic text-sm text-size-sm inline-block align-baseline"
        >
          {operatorText}
        </span>
      )}

      {/* 2. Render Content (either within a UL or directly) */}
      {needsOwnUl ? (
        // CASE A: This node needs its own UL (has operator or nested conditions)
        <ul
          className={cn(
            "list-disc list-inside pl-4",
            // inline-block operator might need less/no top margin on UL
            // Keep mt-0 or adjust slightly if needed for visual spacing
            operatorText ? "mt-0" : "mt-0",
          )}
        >
          {/* Render Direct Courses (if any) as LIs within this UL */}
          {hasDirectCourses &&
            condition.courses!.map((itemText) => {
              const isCourse = looksLikeCourseCode(itemText);
              const parsedLinkData = isCourse ? parseCourseCodeForLink(itemText) : null;
              return (
                <li key={itemText} className="m-1">
                  {/* Group span for hover effect */}
                  <span className="group pl-2 pr-2 rounded-md transition-colors duration-200 hover:bg-[#606c5d]">
                    {isCourse && parsedLinkData ? (
                      <Link
                        href={`/courses/${parsedLinkData.dept.toLowerCase()}/${parsedLinkData.code}`}
                        className="text-[#588157] group-hover:text-white"
                        title={`Check prerequisites for ${itemText}`}
                      >
                        {itemText}
                      </Link>
                    ) : (
                      <span className="font-italic text-[#588157] dark:text-[#fefae0] group-hover:text-white">
                        {itemText}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}

          {/* Render Nested Conditions as LIs within this UL */}
          {hasNestedConditions &&
            condition.conditions!.map((subCondition, index) => (
              // Each sub-condition gets an LI wrapper
              <li
                className="m-1" // List item wrapper for nested condition
                key={`${subCondition.operator || "complex"}-${index}`}
              >
                {/* Recursive call renders content INSIDE the LI */}
                <RequirementConditionDisplay condition={subCondition} />
              </li>
            ))}
        </ul>
      ) : (
        // CASE B: This node does NOT need its own UL (e.g., STANDALONE with only courses)
        // Render its courses directly. The parent LI/UL provides context.
        <>
          {hasDirectCourses &&
            condition.courses!.map((itemText) => {
              const isCourse = looksLikeCourseCode(itemText);
              const parsedLinkData = isCourse ? parseCourseCodeForLink(itemText) : null;

              // Restore inline-block to fix indentation issues with standalone items
              return (
                <div className="m-1 inline-block" key={itemText}>
                  {isCourse && parsedLinkData ? (
                    <span className="group pl-2 pr-2 rounded-md transition-colors duration-200 hover:bg-[#606c5d]">
                      <Link
                        href={`/courses/${parsedLinkData.dept.toLowerCase()}/${parsedLinkData.code}`}
                        className="text-[#588157] group-hover:text-white"
                        title={`Check prerequisites for ${itemText}`}
                      >
                        {itemText}
                      </Link>
                    </span>
                  ) : (
                    <span className="font-italic dark:text-[#fefae0]">{itemText}</span>
                  )}
                </div>
              );
            })}
        </>
      )}
>>>>>>> f9b07a9 (feat: Implemented a &apos;Detailed&apos; Graph that displays prerequisites INCLUDING the AND/OR logic -- Also fixed indentation issues)

            {/* 2. Render Content (either within a UL or directly) */}
            {needsOwnUl ? (
                // CASE A: This node needs its own UL (has operator or nested conditions)
                <ul className={cn(
                    'list-disc list-inside pl-4',
                    // inline-block operator might need less/no top margin on UL
                    // Keep mt-0 or adjust slightly if needed for visual spacing
                    operatorText ? 'mt-0' : 'mt-0'
                    )}
                >
                    {/* Render Direct Courses (if any) as LIs within this UL */}
                    {hasDirectCourses && condition.courses!.map(itemText => {
                        const isCourse = looksLikeCourseCode(itemText);
                        const parsedLinkData = isCourse ? parseCourseCodeForLink(itemText) : null;
                        return (
                             <li key={itemText} className='m-1'> {/* List item wrapper */}
                                 {isCourse && parsedLinkData ? (
                                     <Link href={`/?dept=${parsedLinkData.dept.toLowerCase()}&code=${parsedLinkData.code}`}
                                           className="p-px rounded-md text-[#588157] transition-colors duration-200 hover:bg-[#606c5d] hover:text-white"
                                           title={`Check prerequisites for ${itemText}`}>
                                         {itemText}
                                     </Link>
                                 ) : (
                                     <span className="font-italic dark:text-[#fefae0]">{itemText}</span>
                                 )}
                             </li>
                          );
                    })}

                    {/* Render Nested Conditions as LIs within this UL */}
                    {hasNestedConditions && condition.conditions!.map((subCondition, index) => (
                        // Each sub-condition gets an LI wrapper
                        <li
                            className='m-1' // List item wrapper for nested condition
                            key={`${subCondition.operator || 'complex'}-${index}`}>
                            {/* Recursive call renders content INSIDE the LI */}
                            <RequirementConditionDisplay condition={subCondition} />
                        </li>
                    ))}
                </ul>
            ) : (
                // CASE B: This node does NOT need its own UL (e.g., STANDALONE with only courses)
                // Render its courses directly. The parent LI/UL provides context.
                <>
                    {hasDirectCourses && condition.courses!.map(itemText => {
                        const isCourse = looksLikeCourseCode(itemText);
                        const parsedLinkData = isCourse ? parseCourseCodeForLink(itemText) : null;
                        // Render course/text without LI/UL - parent handles list structure
                        // Use a div or span for key and potential margin/styling if needed
                        return (
                           <div className="m-1 inline-block" key={itemText}> {/* Wrap in div/span if needed for key/styling */}
                                {isCourse && parsedLinkData ? (
                                    <Link href={`/?dept=${parsedLinkData.dept.toLowerCase()}&code=${parsedLinkData.code}`}
                                          className="p-px rounded-md text-[#588157] transition-colors duration-200 hover:bg-[#606c5d] hover:text-white"
                                          title={`Check prerequisites for ${itemText}`}>
                                        {itemText}
                                    </Link>
                                ) : (
                                    <span className="font-italic dark:text-[#fefae0]">{itemText}</span>
                                )}
                           </div>
                       );
                   })}
                </>
            )}

             {/* Handle completely empty nodes (that weren't descriptive) */}
             {!descriptiveText && !hasDirectCourses && !hasNestedConditions && (
                  // Use span here too, as it's likely inside an LI
                  <span className='font-italic text-[#588157] m-1'>(No specific conditions listed here)</span>
              )}
        </>
    );
}