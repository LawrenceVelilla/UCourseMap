// components/PrerequisiteCheckerForm.tsx
'use client'; // <--- Make this a Client Component

import { useState, FormEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { HelpCircle } from "lucide-react";

// Helper function to parse course code (simple example)
function parseCourseCode(input: string): { dept: string; code: string } | null {
    const trimmedInput = input.trim().toUpperCase();
    // Matches patterns like "CMPUT 272", "MATH 100", "STAT 151A" etc.
    const match = trimmedInput.match(/^([A-Z]+)\s*(\d+[A-Z]*)$/);
    if (match && match[1] && match[2]) {
        return { dept: match[1], code: match[2] };
    }
    return null;
}


export function PrerequisiteCheckerForm() {
    const router = useRouter();
    const searchParams = useSearchParams(); // Get current search params

    // Initialize state from URL params if they exist, otherwise empty
    const initialDept = searchParams.get('dept') || '';
    const initialCode = searchParams.get('code') || '';
    const [inputValue, setInputValue] = useState(
        initialDept && initialCode ? `${initialDept.toUpperCase()} ${initialCode}` : ''
    );
    const [parseError, setParseError] = useState<string | null>(null);

    // Effect to update input if URL changes (e.g., browser back/forward)
     useEffect(() => {
        const dept = searchParams.get('dept');
        const code = searchParams.get('code');
        setInputValue(dept && code ? `${dept.toUpperCase()} ${code}` : '');
        setParseError(null); // Clear error on navigation
    }, [searchParams]);


    const handleCheck = (event?: FormEvent) => {
        if (event) event.preventDefault(); // Prevent default form submission if used
        setParseError(null); // Clear previous errors

        const parsed = parseCourseCode(inputValue);

        if (!parsed) {
            setParseError('Invalid format. Please use format like "DEPT CODE" (e.g., "CMPUT 272").');
            return;
        }

        // Construct the new URL with search parameters
        const params = new URLSearchParams();
        params.set('dept', parsed.dept.toLowerCase()); // Use lowercase for consistency in URL
        params.set('code', parsed.code);
        const newPath = `/prerequisites?${params.toString()}`;

        // Use router.push for client-side navigation
        router.push(newPath);
    };

    return (
        <form onSubmit={handleCheck}> {/* Use onSubmit for better accessibility (allows Enter key) */}
             <div className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="Enter course code (e.g., CMPUT 272)"
                        className="flex-1"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        aria-label="Course Code Input"
                    />
                    <Button type="submit" className="bg-[#606c5d] hover:bg-[#4a5349]">Check</Button>
                </div>

                {/* Display parsing error if any */}
                 {parseError && (
                    <Alert variant="destructive">
                         <AlertDescription>{parseError}</AlertDescription>
                    </Alert>
                )}

                <Alert className="bg-[#f0f0e8] border-[#606c5d]">
                    <HelpCircle className="h-4 w-4" />
                    <AlertTitle>Example Search</AlertTitle>
                    <AlertDescription>
                        Try searching for "CMPUT 272" or "MATH 125" to see prerequisite information.
                    </AlertDescription>
                </Alert>
            </div>
        </form>
    );
}