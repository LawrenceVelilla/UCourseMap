'use client';

import React, { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert"; // Simplified Alert usage
import { HelpCircle, Search } from "lucide-react"; // Added Search icon

// Helper function to parse course code string
function parseCourseCode(input: string): { dept: string; code: string } | null {
<<<<<<< HEAD
    const trimmedInput = input.trim().toUpperCase();
    // Matches patterns like "DEPT 123", "DEPT123", "DEPT 123A", "DEPT123A"
    const match = trimmedInput.match(/^([A-Z]+)\s*(\d+[A-Z]*)$/);
    if (match && match[1] && match[2]) {
        return { dept: match[1], code: match[2] }; // Keep case as parsed (uppercase)
    }
    return null;
=======
  const trimmedInput = input.trim().toUpperCase();

  // First try to match departments with spaces like "INT D 461"
  // This regex matches patterns like "INT D 461", where the department has a space
  const spacedDeptMatch = trimmedInput.match(/^([A-Z]+\s+[A-Z])\s+(\d+[A-Z]*)$/);
  if (spacedDeptMatch && spacedDeptMatch[1] && spacedDeptMatch[2]) {
    return { dept: spacedDeptMatch[1], code: spacedDeptMatch[2] };
  }

  // Try matching with more than two characters in the second part of department (e.g., "INT D1")
  const spacedDeptMatch2 = trimmedInput.match(/^([A-Z]+\s+[A-Z]+)\s+(\d+[A-Z]*)$/);
  if (spacedDeptMatch2 && spacedDeptMatch2[1] && spacedDeptMatch2[2]) {
    return { dept: spacedDeptMatch2[1], code: spacedDeptMatch2[2] };
  }

  // Then try the original pattern for regular departments like "CMPUT 272"
  // Matches patterns like "DEPT 123", "DEPT123", "DEPT 123A", "DEPT123A"
  const standardMatch = trimmedInput.match(/^([A-Z]+)\s*(\d+[A-Z]*)$/);
  if (standardMatch && standardMatch[1] && standardMatch[2]) {
    return { dept: standardMatch[1], code: standardMatch[2] };
  }

  return null;
>>>>>>> 2a52df9 (fix: Optimized headerNav for mobile UI so that there is no overfill. Added unit testing thru jest)
}


export function PrerequisiteCheckerForm() {
    const router = useRouter();
    const searchParams = useSearchParams();

<<<<<<< HEAD
    // Initialize state from URL params for persistence on reload/navigation
    const initialDept = searchParams.get('dept');
    const initialCode = searchParams.get('code');
    const [inputValue, setInputValue] = useState(
        initialDept && initialCode ? `${initialDept.toUpperCase()} ${initialCode}` : ''
    );
    const [parseError, setParseError] = useState<string | null>(null);
=======
  // Initialize state from URL params for persistence on reload/navigation
  const initialDept = searchParams.get("dept");
  const initialCode = searchParams.get("code");
  const [inputValue, setInputValue] = useState(
    initialDept && initialCode ? `${initialDept.toUpperCase()} ${initialCode}` : "",
  );
  const [parseError, setParseError] = useState<string | null>(null);
>>>>>>> 2a52df9 (fix: Optimized headerNav for mobile UI so that there is no overfill. Added unit testing thru jest)

    // Effect to update input if URL changes externally (e.g., browser back/forward)
     useEffect(() => {
        const currentDept = searchParams.get('dept');
        const currentCode = searchParams.get('code');
        // Only update input if it differs from URL, prevents overriding user typing
        const urlValue = currentDept && currentCode ? `${currentDept.toUpperCase()} ${currentCode}` : '';
        if (inputValue !== urlValue) {
            setInputValue(urlValue);
        }
        setParseError(null); // Clear error on navigation change
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]); // Rerun only when searchParams object changes


    const handleCheck = (event?: FormEvent) => {
        if (event) event.preventDefault();
        setParseError(null);

        const parsed = parseCourseCode(inputValue);

        if (!parsed) {
            setParseError('Invalid format. Use "DEPT CODE" (e.g., "CMPUT 272").');
            return;
        }

        // Construct new search parameters using lowercase dept for URL consistency
        const params = new URLSearchParams();
        params.set('dept', parsed.dept.toLowerCase());
        params.set('code', parsed.code); // Use code as parsed (usually number + optional letter)
        const newPath = `/?${params.toString()}`;

        // Use router.push for client-side navigation which triggers Server Component refetch
        router.push(newPath);
    };

    // Determine if the example tip should be shown (only if no search active)
    const showExampleTip = !initialDept && !initialCode;

    return (
        <form onSubmit={handleCheck} className="space-y-3">
            {/* Input with integrated button */}
            <div className="relative flex items-center">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                    placeholder="Enter course code (e.g., CMPUT 272)"
                    className="pl-9 pr-20 h-10 rounded-md focus-visible:ring-[#606c5d]" // Adjusted styling
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    aria-label="Course Code Input"
                />
                <Button
                    type="submit"
                    className="absolute text-whiteright-1 top-1/2 transform -translate-y-1/2 h-8 rounded-md px-4 bg-[#606c5d] hover:bg-[#4a5349] text-xs font-medium"
                >
                    Check
                </Button>
            </div>

<<<<<<< HEAD
            {/* Display parsing error if any */}
             {parseError && (
                <Alert variant="destructive" className="text-xs">
                     <AlertDescription>{parseError}</AlertDescription>
                </Alert>
            )}

            {/* Example Tip (conditionally rendered) */}
            {showExampleTip && (
                 <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-1 pl-1">
                     <HelpCircle className="h-3.5 w-3.5" />
                     <span>Try searching for "CMPUT 272" or "MATH 125"</span>
                 </div>
            )}
        </form>
    );
}
=======
      {/* Example Tip (conditionally rendered) */}
      {showExampleTip && (
        <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-1 pl-1">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>
            Try searching for &quot;CMPUT 272&quot;, &quot;MATH 125&quot;, or &quot;INT D 100&quot;
          </span>
        </div>
      )}
    </form>
  );
}
>>>>>>> 2a52df9 (fix: Optimized headerNav for mobile UI so that there is no overfill. Added unit testing thru jest)
