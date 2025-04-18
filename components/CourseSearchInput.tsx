"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import useDebounce from "@/hooks/useDebounce"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface SearchResult {
  id: string
  department: string
  courseCode: string
  title: string
}

interface ApiError {
  error: string
  details?: any
}

function parseCourseString(courseString: string) {
  const m = courseString
    .trim()
    .toUpperCase()
    .match(/^([A-Z]+)\s*(\d+[A-Z]*)$/)
  return m ? { department: m[1], codeNumber: m[2] } : null
}

async function fetchCourses(q: string): Promise<SearchResult[]> {
  if (q.length < 2) return []
  const res = await fetch(`/api/courses/search?q=${encodeURIComponent(q)}`)
  if (!res.ok) {
    const err: ApiError = await res.json()
    console.error("API Fetch Error:", err)
    throw new Error(err.error || `Failed to fetch courses: ${res.statusText}`)
  }
  return res.json()
}

export default function CourseSearchInput() {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const [selectedValue, setSelectedValue] = useState<SearchResult | null>(null)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [isChecking, setIsChecking] = useState(false)
  const lastSubmittedRef = useRef<{ dept: string; code: string } | null>(null)
  const mouseIsOverList = useRef(false)
  const listRef = useRef<HTMLDivElement>(null)

  const debounced = useDebounce(inputValue, 300)
  const router = useRouter()
  const params = useSearchParams()

  const {
    data: results = [],
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery<SearchResult[], Error>({
    queryKey: ["courseSearch", debounced],
    queryFn: () => fetchCourses(debounced),
    enabled: debounced.length >= 2,
    placeholderData: keepPreviousData,
  })

  const moveDown = () =>
    setHighlightedIndex((prev) =>
      prev < 0 || prev >= results.length - 1 ? 0 : prev + 1
    )

  const moveUp = () =>
    setHighlightedIndex((prev) =>
      prev <= 0 ? results.length - 1 : prev - 1
    )

  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return
    const item = listRef.current.querySelector(`#item-${highlightedIndex}`)
    item?.scrollIntoView({ block: "nearest" })
  }, [highlightedIndex])

  useEffect(() => {
    if (!open) setHighlightedIndex(-1)
  }, [open])

  useEffect(() => {
    if (isChecking) {
      const d = params.get("dept")
      const c = params.get("code")
      const last = lastSubmittedRef.current
      if (last && last.dept === d && last.code === c) {
        setIsChecking(false)
        lastSubmittedRef.current = null
      }
    }
  }, [params, isChecking])

  const doCheck = useCallback(() => {
    if (isChecking) return
    const toParse = selectedValue?.courseCode || inputValue
    const parsed = parseCourseString(toParse)
    if (!parsed) {
      console.warn("Invalid course format for check:", toParse)
      return
    }
    setIsChecking(true)
    setOpen(false)
    lastSubmittedRef.current = { dept: parsed.department, code: parsed.codeNumber }
    router.push(`/?dept=${encodeURIComponent(parsed.department)}&code=${encodeURIComponent(parsed.codeNumber)}`)
  }, [inputValue, selectedValue, router, isChecking])

  const onSelect = (r: SearchResult) => {
    setInputValue(r.courseCode)
    setSelectedValue(r)
    setOpen(false)
    setIsChecking(true)
    const codeNumber = r.courseCode.match(/\d+[A-Z]*/)?.[0] ?? ""
    lastSubmittedRef.current = { dept: r.department, code: codeNumber }
    router.push(`/?dept=${encodeURIComponent(r.department)}&code=${encodeURIComponent(codeNumber)}`)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault()
        doCheck()
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        moveDown()
        break
      case "ArrowUp":
        e.preventDefault()
        moveUp()
        break
      case "Enter":
        e.preventDefault()
        if (highlightedIndex >= 0) {
          onSelect(results[highlightedIndex])
        } else {
          doCheck()
        }
        break
      case "Escape":
        e.preventDefault()
        setOpen(false)
        break
    }
  }

  const handleMouseEnterList = () => {
    mouseIsOverList.current = true
  }

  const handleMouseLeaveList = () => {
    mouseIsOverList.current = false
    setHighlightedIndex(-1)
  }

  const handleBlur = () => {
    setTimeout(() => {
      if (!mouseIsOverList.current && !document.activeElement?.closest("#course-suggestions-listbox")) {
        setOpen(false)
      }
    }, 150)
  }

  return (
    <div className="flex w-full max-w-md items-start space-x-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <Input
              type="text"
              placeholder="Search courses (e.g. CMPUT 174)"
              value={inputValue}
              onChange={(e) => {
                const v = e.target.value
                setInputValue(v)
                setSelectedValue(null)
                setHighlightedIndex(-1)
                setOpen(v.length >= 2)
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
              aria-activedescendant={highlightedIndex >= 0 ? `item-${highlightedIndex}` : undefined}
            />
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
            if ((e.target as HTMLElement)?.closest('[aria-haspopup="listbox"]')) return
            setOpen(false)
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
            {(isLoading || isFetching) && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Loading suggestions…
              </div>
            )}
            {isError && (
              <div className="p-4 text-center text-sm text-red-600">
                Error: {error?.message ?? "Failed to load suggestions"}
              </div>
            )}
            {!isLoading && !isFetching && !isError && results.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                {debounced.length < 2 ? "Type 2+ characters to search" : "No courses found"}
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
                    onMouseDown={(e) => {
                      e.preventDefault()
                      onSelect(r)
                    }}
                    onMouseEnter={() => setHighlightedIndex(i)}
                    className={cn(
                      "flex justify-between px-3 py-2 text-sm cursor-pointer select-none rounded-sm outline-none",
                      highlightedIndex === i && "bg-accent text-accent-foreground"
                    )}
                  >
                    <span className="font-medium">{r.courseCode}</span>
                    <span className="ml-2 text-muted-foreground truncate">
                      {r.title}
                    </span>
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
        className="w-16 flex-shrink-0"
        aria-label="Check prerequisites for the entered or selected course"
        title="Check course prerequisites"
      >
        {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
      </Button>
    </div>
  )
}
