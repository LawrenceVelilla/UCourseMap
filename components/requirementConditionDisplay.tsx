import Link from 'next/link';
import { RequirementCondition } from '@/lib/types';
import { cn } from '@/lib/utils';


// --- HELPER FUNCTIONS --- (Move to utils so it looks clean)
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



export function RequirementConditionDisplay({ condition }: { condition: RequirementCondition }) {

    // --- Handle nodes that are purely descriptive (description or pattern) ---
    const descriptiveText = condition.description?.trim() || condition.pattern?.trim();
    if (descriptiveText) {
        // Render descriptive text directly. Parent LI provides bullet context.
        return ( <span className="font-italic text-[#333]">{descriptiveText}</span> );
    }

    // --- Determine Operator Text (only for AND/OR) ---
    const operatorText = condition.operator === 'AND'
      ? 'ALL of:'
      : (condition.operator === 'OR' ? 'ONE of:' : null);

    // --- Determine if this node requires its own UL structure ---
    // Needs UL if it has an operator (AND/OR) OR if it has nested conditions.
    const needsOwnUl = !!operatorText || (condition.conditions && condition.conditions.length > 0);
    const hasDirectCourses = condition.courses && condition.courses.length > 0;
    const hasNestedConditions = condition.conditions && condition.conditions.length > 0;

    return (
        <>
            {/* 1. Display Operator Text (if applicable) */}
            {operatorText && (
                 <p 
                 className='ml-1 font-medium italic text-sm text-size-sm'>
                     {operatorText}
                 </p>
            )}

            {/* 2. Render Content (either within a UL or directly) */}
            {needsOwnUl ? (
                // CASE A: This node needs its own UL (has operator or nested conditions)
                <ul className={cn('list-disc list-inside pl-4', operatorText ? 'mt-1' : 'mt-0')} >
                    {/* Render Direct Courses (if any) as LIs within this UL */}
                    {hasDirectCourses && condition.courses!.map(itemText => {
                        const isCourse = looksLikeCourseCode(itemText);
                        const parsedLinkData = isCourse ? parseCourseCodeForLink(itemText) : null;
                        return (
                            
                             <li key={itemText} className='m-1'>
                            
                                 {isCourse && parsedLinkData ? ( <Link href={`/?dept=${parsedLinkData.dept.toLowerCase()}&code=${parsedLinkData.code}`} 
                                 className="p-px rounded-md broder-2 text-[#588157] transition-colors duration-200 hover:bg-[#606c5d] hover:text-[#DAD7CD]" title={`Check prerequisites for ${itemText}`}> {itemText} </Link> )
                                  : ( <span className="text-[#588157] font-italic">{itemText}</span> )}
                             </li>
                          );
                    })}

                    {/* Render Nested Conditions as LIs within this UL */}
                    {hasNestedConditions && condition.conditions!.map((subCondition, index) => (
                        // Each sub-condition gets an LI wrapper
                        <li 
                        className='m-1'
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
                        return (
<<<<<<< HEAD
                           <div key={itemText} style={{ marginBottom: '3px' /* Or maybe no div needed, just span/Link? */ }}>
<<<<<<< HEAD
                               {isCourse && parsedLinkData ? ( <Link href={`/prerequisites?dept=${parsedLinkData.dept.toLowerCase()}&code=${parsedLinkData.code}`} className="text-[#283618] hover:underline" title={`Check prerequisites for ${itemText}`}> {itemText} </Link> )
                                : ( <span style={{ fontStyle: 'italic', color: '#333' }}>{itemText}</span> )}
=======
=======
                           <div 
                           className="m-1"
                           
                           key={itemText}>
>>>>>>> a6bced1 (Edited show more button to be more obvious)
                               {isCourse && parsedLinkData ? ( <Link href={`/?dept=${parsedLinkData.dept.toLowerCase()}&code=${parsedLinkData.code}`} className="text-[#588157] transition-colors duration-200 hover:bg-[#606c5d] hover:text-[#fefae0]" title={`Check prerequisites for ${itemText}`}> {itemText} </Link> )
                                : ( <span className='font-italic text-[#588157]'>{itemText}</span> )}
>>>>>>> 80cc526 (Added auto-complete suggestions, added ReactQuery and CSF, aded rate limitting)
                           </div>
                       );
                   })}
                </>
            )}

             {/* Handle completely empty nodes (that weren't descriptive) */}
             {!descriptiveText && !hasDirectCourses && !hasNestedConditions && (
                  <p 
                  className='font-italic text-[#588157] m-1'>(No specific conditions listed here)</p>
              )}
        </>
    );
}