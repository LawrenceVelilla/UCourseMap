Okay, let's break down the files and directories based on the information provided and common Next.js App Router conventions.

**General Concepts:**

- **Server Components (RSC):** The default in the Next.js `app` directory. They run _only_ on the server. Good for data fetching, accessing backend resources directly (like databases), and reducing client-side JavaScript. Cannot use hooks like `useState`, `useEffect`, or browser-only APIs.
- **Client Components:** Opt-in by adding the `'use client';` directive at the top of the file. They render initially on the server (SSR/SSG) and then "hydrate" and run on the client, enabling interactivity. Required for using hooks (`useState`, `useEffect`, `useContext`, etc.), event listeners (`onClick`, `onChange`), and browser APIs.
- **Server Actions:** Functions defined with `'use server';` (often in separate files like `actions.ts` or within components). They allow Client Components to securely call server-side code without manually creating API endpoints.
- **`"server-only"` Package:** A way to mark modules that should _only_ ever be imported by Server Components. Ensures database clients or secret keys don't accidentally leak to the client.

---

**`/app` Directory** (Core application routing and layout)

- **`page.tsx`**:
  - **What it does:** Defines the UI for the root route (`/`) of your application. This is likely the main landing page where users start, probably containing the course search input.
  - **Environment:** Primarily a **Server Component** by default, but it renders Client Components (like `<CourseSearchInput>`).
  - **Why Server?:** Allows fetching initial data directly on the server if needed, potentially improving initial load performance.
  - **Details:** Renders the main page layout and imports necessary components for the homepage.
- **`loading.tsx`**:
  - **What it does:** A Next.js special file that automatically displays its contents as a loading UI while the content for `page.tsx` (and its children) is loading server-side data.
  - **Environment:** **Server Component**.
  - **Why Server?:** Part of the Next.js App Router's streaming and loading UI convention, runs during server rendering.
  - **Details:** Typically contains a simple spinner or skeleton layout.
- **`layout.tsx`**:
  - **What it does:** Defines the root layout structure (like `<html>`, `<body>` tags) that wraps _all_ pages in your application. Sets up global context providers, headers, footers.
  - **Environment:** **Server Component** (but wraps Client Components like Providers).
  - **Why Server?:** Establishes the base HTML structure on the server. Can fetch global data if necessary.
  - **Details:** Essential for setting up global elements like `<ThemeProvider>`, `<QueryProvider>`, `<HeaderNav>`, `<Footer>`.
- **`globals.css`**:
  - **What it does:** Contains global CSS styles applied across the entire application (e.g., base styles, Tailwind directives).
  - **Environment:** Build-time asset (CSS).
  - **Details:** Used for fundamental styling.
- **`actions.ts`**:
  - **What it does:** Likely contains Server Actions – functions intended to run securely on the server, often triggered by form submissions or button clicks in Client Components.
  - **Environment:** **Server-side** functions.
  - **Why Server?:** To perform mutations or actions requiring database access or secure logic without exposing an API endpoint directly.
  - **Details:** Allows Client Components to call server code directly using the `'use server'` mechanism.
- **`opengraph-image.png`**:
  - **What it does:** Image used for link previews when sharing your site on social media (Open Graph protocol).
  - **Environment:** Static Asset.
- **`/api/` Directory**:
  - **What it does:** Holds API route handlers (e.g., `api/courses/search/route.ts`). These are used to create traditional API endpoints that client-side code can fetch from.
  - **Environment:** **Server-side**.
  - **Why Server?:** Needed to provide data to client-side requests, perform server actions initiated by client fetches.
  - **Details:** Your `CourseSearchInput` likely fetches suggestions from an endpoint defined here.
- **`/courses/`, `/classes/`, `/planner/`, `/programs/`, `/signin/` Directories**:
  - **What it does:** Represent different sections (routes) of your application. For example, `/courses/[dept]/[code]/page.tsx` would likely display details for a specific course.
  - **Environment:** Pages (`page.tsx`) within these are **Server Components** by default, used for fetching and displaying data specific to that route.

---

**`/components` Directory** (Reusable UI pieces)

- **`/ui/` Directory**:
  - **What it does:** Contains generic, reusable UI primitives, likely sourced from Shadcn/UI (e.g., Button, Card, Input, Tabs, Popover).
  - **Environment:** Mostly **Client Components** (`'use client';`) because they often require state, event handlers, or browser APIs for interactivity and effects.
  - **Why Client?:** UI elements need browser interaction.
- **`PrerequisiteCheckerForm.tsx`**:
  - **What it does:** A form component, likely related to the main course search input functionality.
  - **Environment:** **Client Component** (`'use client';`).
  - **Why Client?:** Forms require state management (`useState`) for input values and event handlers (`onSubmit`, `onChange`).
- **`theme-switcher.tsx`**:
  - **What it does:** Button or component to toggle between light and dark themes.
  - **Environment:** **Client Component** (`'use client';`).
  - **Why Client?:** Needs `useState` / `useEffect` to manage the current theme and an `onClick` handler to change it, interacting with the `next-themes` context.
- **`theme-provider.tsx`**:
  - **What it does:** Wraps the application (in `layout.tsx`) to provide the theme context from `next-themes`.
  - **Environment:** **Client Component** (`'use client';`).
  - **Why Client?:** Context Providers managing client-side state need to be Client Components.
- **`requirementConditionDisplay.tsx`**:
  - **What it does:** Renders the potentially complex logic of course requirements (AND/OR groups, choices).
  - **Environment:** Likely a **Client Component** (`'use client';`) if it involves interactive elements or complex conditional rendering state, but could be a Server Component if simply displaying passed data structurally. Given its complexity, likely Client.
  - **Why Client?:** May need client-side logic for rendering nested conditions or future interactions.
- **`QueryProvider.tsx`**:
  - **What it does:** Wraps the application (in `layout.tsx`) to provide the `react-query` client context.
  - **Environment:** **Client Component** (`'use client';`).
  - **Why Client?:** `react-query` manages client-side data cache and state.
- **`prerequisiteGraph.tsx`**:
  - **What it does:** Renders the visual graph of course dependencies. Likely uses a library like React Flow.
  - **Environment:** **Client Component** (`'use client';`).
  - **Why Client?:** Graph rendering libraries heavily rely on browser APIs, `useState`/`useEffect`, and event handlers for interactivity (zoom, pan, selection).
- **`headerNav.tsx`**:
  - **What it does:** Displays the main site navigation header.
  - **Environment:** **Client Component** (`'use client';`).
  - **Why Client?:** Likely includes other Client Components like the `<ThemeSwitcher>`, and potentially interactive dropdowns or mobile menu logic.
- **`footer.tsx`**:
  - **What it does:** Displays the site footer.
  - **Environment:** Likely a **Server Component**.
  - **Why Server?:** Footers are often static, containing links or copyright info, not requiring client-side interactivity.
- **`expandableCardContent.tsx`**:
  - **What it does:** A UI component that allows content within a card to be collapsed or expanded.
  - **Environment:** **Client Component** (`'use client';`).
  - **Why Client?:** Needs `useState` to manage the expanded/collapsed state and an `onClick` handler.
- **`CourseSearchInput.tsx`**:
  - **What it does:** The interactive input field where users type course codes, displaying suggestions fetched from the API.
  - **Environment:** **Client Component** (`'use client';`).
  - **Why Client?:** Core interactive element using `useState`, `useEffect`, `useRef`, event handlers (`onChange`, `onKeyDown`, etc.), and client-side data fetching (`useQuery`).
- **`courseResultDisplay.tsx`**:
  - **What it does:** Displays the main content area for a selected course, including details, requirements, and the prerequisite graph.
  - **Environment:** **Client Component** (`'use client';`).
  - **Why Client?:** Integrates other Client Components (like the graph), uses `useEffect` for animations, and handles complex conditional rendering.
- **`courseLinkList.tsx`**:
  - **What it does:** Renders a simple list of links to other courses (e.g., for "Required By" / "Corequisite For" sections).
  - **Environment:** Likely a **Server Component**.
  - **Why Server?:** Simple component primarily focused on rendering data passed via props.
- **`courseInfoWrapper.tsx`**:
  - **What it does:** Acts as a wrapper or container, possibly on the course details page (`/courses/[dept]/[code]/page.tsx`), potentially orchestrating data fetching and layout for child components like `CourseResultDisplay`.
  - **Environment:** Likely a **Server Component**.
  - **Why Server?:** Good place to fetch course data on the server and pass it down to Client Components that need it for rendering.

---

**`/hooks` Directory** (Reusable logic)

- **`useDebounce.ts`**:
  - **What it does:** Custom React hook that delays updating a value until a certain amount of time has passed without changes (useful for search inputs).
  - **Environment:** **Client-side** logic (used within Client Components).
  - **Why Client?:** Relies on `useState` and `useEffect`, which are client-only hooks.

---

**`/data` Directory** (Static data)

- **`*.json` files**:
  - **What it does:** Static JSON files containing raw or parsed course data for various departments.
  - **Environment:** Static Assets.
  - **Details:** Likely used for initial database seeding or potentially as a fallback data source during development.

---

**`/lib` Directory** (Shared code)

- **`utils.ts`**:
  - **What it does:** Contains general utility functions potentially used by both client and server code (e.g., `cn` for class names).
  - **Environment:** **Shared** (Client and Server).
- **`types.ts`**:
  - **What it does:** Defines shared TypeScript types and interfaces (like `Course`, `RequirementsData`).
  - **Environment:** **Shared** (used in both Client and Server code for type safety).
- **`requirements.ts`**:
  - **What it does:** Likely contains helper functions specifically for parsing, interpreting, or formatting course requirement data.
  - **Environment:** **Shared** (could be used server-side during data fetching/processing or client-side for display).
- **`dataPlaceholder.ts`**:
  - **What it does:** Might contain placeholder data structures or functions to generate mock data for loading states or testing.
  - **Environment:** **Shared**.
- **`data.ts`**:
  - **What it does:** Core module for interacting with the database (Prisma). Contains functions to fetch course details, prerequisites (using CTE), related courses, etc.
  - **Environment:** **Server-side ONLY**. Should ideally be marked with `"server-only"`.
  - **Why Server-Only?:** Directly accesses the database (`prisma`) and potentially environment variables (`DATABASE_URL`). This code _must not_ run on the client for security and functionality.
  - **Details:** Uses `PrismaClient`, `cache` for request memoization, raw SQL for the CTE, Zod for validation. This is where the backend data logic lives.

---

This breakdown should give you a good foundation for documenting each file's role and context within your Next.js application!
