"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import useDebounce from "@/hooks/useDebounce";
import { Loader2, ScanSearch, CaseSensitive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  department: string;
  courseCode: string;
  title: string;
}

interface ApiError {
  error: string;
  details?: any;
}

function parseCourseString(courseString: string) {
  const m = courseString
    .trim()
    .toUpperCase()
    .match(/^([A-Z]+(?:\s[A-Z]+)*)\s*(\d+[A-Z]*)$/);
  return m ? { department: m[1], codeNumber: m[2] } : null;
}

async function fetchCourses(q: string, mode: "code" | "title"): Promise<SearchResult[]> {
  if (q.length < 2) return [];
  const res = await fetch(`/api/courses/search?q=${encodeURIComponent(q)}&mode=${mode}`);
  if (!res.ok) {
    const err: ApiError = await res.json();
    console.error("API Fetch Error:", err);
    throw new Error(err.error || `Failed to fetch courses: ${res.statusText}`);
  }
  return res.json();
}

type SearchMode = "code" | "title";

export default function CourseSearchInput() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedValue, setSelectedValue] = useState<SearchResult | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isChecking, setIsChecking] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>("code");
  const lastSubmittedRef = useRef<{ dept: string; code: string } | null>(null);
  const mouseIsOverList = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  const debounced = useDebounce(inputValue, 300);
  const router = useRouter();
  const params = useSearchParams();

  const {
    data: results = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery<SearchResult[], Error>({
    queryKey: ["courseSearch", debounced, searchMode],
    queryFn: () => fetchCourses(debounced, searchMode),
    enabled: debounced.length >= 2,
    placeholderData: keepPreviousData,
  });

  const moveDown = () =>
    setHighlightedIndex((prev) => (prev < 0 || prev >= results.length - 1 ? 0 : prev + 1));

  const moveUp = () => setHighlightedIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));

  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const item = listRef.current.querySelector(`#item-${highlightedIndex}`);
    item?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  useEffect(() => {
    if (!open) setHighlightedIndex(-1);
  }, [open]);

  useEffect(() => {
    if (isChecking) {
      const d = params.get("dept");
      const c = params.get("code");
      const last = lastSubmittedRef.current;
      if (last && last.dept === d && last.code === c) {
        setIsChecking(false);
        lastSubmittedRef.current = null;
      }
    }
  }, [params, isChecking]);

  const doCheck = useCallback(() => {
    if (isChecking) return;
    const courseIdentifier = selectedValue ? selectedValue.courseCode : inputValue;
    const parsed = parseCourseString(courseIdentifier);
    if (!parsed) {
      console.warn("Invalid course format for check:", courseIdentifier);
      return;
    }
    setIsChecking(true);
    setOpen(false);
    lastSubmittedRef.current = { dept: parsed.department, code: parsed.codeNumber };
    router.push(
      `/?dept=${encodeURIComponent(parsed.department)}&code=${encodeURIComponent(parsed.codeNumber)}`
    );
  }, [inputValue, selectedValue, router, isChecking]);

  const onSelect = (r: SearchResult) => {
    setInputValue(r.courseCode);
    setSelectedValue(r);
    setOpen(false);
    setIsChecking(true);
    const codeNumber = r.courseCode.match(/\d+[A-Z]*/)?.[0] ?? "";
    lastSubmittedRef.current = { dept: r.department, code: codeNumber };
    router.push(
      `/?dept=${encodeURIComponent(r.department)}&code=${encodeURIComponent(codeNumber)}`
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        doCheck();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        moveDown();
        break;
      case "ArrowUp":
        e.preventDefault();
        moveUp();
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          onSelect(results[highlightedIndex]);
        } else {
          doCheck();
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        break;
    }
  };

  const handleMouseEnterList = () => {
    mouseIsOverList.current = true;
  };

  const handleMouseLeaveList = () => {
    mouseIsOverList.current = false;
    setHighlightedIndex(-1);
  };

  const handleBlur = () => {
    setTimeout(() => {
      if (
        !mouseIsOverList.current &&
        !document.activeElement?.closest("#course-suggestions-listbox") &&
        !document.activeElement?.closest('[data-search-mode-badge="true"]')
      ) {
        setOpen(false);
      }
    }, 150);
  };

  return (
    <div className="flex w-full max-w-lg flex-col items-center space-y-2">
      <div className="flex w-full items-start space-x-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div className="relative w-full">
              <Input
                type="text"
                placeholder={
                  searchMode === "code"
                    ? "Search by code (e.g. CMPUT 174)"
                    : "Search by title (e.g. Intro Computing)"
                }
                value={inputValue}
                onChange={(e) => {
                  const v = e.target.value;
                  setInputValue(v);
                  setSelectedValue(null);
                  setHighlightedIndex(-1);
                  setOpen(v.length >= 2);
                }}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                autoComplete="off"
                spellCheck={false}
                className="w-full"
                role="combobox"
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-controls="course-suggestions-listbox"
                aria-activedescendant={
                  highlightedIndex >= 0 ? `item-${highlightedIndex}` : undefined
                }
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center">
                {(isLoading || isFetching) && !isChecking && (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>
          </PopoverTrigger>

          <PopoverContent
            id="course-search-popover"
            className="w-[--radix-popover-trigger-width] p-0"
            side="bottom"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onCloseAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              if ((e.target as HTMLElement)?.closest('[data-search-mode-badge="true"]')) {
                return;
              }
              if ((e.target as HTMLElement)?.closest('[aria-haspopup="listbox"]')) return;
              setOpen(false);
            }}
          >
            <div
              ref={listRef}
              id="course-suggestions-listbox"
              role="listbox"
              className="max-h-[300px] overflow-y-auto"
              onMouseEnter={handleMouseEnterList}
              onMouseLeave={handleMouseLeaveList}
            >
              {(isLoading || isFetching) && debounced.length >= 2 && (
                <div className="p-4">
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex animate-pulse items-center space-x-2">
                        <div className="h-4 w-16 rounded bg-muted"></div>
                        <div className="h-4 w-full rounded bg-muted"></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {isError && (
                <div className="p-4 text-center text-sm text-red-600">
                  Error: {error?.message ?? "Failed to load suggestions"}
                </div>
              )}
              {!isLoading &&
                !isFetching &&
                !isError &&
                debounced.length >= 2 &&
                results.length === 0 && (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No courses found.
                  </div>
                )}
              {!isLoading && !isFetching && !isError && results.length > 0 && (
                <div role="group" aria-label="Course suggestions">
                  {results.map((r, i) => (
                    <div
                      key={r.id}
                      data-index={i}
                      id={`item-${i}`}
                      role="option"
                      aria-selected={highlightedIndex === i}
                      className={cn(
                        "cursor-pointer px-3 py-2 text-sm hover:bg-accent",
                        highlightedIndex === i ? "bg-accent" : ""
                      )}
                      onClick={() => onSelect(r)}
                      onMouseEnter={() => setHighlightedIndex(i)}
                    >
                      <span className="font-medium">{r.courseCode}</span> - {r.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <Button
          onClick={doCheck}
          disabled={isChecking || (!selectedValue && !parseCourseString(inputValue))}
          aria-label="View course details"
          className="min-w-[80px] mt-3"
        >
          {isChecking ? (
            <div className="flex items-center space-x-1">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking</span>
            </div>
          ) : (
            "Check"
          )}
        </Button>
      </div>

      <div className="flex items-center justify-center space-x-2">
        <Badge
          variant={searchMode === "code" ? "secondary" : "outline"}
          onClick={() => setSearchMode("code")}
          className={cn(
            "cursor-pointer select-none",
            "ring-2",
            searchMode === "code" ? "ring-ring scale-105" : "ring-transparent",
            "focus:outline-none focus:ring focus:ring-offset-0",
            "focus:border-transparent",
            "transition-all duration-200 ease-in-out",
            searchMode !== "code" && "hover:bg-accent hover:scale-105"
          )}
          data-search-mode-badge="true"
          aria-pressed={searchMode === "code"}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setSearchMode("code");
          }}
        >
          <ScanSearch className="mr-1.5 h-4 w-4" /> Code
        </Badge>
        <Badge
          variant={searchMode === "title" ? "secondary" : "outline"}
          onClick={() => setSearchMode("title")}
          className={cn(
            "cursor-pointer select-none",
            "ring-2",
            searchMode === "title" ? "ring-ring scale-105" : "ring-transparent",
            "focus:outline-none focus:ring focus:ring-offset-0",
            "focus:border-transparent",
            "transition-all duration-200 ease-in-out",
            searchMode !== "title" && "hover:bg-accent hover:scale-105"
          )}
          data-search-mode-badge="true"
          aria-pressed={searchMode === "title"}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setSearchMode("title");
          }}
        >
          <CaseSensitive className="mr-1.5 h-4 w-4" /> Title
        </Badge>
      </div>
    </div>
  );
}
