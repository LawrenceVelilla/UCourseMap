# University Program Planner - Feature Implementation Plan

## Goal:

Develop a dedicated "Plan Builder" view that allows users to see their selected courses, check if their selections meet program requirements (including complex choice-based rules), and visualize prerequisite dependencies.

## Core Components Involved:

- `components/ProgramViewer.tsx`: (Minor changes, primarily for context/selection)
- `components/PlanBuilder.tsx`: (New component for plan viewing and validation)
- `utils/store/programPlanStore.ts`: (Central state management, requires new selectors/logic)
- `lib/types.ts`: (May need minor adjustments or verification)
- Data Fetching Logic: (New or existing functions to get prerequisite data)

## Phase 1: Requirement Validation

1.  **Define Requirement Validation Logic:**

    - **Location:** Primarily within `utils/store/programPlanStore.ts` as selectors or derived state, potentially using helper functions.
    - **Task:** Create functions/selectors that take the `program` structure (categories, blocks, groups with `unitsRequired`) and the `selectedCourses` map as input.
    - **Functionality:**
      - Iterate through each requirement category/block/group in the `program`.
      - For each requirement, identify the relevant courses selected by the user (`selectedCourses`) that belong to that requirement group.
      - Calculate the total units (or course count) achieved for that requirement based on the status ('completed' or potentially 'in-progress'/'planned' depending on desired strictness) of the selected courses.
      - Compare the achieved units/count against the `unitsRequired` (or implicit course count) for that requirement.
      - Handle different requirement types (e.g., specific course required, X units from a list, options within a block).
    - **Output:** A data structure representing the validation status of each requirement (e.g., `{ requirementId: 'block-1-group-0', status: 'met' | 'partially-met' | 'unmet', achievedUnits: 3, requiredUnits: 3 }`).

2.  **Implement Requirement Validation UI:**
    - **Location:** Inside the "Requirement Check" section of `components/PlanBuilder.tsx`.
    - **Task:** Consume the validation status data generated in Step 1.
    - **Functionality:**
      - Display a list or summary of program requirements.
      - For each requirement, show its status (e.g., using icons like checkmarks/crosses, color-coding).
      - Clearly indicate which requirements are met, partially met, or unmet.
      - Show achieved vs. required units/courses for clarity.
      - Provide helpful messages for unmet requirements (e.g., "Need 3 more units from Core Electives").

## Phase 2: Prerequisite Visualization

1.  **Develop Prerequisite Data Fetching:**

    - **Location:** Potentially new functions in `lib/data.ts` or a dedicated API endpoint.
    - **Task:** Create a function or endpoint that accepts a list of course codes (from `selectedCourses`).
    - **Functionality:**
      - For each course code, query the database or data source to retrieve its prerequisite information (likely referencing the `requirements` field in the `Course` type, which seems to have a nested structure).
      - Consider fetching recursively if multi-level prerequisites need to be displayed.
      - Handle cases where prerequisite data might be missing or is just text.
    - **Output:** A structured representation of the prerequisites for the selected courses (e.g., a map where keys are course codes and values are their prerequisite trees/lists).

2.  **Implement Prerequisite Visualization UI:**
    - **Location:** Inside the "Prerequisite View" section of `components/PlanBuilder.tsx`.
    - **Task:** Consume the fetched prerequisite data.
    - **Functionality:**
      - Choose a visualization method:
        - **Simple List:** Display prerequisites as text under each selected course.
        - **Tree/Graph:** Use a library (like React Flow, which seems to be used elsewhere based on `lib/types.ts`) to render a visual dependency graph. This is more complex but provides a clearer hierarchy.
      - Clearly link prerequisites to the courses they belong to.
      - Potentially highlight met vs. unmet prerequisites based on the user's `selectedCourses` and their statuses.

## Phase 3: Refinements & Integration

1.  **Integrate Components:**

    - Ensure `ProgramViewer` and `PlanBuilder` are correctly placed within the application UI (e.g., using tabs).
    - Verify that state changes made in one component (e.g., selecting a course in `ProgramViewer`, removing in `PlanBuilder`) are reflected correctly in the other via the Zustand store.

2.  **Refactor Block ID Lookup (Optional but Recommended):**

    - **Location:** `lib/types.ts`, data generation/fetching logic, `components/ProgramViewer.tsx`.
    - **Task:** Add a unique `id` field (e.g., string UUID) to the `ProgramBlock` interface in `lib/types.ts`.
    - **Functionality:**
      - Modify the data source/processing logic to assign unique IDs to blocks.
      - Update `program.categories[].blocks` to store these unique IDs instead of `"block-<index>"`.
      - Change the lookup logic in `ProgramViewer` to use `program.blocks.find(b => b.id === blockId)`.

3.  **Testing and UX Improvements:**
    - Test thoroughly with different program structures and user selections.
    - Gather feedback on the usability of both views.
    - Refine UI elements, loading states, and error handling.
