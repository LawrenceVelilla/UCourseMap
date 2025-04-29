import { create } from "zustand";
import {
  Program,
  Course,
  RequirementValidationResult,
  CourseStatus,
  RequirementCondition,
} from "../../lib/types";
import { organizeProgram } from "../utils";

interface ProgramPlanState {
  // Program data
  program: Program | null;
  selectedCourses: Map<string, CourseStatus>;
  courseDataMap: Map<string, Course>;
  prerequisiteInfo: Map<string, RequirementCondition | null>;

  // Term planning
  currentTerm: string;
  currentYear: number;

  // Alerts and statuses
  alerts: {
    type: "error" | "warning" | "info" | "success";
    message: string;
    courseCode?: string;
  }[];

  // Program statistics
  completedUnits: number;
  plannedUnits: number;
  remainingUnits: number;

  // Requirement Validation
  requirementStatus: RequirementValidationResult[];

  // Actions
  setProgram: (program: Program) => void;
  loadProgramData: (programName: string) => Promise<void>;
  loadCourseData: (courseCodes: string[]) => Promise<void>;

  // Course selection actions
  addCourse: (courseCode: string, status: CourseStatus) => void;
  removeCourse: (courseCode: string) => void;
  updateCourseStatus: (courseCode: string, status: Partial<CourseStatus>) => void;

  // Validation and analysis
  fetchPrerequisitesForCourse: (courseCode: string) => Promise<void>;
  checkPrerequisites: (courseCode: string) => boolean;
  checkProgramProgress: () => void;

  // Clear state
  resetState: () => void;
}

// Track in-flight requests to prevent duplicate fetches
const inFlightRequests = new Set<string>();

// Helper to get course units (with default)
const getCourseUnits = (course: Course | undefined): number => {
  return course?.units?.credits || 3; // Default to 3 if not specified
};

export const useProgramPlanStore = create<ProgramPlanState>((set, get) => ({
  // Initial state
  program: null,
  selectedCourses: new Map(),
  courseDataMap: new Map(),
  prerequisiteInfo: new Map(),
  currentTerm: "Fall",
  currentYear: new Date().getFullYear(),
  alerts: [],
  completedUnits: 0,
  plannedUnits: 0,
  remainingUnits: 0,
  requirementStatus: [],

  // Program loading functions
  setProgram: (program: Program) => {
    const organizedProgram = organizeProgram(program);
    set({
      program: organizedProgram,
      requirementStatus: [],
      completedUnits: 0,
      plannedUnits: 0,
      remainingUnits: 0,
      selectedCourses: new Map(),
      prerequisiteInfo: new Map(),
      alerts: [],
    });
    get().checkProgramProgress();
  },

  loadProgramData: async (programName: string) => {
    // --- TEMPORARY: Load from public JSON file ---
    console.log(
      `Attempting to load program from public/program_requirements_structured.json (ignoring input: ${programName})`,
    );
    try {
      const response = await fetch(`/program_requirements_structured.json`); // Fetch the specific file
      if (!response.ok) {
        throw new Error(`Failed to fetch program JSON: ${response.status} ${response.statusText}`);
      }
      const programData: Program = await response.json();

      // Assuming the JSON structure matches the Program type directly
      console.log("Successfully fetched program JSON, processing...");

      // Extract course codes from the fetched program data
      const courseCodes = new Set<string>();
      programData.blocks?.forEach((block) => {
        block.groups?.forEach((group) => {
          group.courses?.forEach((course) => {
            if (course.courseCode) courseCodes.add(course.courseCode);
          });
        });
      });

      // Load course data only if needed (assuming course data isn't embedded in program JSON)
      if (courseCodes.size > 0) {
        await get().loadCourseData(Array.from(courseCodes));
      }

      // Set the program state *after* fetching and potentially loading course data
      get().setProgram(programData);

      // Optional: Trigger prerequisite fetching for initially selected courses if any
      // (This part remains the same)
    } catch (error) {
      set((state) => ({
        alerts: [
          ...state.alerts,
          {
            type: "error",
            message: `Failed to load program from JSON: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      }));
      // Ensure program state is null if loading fails
      set({ program: null });
    }
    // --- END TEMPORARY ---

    /* --- ORIGINAL API Fetch Logic (Keep commented out for now) ---
      try {
         const programRes = await fetch(`/api/programs/${encodeURIComponent(programName)}`);
         // ... rest of original API logic ...
      } catch (error) {
          // ... error handling ...
      }
      */
  },

  // Keep async for interface compatibility, return resolved promise in stub
  loadCourseData: async (courseCodes: string[]) => {
    console.log(`[Store] loadCourseData called for: ${courseCodes.join(", ")}`);
    if (courseCodes.length === 0) return Promise.resolve(); // Return resolved promise

    // Only fetch courses not already in the courseDataMap and not currently being fetched
    const codesToFetch = courseCodes.filter(
      (code) => !get().courseDataMap.has(code) && !inFlightRequests.has(`course:${code}`),
    );

    if (codesToFetch.length === 0) return;

    // Create a request key to track this batch request
    const batchRequestKey = `batch:${codesToFetch.join(",")}`;

    // If this exact batch is already in flight, don't duplicate
    if (inFlightRequests.has(batchRequestKey)) {
      console.log(`Skipping duplicate batch request for: ${codesToFetch.join(", ")}`);
      return;
    }

    try {
      // Mark these as in-flight
      inFlightRequests.add(batchRequestKey);
      codesToFetch.forEach((code) => inFlightRequests.add(`course:${code}`));
      console.log(`[Store] loadCourseData: Marked in-flight: ${batchRequestKey}`);

      // TEMPORARY: For now, just simulate a successful response with empty data
      // to prevent infinite loops while the API is being developed
      console.log(`Temporary stub: Simulating fetch for course data: ${codesToFetch.join(", ")}`);

      // Instead of actually fetching, create empty placeholder data
      set((state) => {
        const newCourseDataMap = new Map(state.courseDataMap);
        const newPrerequisiteInfo = new Map(state.prerequisiteInfo);

        codesToFetch.forEach((code) => {
          // Create minimal placeholder data
          const placeholderCourse = {
            courseCode: code,
            department: code.split(" ")[0] || "",
            title: `${code} (Placeholder)`,
            units: { credits: 3, feeIndex: 1, term: "both" },
            keywords: [],
            requirements: { prerequisites: undefined, corequisites: undefined, notes: null },
            flattenedPrerequisites: [],
            flattenedCorequisites: [],
            url: null,
            updatedAt: new Date().toISOString(),
          };

          newCourseDataMap.set(code, placeholderCourse);
          // Also set prerequisite info to null (no prerequisites)
          newPrerequisiteInfo.set(code, null);
        });

        return {
          courseDataMap: newCourseDataMap,
          prerequisiteInfo: newPrerequisiteInfo,
        };
      });

      /* ORIGINAL API CALL LOGIC
      const response = await fetch('/api/courses/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseCodes: codesToFetch })
      });
      
      if (!response.ok) throw new Error(`Failed to load course data: ${response.statusText}`);
      const courseData: Course[] = await response.json();
      
      set(state => {
          const newCourseDataMap = new Map(state.courseDataMap);
          const newPrerequisiteInfo = new Map(state.prerequisiteInfo);
          courseData.forEach(course => {
              if (course.courseCode) {
                 newCourseDataMap.set(course.courseCode, course);
                 newPrerequisiteInfo.set(course.courseCode, course.requirements?.prerequisites || null);
              }
          });
          return { 
            courseDataMap: newCourseDataMap, 
            prerequisiteInfo: newPrerequisiteInfo
          };
      });
      */
    } catch (error) {
      console.error("Error in loadCourseData:", error);
      set((state) => ({
        alerts: [
          ...state.alerts,
          {
            type: "error",
            message: `Failed to load course data: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      }));
    } finally {
      // Clean up tracking regardless of success/failure
      console.log(
        `[Store] loadCourseData: Cleaning up inFlight requests for batch ${batchRequestKey}`,
      );
      inFlightRequests.delete(batchRequestKey);
      codesToFetch.forEach((code) => inFlightRequests.delete(`course:${code}`));
    }

    // Add return at the end of stubbed logic
    return Promise.resolve();
  },

  // Course selection actions
  addCourse: (courseCode: string, status: CourseStatus) => {
    console.log(`[Store] addCourse called for: ${courseCode}`);
    const courseExists = get().courseDataMap.has(courseCode);
    if (!courseExists) {
      console.warn(`Data for course ${courseCode} not loaded. Adding without full details.`);
    }

    set((state) => {
      const newSelectedCourses = new Map(state.selectedCourses);
      newSelectedCourses.set(courseCode, status);
      return { selectedCourses: newSelectedCourses };
    });

    if (!get().prerequisiteInfo.has(courseCode)) {
      console.log(`[Store] addCourse -> calling fetchPrerequisitesForCourse for ${courseCode}`);
      void get().fetchPrerequisitesForCourse(courseCode);
    }

    console.log(`[Store] addCourse -> calling checkProgramProgress for ${courseCode}`);
    get().checkProgramProgress();
  },

  removeCourse: (courseCode: string) => {
    set((state) => {
      const newSelectedCourses = new Map(state.selectedCourses);
      const newPrerequisiteInfo = new Map(state.prerequisiteInfo);
      newSelectedCourses.delete(courseCode);
      newPrerequisiteInfo.delete(courseCode);
      return {
        selectedCourses: newSelectedCourses,
        prerequisiteInfo: newPrerequisiteInfo,
      };
    });

    get().checkProgramProgress();
  },

  updateCourseStatus: (courseCode: string, statusUpdate: Partial<CourseStatus>) => {
    console.log(`[Store] updateCourseStatus called for: ${courseCode}`, statusUpdate);
    set((state) => {
      const newSelectedCourses = new Map(state.selectedCourses);
      const currentStatus = newSelectedCourses.get(courseCode);
      if (!currentStatus) {
        console.warn(`Attempted to update status for non-selected course: ${courseCode}`);
        return {};
      }
      newSelectedCourses.set(courseCode, { ...currentStatus, ...statusUpdate });
      return { selectedCourses: newSelectedCourses };
    });

    console.log(`[Store] updateCourseStatus -> calling checkProgramProgress for ${courseCode}`);
    get().checkProgramProgress();
  },

  // Validation functions
  fetchPrerequisitesForCourse: async (courseCode: string) => {
    console.log(`[Store] fetchPrerequisitesForCourse called for: ${courseCode}`);
    // Skip if already fetched or currently being fetched
    if (get().prerequisiteInfo.has(courseCode)) {
      console.log(
        `[Store] fetchPrerequisitesForCourse: Prereqs already exist for ${courseCode}. Skipping.`,
      );
      return;
    }

    if (inFlightRequests.has(`prereq:${courseCode}`)) {
      console.log(
        `[Store] fetchPrerequisitesForCourse: Prereq fetch already in flight for ${courseCode}. Skipping.`,
      );
      return;
    }

    try {
      // Mark this prereq fetch as in-flight
      inFlightRequests.add(`prereq:${courseCode}`);

      const course = get().courseDataMap.get(courseCode);
      if (course) {
        // Course data already exists, just extract prerequisites
        console.log(
          `[Store] fetchPrerequisitesForCourse: Course data exists for ${courseCode}. Extracting prereqs.`,
        );
        set((state) => {
          const newPrerequisiteInfo = new Map(state.prerequisiteInfo);
          newPrerequisiteInfo.set(courseCode, course.requirements?.prerequisites || null);
          return { prerequisiteInfo: newPrerequisiteInfo };
        });
        return;
      }

      // Await loadCourseData again
      console.log(
        `[Store] fetchPrerequisitesForCourse: Course data missing for ${courseCode}. Calling loadCourseData.`,
      );
      await get().loadCourseData([courseCode]);
    } catch (error) {
      console.error(`Error fetching prerequisites for ${courseCode}:`, error);
      // Still set prerequisiteInfo to null so we don't keep trying
      set((state) => {
        const newPrerequisiteInfo = new Map(state.prerequisiteInfo);
        newPrerequisiteInfo.set(courseCode, null); // No prerequisites (or failed to fetch)
        return { prerequisiteInfo: newPrerequisiteInfo };
      });
    } finally {
      // Clean up tracking
      console.log(
        `[Store] fetchPrerequisitesForCourse: Cleaning up inFlight request for ${courseCode}.`,
      );
      inFlightRequests.delete(`prereq:${courseCode}`);
    }
  },

  checkPrerequisites: (courseCode: string) => {
    const prereqs = get().prerequisiteInfo.get(courseCode);
    if (!prereqs) {
      console.warn(`Prerequisites for ${courseCode} not loaded, cannot check.`);
      return true;
    }

    console.warn(`Prerequisite checking for ${courseCode} not fully implemented.`);
    return true;
  },

  checkProgramProgress: () => {
    console.log("[Store] checkProgramProgress called");
    const { program, selectedCourses, courseDataMap } = get();
    if (!program) {
      set({ completedUnits: 0, plannedUnits: 0, remainingUnits: 0, requirementStatus: [] });
      return;
    }

    let calculatedCompletedUnits = 0;
    let calculatedPlannedUnits = 0;
    const validationResults: RequirementValidationResult[] = [];
    let totalProgramUnitsRequired = 0;

    selectedCourses.forEach((statusInfo, courseCode) => {
      const course = courseDataMap.get(courseCode);
      const units = getCourseUnits(course);
      if (statusInfo.status === "completed") {
        calculatedCompletedUnits += units;
      } else if (statusInfo.status === "planned" || statusInfo.status === "in-progress") {
        calculatedPlannedUnits += units;
      }
    });

    program.categories?.forEach((category) => {
      category.blocks?.forEach((blockId) => {
        const blockIndex = parseInt(blockId.replace("block-", ""), 10);
        if (isNaN(blockIndex) || blockIndex < 0 || blockIndex >= program.blocks.length) return;
        const block = program.blocks[blockIndex];
        if (!block || block.blockType === "category") return;

        block.groups?.forEach((group, groupIndex) => {
          const groupRequirementId = `${blockId}-group-${groupIndex}`;
          const requiredUnits = group.unitsRequired;

          if (typeof requiredUnits === "number" && requiredUnits > 0) {
            totalProgramUnitsRequired += requiredUnits;
            let achievedUnits = 0;
            const groupCourseCodes = new Set(group.courses.map((c) => c.courseCode));
            const relevantCourses: RequirementValidationResult["relevantCourses"] = [];

            selectedCourses.forEach((statusInfo, courseCode) => {
              if (groupCourseCodes.has(courseCode)) {
                const course = courseDataMap.get(courseCode);
                const units = getCourseUnits(course);
                relevantCourses.push({ courseCode, status: statusInfo.status, units });
                if (statusInfo.status === "completed") {
                  achievedUnits += units;
                }
              }
            });

            let status: RequirementValidationResult["status"];
            if (achievedUnits >= requiredUnits) {
              status = "met";
            } else if (achievedUnits > 0) {
              status = "partially-met";
            } else {
              status = "unmet";
            }

            validationResults.push({
              requirementId: groupRequirementId,
              description: group.groupTitle || block.title || "Requirement Group",
              status: status,
              achievedUnits: achievedUnits,
              requiredUnits: requiredUnits,
              relevantCourses: relevantCourses,
            });
          }
        });
      });
    });

    const calculatedRemainingUnits = Math.max(
      0,
      totalProgramUnitsRequired - calculatedCompletedUnits,
    );

    set({
      completedUnits: calculatedCompletedUnits,
      plannedUnits: calculatedPlannedUnits,
      remainingUnits: calculatedRemainingUnits,
      requirementStatus: validationResults,
    });
  },

  resetState: () => {
    console.log("[Store] resetState called");
    set({
      program: null,
      selectedCourses: new Map(),
      courseDataMap: new Map(),
      prerequisiteInfo: new Map(),
      alerts: [],
      completedUnits: 0,
      plannedUnits: 0,
      remainingUnits: 0,
      requirementStatus: [],
    });
  },
}));
