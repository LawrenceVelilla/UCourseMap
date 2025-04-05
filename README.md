# UniPlanner 🎓✨

**Simplify your university course planning!** UniPlanner helps students visualize course prerequisites and corequisites, making academic planning easier and less error-prone. Initially built for the University of Alberta (UofA), where navigating the course catalogue manually can be challenging.


## The Problem

Manually checking the course catalogue for prerequisites at universities like UofA is time-consuming and complex, especially for programs with intricate dependency chains (like Computer Science). It's easy to miss requirements or struggle to visualize the optimal path through a degree.

## The Solution

UniPlanner provides a user-friendly web interface to:

*   **Browse Courses:** View detailed information for courses within specific departments.
*   **Visualize Prerequisites:** See requirements clearly displayed in both:
    *   A structured **List Format** (showing AND/OR logic).
    *   An interactive **Node-Based Graph** showing course dependencies visually.
*   **Accurate Data:** Leverages scraped data from the official course catalogue, parsed intelligently to extract requirement structures.

**MVP Focus:** University of Alberta - Computer Science (CMPUT) department.

## Key Features (MVP)

*   Detailed view for individual CMPUT courses (Title, Code, Units, Description, Requirements).
*   Structured list display of prerequisites and corequisites.
*   Interactive prerequisite graph visualization.
*   Data populated from scraped and parsed UofA catalogue information.

## Tech Stack

*   **Framework:** Next.js (App Router)
*   **Language:** TypeScript
*   **UI Library:** React
*   **Styling:** Tailwind CSS
*   **Database:** Supabase (PostgreSQL)
*   **ORM:** Prisma
*   **Data Parsing:** OpenAI API (for initial structured requirement extraction) 
*   **Graph Visualization:** React Flow (or specify your chosen library) --> To be implemented
*   **Deployment:** Vercel / Netlify (specify yours)

## Getting Started

Follow these steps to set up the project locally:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/uniplanner.git
    cd uniplanner
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install / pnpm install
    ```
3.  **Set up Environment Variables:**
    *   Create a `.env` file in the project root.
    *   Copy the contents of `.env.example` (create this file if it doesn't exist) into `.env`.
    *   Fill in the required values:
        *   `DATABASE_URL`: Your PostgreSQL connection string from Supabase (Project Settings > Database > Connection string > URI).
        *   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL (Project Settings > API).
        *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon (public) Key (Project Settings > API).
        *   `OPENAI_API_KEY`: Your OpenAI API key (if running the parser).
        *   *(Add any other required keys)*
4.  **Set up Supabase Database:**
    *   Ensure you have a Supabase project created.
    *   The necessary table schema is defined in `prisma/schema.prisma`.
5.  **Apply Database Migrations:**
    ```bash
    npx prisma migrate dev
    ```
    *(This will create the `courses` table based on the schema)*
6.  **Generate Prisma Client:**
    ```bash
    npx prisma generate
    ```
7.  **Seed the Database:**
    *   Ensure your parsed course data JSON (e.g., `data/parsed_courses.json`) exists.
    *   Run the seeding script (adjust script name/path if needed):
        ```bash
        npm run db:load
        # or: npx ts-node ./scripts/loadCourses.ts
        ```
8.  **Run the Development Server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## Future Development

*   Expand data coverage to more UofA departments (BIOL, CHEM, MATH, etc.).
*   Implement user accounts (Supabase Auth) for saving course plans.
*   Develop an AI assistant for course recommendations and planning queries.
*   Add advanced search and filtering capabilities.
*   (Potentially) Add professor information and internal rating system.

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request. (Add more specific guidelines if desired).


