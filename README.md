# UniPlanner - University of Alberta Course Planner & Prerequisite Checker

**(Placeholder: Add a cool banner image or GIF showing the app in action here)**

## Overview

UniPlanner is a web application designed to help University of Alberta students navigate course selection and academic planning. Its core feature is an interactive prerequisite checker that allows users to:

- Search for any UofA course.
- View detailed course information (title, description, units).
- See accurately parsed prerequisite and corequisite requirements in a clear, nested list format, handling complex AND/OR logic.
- Visualize course dependencies through an automatically generated, multi-level prerequisite graph.

**(Placeholder: Add screenshot of the main checker interface - search bar, list results, graph section)**

This tool aims to demystify course planning by providing readily accessible and easy-to-understand requirement information, sourced directly from publicly available UofA data.

## Features

- **Course Search:** Enter a course code (e.g., "CMPUT 272") to fetch details.
- **Detailed Prerequisite/Corequisite Lists:** Accurately displays complex requirements using nested AND/OR logic, including text-based requirements (e.g., "Any 300-level course").
    
    **(Placeholder: Add screenshot focusing on the detailed RequirementConditionDisplay list for a complex course)**
    
- **Interactive Prerequisite Graph:** Visualizes the dependency tree for prerequisites, showing multiple levels of requirements. Uses automatic layout for clarity. Handles text-based prerequisites as terminal nodes.
    
    **(Placeholder: Add screenshot or short GIF/video of the React Flow graph rendering and laying out)**
    
- **Responsive Design:** Basic layout adapts for desktop (with sidebar) and mobile use.
- **Server-Side Rendering:** Leverages Next.js App Router for efficient data fetching and rendering.

## Technology Stack

- **Framework:** [**Next.js**](https://www.google.com/url?sa=E&q=https%3A%2F%2Fnextjs.org%2F) (App Router)
- **Language:** [**TypeScript**](https://www.google.com/url?sa=E&q=https%3A%2F%2Fwww.typescriptlang.org%2F)
- **Database:** [**Supabase**](https://www.google.com/url?sa=E&q=https%3A%2F%2Fsupabase.com%2F) (PostgreSQL)
- **ORM:** [**Prisma**](https://www.google.com/url?sa=E&q=https%3A%2F%2Fwww.prisma.io%2F)
- **UI:** [**React**](https://www.google.com/url?sa=E&q=https%3A%2F%2Freactjs.org%2F)
- **Component Library:** [**Shadcn/UI**](https://www.google.com/url?sa=E&q=https%3A%2F%2Fui.shadcn.com%2F)
- **Styling:** [**Tailwind CSS**](https://www.google.com/url?sa=E&q=https%3A%2F%2Ftailwindcss.com%2F)
- **Graph Visualization:** [**@xyflow/react**](https://www.google.com/url?sa=E&q=https%3A%2F%2Freactflow.dev%2F) (React Flow v11+)
- **Graph Layout:** [**Dagre**](https://www.google.com/url?sa=E&q=https%3A%2F%2Fgithub.com%2Fdagrejs%2Fdagre)
- **Deployment:** [**Vercel**](https://www.google.com/url?sa=E&q=https%3A%2F%2Fvercel.com%2F)

## Getting Started

*(Instructions for local setup)*

1. **Clone the repository:**
    
    `git clone https://github.com/LawrenceVelilla/Web-Project.git
    cd Web-Project`
    
    Use code [**with caution**](https://support.google.com/legal/answer/13505487).Bash
    
2. **Install dependencies:**
    
    `npm install
    # or
    yarn install`
    
    Use code [**with caution**](https://support.google.com/legal/answer/13505487).Bash
    
3. **Set up Supabase:**
    - Create a Supabase project.
    - Get your database connection string (using the pooler).
    - Set up your database schema (use prisma/schema.prisma).
4. **Environment Variables:**
    - Create a .env.local file in the root directory.
    - Add your Supabase connection string:
        
        `DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[YOUR-SUPABASE-HOST]:6543/postgres?pgbouncer=true&connection_limit=1"`
        
        Use code [**with caution**](https://support.google.com/legal/answer/13505487).Env
        
        *(Note: Use port 6543 for the pooler)*
        
5. **Apply Database Migrations:**
    
    `npx prisma migrate dev`
    
    Use code [**with caution**](https://support.google.com/legal/answer/13505487).Bash
    
6. **(Optional) Seed Database:** If you have seeding scripts, run them. (You'll need to add instructions here if applicable).
7. **Run the development server:**
    
    `npm run dev
    # or
    yarn dev`
    
    Use code [**with caution**](https://support.google.com/legal/answer/13505487).Bash
    
8. Open [**http://localhost:3000**](https://www.google.com/url?sa=E&q=http%3A%2F%2Flocalhost%3A3000) in your browser.

## Project Structure (Key Areas)

- app/prerequisites/page.tsx: Main interactive checker page (Server Component).
- components/PrerequisiteGraph.tsx: React Flow graph rendering (Client Component).
- components/RequirementConditionDisplay.tsx: Recursive list display for requirements.
- components/PrerequisiteCheckerForm.tsx: User input form (Client Component).
- lib/data.ts: Server-side data fetching logic using Prisma (getCourseAndPrerequisiteData, getRecursivePrerequisites).
- lib/types.ts: Core TypeScript type definitions (Course, RequirementCondition, etc.).
- prisma/schema.prisma: Database schema definition.

## Future Enhancements (Roadmap)

- Visual representation of AND/OR logic within the graph.
- Corequisite visualization (separate graph or styled edges).
- Autocomplete/suggestions for the course search bar.
- User authentication for saving course plans.
- Requirement satisfaction checking based on user's saved courses.
- Enhanced mobile UI/UX.
- Comprehensive testing (unit, integration, e2e).
- Linking to external resources (RateMyProf, UAlberta Calendar).