import Link from 'next/link';
import { RequirementCondition } from '@/lib/types';

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
        return ( <span style={{ fontStyle: 'italic', color: '#333' }}>{descriptiveText}</span> );
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
                 <p style={{ margin: '0 0 5px 0', fontWeight: '500', fontStyle: 'italic', fontSize: '0.9em' }}>
                     {operatorText}
                 </p>
            )}

            {/* 2. Render Content (either within a UL or directly) */}
            {needsOwnUl ? (
                // CASE A: This node needs its own UL (has operator or nested conditions)
                <ul style={{ listStyle: 'disc', paddingLeft: '20px', margin: operatorText ? '5px 0 0 0' : '0' }}>

                    {/* Render Direct Courses (if any) as LIs within this UL */}
                    {hasDirectCourses && condition.courses!.map(itemText => {
                        const isCourse = looksLikeCourseCode(itemText);
                        const parsedLinkData = isCourse ? parseCourseCodeForLink(itemText) : null;
                        return (
                             <li key={itemText} style={{ marginBottom: '3px' }}>
                                 {isCourse && parsedLinkData ? ( <Link href={`/prerequisites?dept=${parsedLinkData.dept.toLowerCase()}&code=${parsedLinkData.code}`} className="text-[#283618] hover:underline" title={`Check prerequisites for ${itemText}`}> {itemText} </Link> )
                                  : ( <span style={{ fontStyle: 'italic', color: '#333' }}>{itemText}</span> )}
                             </li>
                          );
                    })}

                    {/* Render Nested Conditions as LIs within this UL */}
                    {hasNestedConditions && condition.conditions!.map((subCondition, index) => (
                        // Each sub-condition gets an LI wrapper
                        <li key={`${subCondition.operator || 'complex'}-${index}`} style={{ marginBottom: '5px' }}>
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
                           <div key={itemText} style={{ marginBottom: '3px' /* Or maybe no div needed, just span/Link? */ }}>
                               {isCourse && parsedLinkData ? ( <Link href={`/prerequisites?dept=${parsedLinkData.dept.toLowerCase()}&code=${parsedLinkData.code}`} className="text-[#283618] hover:underline" title={`Check prerequisites for ${itemText}`}> {itemText} </Link> )
                                : ( <span style={{ fontStyle: 'italic', color: '#333' }}>{itemText}</span> )}
                           </div>
                       );
                   })}
                </>
            )}

             {/* Handle completely empty nodes (that weren't descriptive) */}
             {!descriptiveText && !hasDirectCourses && !hasNestedConditions && (
                  <p style={{ fontStyle: 'italic', color: '#888', margin: '0' }}>(No specific conditions listed here)</p>
              )}
        </>
    );
}