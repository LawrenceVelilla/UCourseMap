
'use client';

import React, { useState, FormEvent, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";  
import { Alert, AlertDescription } from "@/components/ui/alert";
import { HelpCircle, Search } from "lucide-react"; 
import { AnimeSpinner } from './ui/searchLoading'; 


function parseCourseCode(input: string): { dept: string; code: string } | null {
    if (!input) return null; // Handle empty input
    const trimmedInput = input.trim().toUpperCase();
    const match = trimmedInput.match(/^([A-Z]+)\s*(\d+[A-Z]*)$/);
    if (match && match[1] && match[2]) {
        return { dept: match[1], code: match[2] };
    }
    return null; 
}

/**
 * A client component form for searching course prerequisites.
 * Handles input, validation, loading state with spinner, and refocusing after search.
 */
export function PrerequisiteCheckerForm() {
    const router = useRouter(); 
    const searchParams = useSearchParams();
    const inputRef = useRef<HTMLInputElement>(null); 


    // Initialize input value from URL parameters if available
    const initialDept = searchParams.get('dept');
    const initialCode = searchParams.get('code');
    const [inputValue, setInputValue] = useState<string>(
        initialDept && initialCode ? `${initialDept.toUpperCase()} ${initialCode}` : ''
    );
    // State for displaying parsing errors
    const [parseError, setParseError] = useState<string | null>(null);
    // State to track loading during navigation/data fetching
    const [isLoading, setIsLoading] = useState<boolean>(false);
    // Ref to track the previous loading state to detect when loading finishes
    const prevIsLoading = useRef(isLoading);



    // Effect 1: Synchronize input value with URL search parameters (e.g., browser back/forward)
    // Also responsible for turning off the loading indicator *after* navigation completes.
    useEffect(() => {
        const currentDept = searchParams.get('dept');
        const currentCode = searchParams.get('code');
        const urlValue = currentDept && currentCode ? `${currentDept.toUpperCase()} ${currentCode}` : '';

        // Update input value only if it differs from URL AND we are not currently loading
        // Prevents input flashing or overriding user typing during the load process
        if (inputValue !== urlValue && !isLoading) {
            setInputValue(urlValue);
        }

        // Stop loading indicator *after* navigation reflected in searchParams.
        // This usually means the server component has re-rendered and data is available.
        setIsLoading(false);
        setParseError(null); // Clear any previous parsing errors on navigation

    }, [searchParams]); // Dependency: Re-run only when the searchParams object changes


    // Effect 2: Refocus the input field *after* loading finishes
    useEffect(() => {
        // Check if loading has just transitioned from true (previous) to false (current)
        if (prevIsLoading.current && !isLoading && inputRef.current) {
            if (process.env.NODE_ENV === 'development') {
                console.log("[Form] Refocusing input after load.");
            }
            inputRef.current.focus(); // Programmatically set focus back to the input
        }
        // Update the ref to store the current loading state for the next render cycle
        prevIsLoading.current = isLoading;
    }, [isLoading]); // Dependency: Re-run only when the isLoading state changes



    /**
     * Handles form submission (or button click).
     * Validates input, sets loading state, and navigates using router.push.
     */
    const handleCheck = (event?: FormEvent) => {
        if (event) event.preventDefault(); // Prevent default form submission if triggered by event
        setParseError(null); // Clear previous errors

        const parsed = parseCourseCode(inputValue);

        // Validate the parsed input
        if (!parsed) {
            setParseError('Invalid format. Use "DEPT CODE" (e.g., "CMPUT 272").');
            // Ensure loading is off if validation fails before navigation attempt
            setIsLoading(false);
            return; // Stop execution if parsing failed
        }

        // Prevent unnecessary navigation and loading if already viewing the requested course
        const currentDeptParam = searchParams.get('dept');
        const currentCodeParam = searchParams.get('code');
        if (currentDeptParam === parsed.dept.toLowerCase() && currentCodeParam === parsed.code) {
             if (process.env.NODE_ENV === 'development') {
                console.log("[Form] Already viewing the requested course. No navigation needed.");
             }
            return; // Do nothing if the URL already matches the input
        }


        // Set loading state to true *before* starting navigation
        setIsLoading(true);

        // Construct new search parameters for the URL
        const params = new URLSearchParams();
        // Use lowercase department for cleaner URLs, keep code as parsed
        params.set('dept', parsed.dept.toLowerCase());
        params.set('code', parsed.code);
        const newPath = `/?${params.toString()}`; // Construct the new path with query string

        router.push(newPath);
    };

    const showExampleTip = !initialDept && !initialCode && !isLoading; // Show tip only on initial load when not loading

    return (
        <form onSubmit={handleCheck} className="space-y-3">
            {/* Input field group with integrated search button */}
            <div className="relative flex items-center">
                {/* Search Icon inside Input */}
                <Search
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" // Ensure icon doesn't interfere with clicks
                />
                {/* Input Field */}
                <Input
                    ref={inputRef} // Assign the ref to the input element
                    placeholder="Enter course code (e.g., CMPUT 272)"
                    // Adjust padding: pl for icon, pr for button space
                    className="pl-9 pr-24 h-10 rounded-md border-[#d1d5db] focus-visible:ring-[#606c5d]"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    aria-label="Course Code Input"
                    disabled={isLoading} // Disable input while loading
                />
                {/* Search Button */}
                <Button
                    type="submit"
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 rounded-md px-3 bg-[#606c5d] hover:bg-[#4a5349] text-xs font-medium flex items-center justify-center min-w-[70px]" // Min width ensures space for spinner/text
                    disabled={isLoading} 
                >
                    {/* Conditionally render spinner or text */}
                    {isLoading ? (
                        <AnimeSpinner />
                    ) : (
                        "Search"
                    )}
                </Button>
            </div>

            {/* Display parsing error message if present */}
             {parseError && (
                <Alert variant="destructive" className="text-xs p-2"> 
                     <AlertDescription>{parseError}</AlertDescription>
                </Alert>
            )}

            {/* Display example tip conditionally */}
            {showExampleTip && (
                 <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-1 pl-1">
                     <HelpCircle className="h-3.5 w-3.5" />
                     <span>Try searching for "CMPUT 272" or "MATH 125"</span>
                 </div>
            )}
        </form>
    );
}