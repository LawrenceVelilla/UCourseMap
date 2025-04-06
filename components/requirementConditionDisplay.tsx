// components/RequirementConditionDisplay.tsx
import Link from 'next/link';
import { RequirementCondition } from '@/lib/types'; // Adjust path if needed

// Helper function to parse course code (can be shared or redefined)
function parseCourseCodeForLink(input: string): { dept: string; code: string } | null {
    const trimmedInput = input.trim().toUpperCase();
    const match = trimmedInput.match(/^([A-Z]+)\s*(\d+[A-Z]*)$/);
    if (match && match[1] && match[2]) {
        return { dept: match[1], code: match[2] };
    }
    return null;
}

// Recursive component to display requirements
export function RequirementConditionDisplay({ condition, level = 0 }: { condition: RequirementCondition, level?: number }) {
    const indentStyle = { marginLeft: `${level * 20}px`, borderLeft: level > 0 ? '1px solid #eee' : 'none', paddingLeft: level > 0 ? '10px' : '0', marginTop: '5px', marginBottom: '5px' };

    const operatorText = level > 0
      ? condition.operator === 'AND'
          ? 'ALL of the following:'
          : 'ONE of the following:'
      : null; // Main level doesn't need "AND/OR" unless nested

    return (
        <div style={indentStyle}>
            {operatorText && <p style={{ margin: '5px 0', fontWeight: '500', fontStyle: 'italic', fontSize: '0.9em' }}>{operatorText}</p>}

            {/* Render direct courses */}
            {condition.courses && condition.courses.length > 0 && (
                <ul style={{ listStyle: 'disc', paddingLeft: '20px', margin: '5px 0' }}>
                    {condition.courses.map(courseCode => {
                        const parsed = parseCourseCodeForLink(courseCode);
                        // Link updates search params on the *current* page
                        const linkHref = parsed
                            ? `/prerequisites?dept=${parsed.dept.toLowerCase()}&code=${parsed.code}`
                            : `/prerequisites`; // Fallback or maybe disable link?

                        return (
                            <li key={courseCode} style={{ marginBottom: '3px' }}>
                                <Link href={linkHref} className="text-blue-600 hover:underline" title={`Check prerequisites for ${courseCode}`}>
                                    {courseCode}
                                </Link>
                                {/* Placeholder for Check/X logic */}
                                {/* <Check className="h-4 w-4 text-green-600 inline ml-2" /> */}
                                {/* <X className="h-4 w-4 text-red-600 inline ml-2" /> */}
                            </li>
                        );
                    })}
                </ul>
            )}

            {/* Render nested conditions */}
            {condition.conditions && condition.conditions.length > 0 && (
                <div>
                    {condition.conditions.map((subCondition, index) => (
                        <RequirementConditionDisplay key={index} condition={subCondition} level={level + 1} />
                    ))}
                </div>
            )}
            {condition.pattern && <p>Pattern: <code>{condition.pattern}</code></p>}
        </div>
    );
}