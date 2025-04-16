'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import useDebounce from '@/hooks/useDebounce';
import { Check, Loader2 } from "lucide-react"; 

// Shadcn UI Components
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; 
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"; 
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Define the expected shape of the API response items
interface SearchResult {
  id: string;
  department: string;
  courseCode: string;
  title: string;
}

// Define the shape of the API error response
interface ApiError {
    error: string;
    details?: any;
}

// Function to fetch course data from our API route
const fetchCourses = async (query: string): Promise<SearchResult[]> => {
  if (!query || query.length < 2) { // Maybe allow search from 2 chars now?
    return [];
  }
  const response = await fetch(`/api/courses/search?q=${encodeURIComponent(query)}`);

  if (!response.ok) {
    const errorData: ApiError = await response.json();
    throw new Error(errorData.error || `API Error: ${response.statusText}`);
  }
  const data: SearchResult[] = await response.json();
  return data;
};

/**
 * Parses a course string (e.g., "CMPUT 174") into department and code number.
 * Returns null if the format is invalid. (Simplified version for client-side)
 */
function parseCourseString(courseString: string): { department: string; codeNumber: string } | null {
    if (!courseString) return null;
    const trimmedInput = courseString.trim().toUpperCase();
    // Basic regex to capture department and code
    const match = trimmedInput.match(/^([A-Z]+)\s*(\d+[A-Z]*)$/);
    if (match && match[1] && match[2]) {
        return { department: match[1], codeNumber: match[2] };
    }
   return null;
}

export default function CourseSearchInput() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(''); // Raw input value
  const [selectedValue, setSelectedValue] = useState<SearchResult | null>(null); // Store the selected course object
  const [isCheckingPrereqs, setIsCheckingPrereqs] = useState(false); // <-- New state for button loading
  const debouncedInputValue = useDebounce(inputValue, 300);
  const router = useRouter();
  const searchParams = useSearchParams(); // <-- Get search params
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the input element
  const popoverContentRef = useRef<HTMLDivElement>(null); // Ref for popover content
  const lastSubmittedCourseRef = useRef<{ dept: string; code: string } | null>(null); // <-- Ref to track submission

  const {
    data: results = [], // Default to empty array
    isLoading,
    error,
    isError,
    isFetching,
    isPlaceholderData
  } = useQuery<SearchResult[], Error>({
    queryKey: ['courseSearch', debouncedInputValue],
    queryFn: () => fetchCourses(debouncedInputValue),
    enabled: debouncedInputValue.length >= 2, // Only fetch when debounced input is >= 2 chars
    placeholderData: keepPreviousData,
  });

  // Loading state specifically for suggestions list
  const isSuggestionLoading = (isLoading || isFetching) && !isPlaceholderData;

  // Function to handle triggering the prerequisite check
  const handlePrerequisiteCheck = useCallback(() => {
    // Prevent double clicks
    if (isCheckingPrereqs) return;

    const courseToParse = selectedValue?.courseCode || inputValue;
    const parsed = parseCourseString(courseToParse);
    if (parsed) {
        setIsCheckingPrereqs(true); // <-- Start loading
        setOpen(false);
        // Store what we are submitting *before* pushing
        lastSubmittedCourseRef.current = { dept: parsed.department, code: parsed.codeNumber };
        router.push(`/?dept=${encodeURIComponent(parsed.department)}&code=${encodeURIComponent(parsed.codeNumber)}`);
    } else {
        console.warn(`Invalid course code format submitted: ${courseToParse}`);
        inputRef.current?.focus();
    }
  }, [inputValue, selectedValue, router, isCheckingPrereqs]);

  // Effect to stop loading when URL matches the submitted course
  useEffect(() => {
    if (isCheckingPrereqs) {
        const currentDept = searchParams.get('dept');
        const currentCode = searchParams.get('code');
        const lastSubmitted = lastSubmittedCourseRef.current;

        // Check if URL params match the last submission
        if (lastSubmitted && currentDept === lastSubmitted.dept && currentCode === lastSubmitted.code) {
            setIsCheckingPrereqs(false); // <-- Stop loading
            lastSubmittedCourseRef.current = null; // Clear the ref
        }
    }
  }, [searchParams, isCheckingPrereqs]); // <-- Re-run when params change or loading starts

  // Handle selecting an item from the CommandList
  const handleSelect = (result: SearchResult) => {
    setInputValue(result.courseCode); // Set input to the selected course code
    setSelectedValue(result);        // Mark as selected
    setOpen(false);                  // Close popover
    inputRef.current?.focus();       // Keep focus on input after selection
  };

  // Handle manual input changes in CommandInput
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);
    setSelectedValue(null); // Clear explicit selection when user types manually
    if (value.length >= 2 && !open) {
        setOpen(true); // Open popover when typing starts (>= 2 chars)
    } else if (value.length < 2 && open) {
        setOpen(false); // Close if input becomes too short
    }
  };

   // Handle Enter key press in CommandInput
   const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handlePrerequisiteCheck();
        } else if (event.key === 'Escape') {
            setOpen(false);
        }
   };

  const handleFocus = () => {
      // Open if there's enough input length when focusing
      if (inputValue.length >= 2) {
          setOpen(true);
      }
  };

  // Updated Blur Handler
  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const relatedTarget = event.relatedTarget as Element | null;
    // Check if focus moved to an element inside the popover content
    if (popoverContentRef.current?.contains(relatedTarget)) {
        return; // Don't close if focus is moving inside the popover
    }
    // Close after a delay if focus moves elsewhere
    setTimeout(() => {
        // Re-check if the popover should be open in case state changed during delay
        if (!inputRef.current?.matches(':focus') && !popoverContentRef.current?.matches(':focus-within')) {
           setOpen(false);
        }
    }, 150);
  };

  return (
    <div className="flex w-full max-w-md items-start space-x-2"> {/* Use items-start */}
      <Popover open={open} onOpenChange={setOpen}>
        {/* Trigger: The div containing the input */}
        <PopoverTrigger asChild className="w-[calc(100%-4rem)]">
            <div className="relative"> {/* Relative positioning might be needed */}
                <Input
                    ref={inputRef}
                    type="text"
                    placeholder="Search courses (e.g. CMPUT 174)"
                    value={inputValue}
                    onChange={handleInputChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur} // Use updated blur handler
                    onKeyDown={handleKeyDown}
                    className="w-full"
                    aria-autocomplete="list"
                    aria-expanded={open}
                    aria-controls="course-search-popover"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                />
            </div>
        </PopoverTrigger>

        {/* Content: Appears below the trigger */}
        <PopoverContent
             ref={popoverContentRef} // Assign ref
             id="course-search-popover"
             className="w-[--radix-popover-trigger-width] p-0" // Matches trigger width
             onOpenAutoFocus={(e) => e.preventDefault()} // Prevent focus stealing
             onCloseAutoFocus={(e) => e.preventDefault()}
             style={{ marginTop: '0.25rem' }} // Optional gap
             >
          <Command shouldFilter={false}> {/* API handles filtering */}
            {/* No CommandInput here, input is outside */}
            <CommandList>
               {isSuggestionLoading && (
                 <div className="py-6 text-center text-sm">Loading...</div>
               )}
              {isError && <div className="py-6 text-center text-sm text-red-600">Error: {error?.message}</div>}
              <CommandEmpty>
                {!isSuggestionLoading && inputValue.length >= 2 ? "No course found." : (inputValue.length < 2 ? "Type 2+ characters" : "")}
              </CommandEmpty>
              {results.length > 0 && !isSuggestionLoading && !isError && (
                  <CommandGroup heading="Suggestions">
                  {results.map((result) => (
                      <CommandItem
                        key={result.id}
                        value={result.courseCode}
                        onSelect={() => handleSelect(result)}
                        className="cursor-pointer px-4"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        <div>
                          <span className="font-medium">{result.courseCode}</span>
                          <span className="text-muted-foreground ml-2">{result.title}</span>
                        </div>
                      </CommandItem>
                  ))}
                  </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Check Button */}
       <Button
            onClick={handlePrerequisiteCheck}
            disabled={isCheckingPrereqs || (!selectedValue && inputValue.length < 2) || !parseCourseString(inputValue)} // Disable on check action, or if input invalid
            className="w-16"
            type="button" // Ensure it doesn't act as form submit if wrapped in form later
        >
            {isCheckingPrereqs ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
       </Button>
    </div>
  );
} 