# UniPlanner - Project Overview & Plan

**1. Project Title:** UniPlanner

**2. Mission / Vision:**

To streamline and simplify the academic course planning process for university students by providing a clear, intuitive, and interactive platform to visualize course dependencies (prerequisites and corequisites), ultimately reducing student stress and improving academic decision-making. Initially focused on the University of Alberta.

**3. Problem Statement:**

Students at universities like the University of Alberta lack official, integrated tools for planning their course schedules based on prerequisite requirements. They must manually cross-reference the dense, text-based course catalogue, leading to potential errors, wasted time, and difficulty visualizing long-term degree paths, especially in complex programs like Computer Science.

**4. Proposed Solution:**

UniPlanner is a web application that scrapes, parses, and stores university course information, focusing on prerequisites and corequisites. It presents this information in user-friendly formats:

- **Detailed Course View:** Showing title, code, description, units, and structured requirements.
- **List View:** Clear, nested display of AND/OR prerequisite/corequisite conditions.
- **Node-Based Graph View:** Interactive visualization of course dependencies, showing how courses connect.
    
    The application aims to be the go-to resource for UofA students to understand course pathways efficiently.
    

**5. Target Audience:**

- **MVP:** University of Alberta (UofA) Computer Science (CMPUT) undergraduate students.
- **Future:** Expand to other UofA departments (BIOL, CHEM, PHYSL, PHYS, MATH, STATS), other universities, and potentially graduate courses.

**6. Core Features:**

- **MVP:**
    - **Data:** UofA Computer Science (CMPUT) course catalogue data.
    - **Display:** Course Detail Page showing title, code, units, parsed description, requirements (list format).
    - **Visualization:** Interactive node-based graph display of prerequisites for a selected course.
    - **Data Source:** Scraped official UofA course catalogue.
    - **Technology:** Web application built with Next.js and Supabase (PostgreSQL).
- **Future / Potential:**
    - **Expanded Data:** Include multiple UofA departments and potentially other universities.
    - **User Accounts:** Allow users to sign up/log in (using Supabase Auth) to save their completed courses and planned courses.
    - **Plan Validation:** Check if a user's planned sequence meets prerequisite requirements.
    - **AI Assistant:** A chatbot to answer questions like "What courses do I need for AI specialization?", "Recommend courses based on my interests", "Can I take CMPUT 301 next semester?". (Leveraging course data, potentially embeddings).
    - **Professor Information:** Display historical instructors for courses and potentially link to ratings (Note: Caution regarding RateMyProf scraping ToS; internal ratings might be safer).
    - **Advanced Search/Filtering:** Search by course code, title, keywords within descriptions, required prerequisites, etc.
    - **Degree Plan Templates:** Pre-defined templates for common degree programs/specializations.

**7. Technical Architecture & Stack:**

- **Frontend Framework:** Next.js (App Router) with React & TypeScript. Leveraging Server Components for data fetching.
- **Backend API:** Next.js API Routes / Route Handlers (built-in).
- **Database:** Supabase (PostgreSQL). Chosen for its relational capabilities (handling course relationships), excellent JSONB support (for units and requirements), and integrated BaaS features (Auth, Storage - if needed later).
- **ORM:** Prisma. Used for type-safe database access, schema migrations, and easier database interactions in the seeding script and backend logic. Connects via DATABASE_URL.
- **Data Processing:**
    - Scraper: Custom script (Node.js/Python) to fetch raw data from the UofA catalogue.
    - Parser: Custom script leveraging OpenAI API (initially) to parse free-text descriptions into structured requirements JSON.
    - Seeding Script: Node.js script (scripts/loadCourses.ts) using Prisma to populate the Supabase DB from parsed JSON data.
- **(Potentially Removed/Simplified):** Supabase Storage was considered for parsedDescription and requirements due to initial (incorrect) size estimates. Based on confirmed small data size (~280KB for 185 courses incl. descriptions), these are now planned to be stored **directly in the PostgreSQL database** (TEXT and JSONB columns respectively). Supabase Storage *could* still be used for rawDescription backup or future file uploads.
- **Styling:** Tailwind CSS (likely provided by Next.js template), potentially a component library (e.g., Shadcn/ui, Mantine).
- **Graph Visualization:** Client-side JavaScript library (e.g., React Flow, Cytoscape.js).
- **Hosting:** Vercel or Netlify (recommended for Next.js applications).

**8. Data Flow (Simplified):**

1. **Offline:** Scraper fetches HTML -> Parser processes text (using OpenAI?) -> Outputs structured JSON course data.
2. **Offline:** Seeding Script (loadCourses.ts with Prisma) reads JSON -> Upserts data into Supabase PostgreSQL DB.
3. **Online (User Request):** User accesses Next.js page -> Server Component/API Route uses Prisma (lib/data.ts) -> Queries Supabase DB -> Data returned to component -> React renders UI (including PrerequisiteList, potentially graph component).

**9. Project Plan / Roadmap (MVP Focus):**

1. ✅ **Setup:** Initialize Next.js (with-supabase template), set up Supabase project, configure Prisma, set up environment variables.
2. ✅ **Schema Design:** Define Course model in prisma/schema.prisma (Final Decision: Keep parsedDescriptionTEXT and requirements JSONB in DB, use UUIDs, include updatedAt).
3. ✅ **Scraping/Parsing:** Refine existing scripts to output JSON matching the final schema.
4. ✅ **Seeding Script:** Develop/Refine scripts/loadCourses.ts using Prisma upsert to handle initial load and semesterly updates. Ensure it populates all necessary fields (incl. parsedDescription, requirements).
5. ✅ **Database Seeding:** Run the script to populate the DB with initial UofA CS course data.
6. **Backend Data Fetching:** Implement functions in lib/data.ts using Prisma to getCoursesByDepartment and getCourseDetails.
7. **API Routes (Optional but Recommended):** Create API routes (app/api/...) that utilize the lib/data.ts functions.
8. **Frontend - Course Detail Page:** Build app/courses/[department]/[courseCode]/page.tsx (Server Component) using getCourseDetails. Display title, code, units, parsedDescription.
9. **Frontend - Prerequisite List Component:** Build components/PrerequisiteList.tsx to recursively render the requirements JSON prop received from the detail page.
10. **Frontend - Course List Page:** Build app/courses/[department]/page.tsx (Server Component) using getCoursesByDepartment to display a list of courses linking to detail pages.
11. **Frontend - Node Graph Visualization:** Integrate a library (e.g., React Flow) into the Course Detail Page to visualize data fetched (potentially requiring a dedicated data-fetching function in lib/data.ts or an API route).
12. **Styling & UI Polish:** Apply consistent styling using Tailwind/component library.
13. **Deployment:** Deploy the application to Vercel/Netlify.
14. **Testing & Refinement:** Test core functionality, fix bugs.

**10. Key Decisions & Insights Log:**

- **Database:** Supabase/PostgreSQL selected over NoSQL (MongoDB) due to the inherently relational nature of course prerequisites. SQL queries and JSONB support are advantageous.
- **Backend:** Integrated Next.js API Routes preferred over a separate Express server for simplicity within the Next.js ecosystem.
- **ORM:** Prisma adopted for type safety, migrations, and developer experience when interacting with the database.
- **ID Strategy:** UUIDs chosen over sequential integers for IDs to prevent guessability if IDs are exposed externally.
- **Data Storage Strategy (Evolution):**
    - Initial concern: High storage usage (~60MB/20 courses) potentially caused by large text descriptions.
    - Plan A: Move descriptions to Supabase Storage.
    - Plan B: Move both descriptions AND requirements JSON to Storage due to estimates still exceeding free tier.
    - **Final Decision:** Actual measurement showed DB size *with* requirements but *without* descriptions was very small (~200KB/185 courses). Further measurement showed size *with* parsedDescription and requirementswas also very small (~280KB/185 courses). **Conclusion: Store parsedDescription (TEXT) and requirements (JSONB) directly in the PostgreSQL database.** Only rawDescription (if stored at all) or future large user uploads would necessitate Supabase Storage. This significantly simplifies the architecture.
- **Professor Ratings:** Scraping RateMyProf is discouraged due to ToS violations. Consider internal ratings or linking carefully.
- **Updating:** Semesterly updates planned using the seeding script's upsert functionality, tracked via the updatedAttimestamp.

**11. Next Steps (Immediate):**

1. Ensure schema.prisma reflects the final decision (includes parsedDescription, requirements; excludes storage paths). Run prisma migrate dev.
2. Modify/verify scripts/loadCourses.ts uploads data matching the final schema (including parsedDescription and requirements JSON). Re-seed database if necessary.
3. Begin implementing data fetching logic in lib/data.ts.
4. Start building the core frontend components: CourseDetailPage, PrerequisiteList, Course List Page.

---

This document should serve as a solid foundation for your Notion page and guide your development process!