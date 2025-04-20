## Project Implementation Plan: Uni Planner

Here's a phased approach to building the core features:

---

### Phase 1: Core Planner MVP + Automation Foundation

- **Goal:** Establish the foundational planner functionality for a single target program, including data scraping, database setup, user authentication, basic API, UI, and the initial version of the data refresh mechanism.
- **Key Tasks:**
  - **Scraping:** Develop a web scraper targeting _one_ specific university program's requirements page and the associated course catalog/description pages.
  - **Database:** Design and implement the Prisma schema to store programs, requirements (including different types like "X units from list A"), courses (with prerequisites, corequisites, descriptions), and user plans.
  - **Authentication:** Set up OAuth (e.g., using NextAuth.js with a provider like Google or GitHub) for user sign-in and session management.
  - **API Layer:** Implement a tRPC router with initial procedures for:
    - Fetching program requirements.
    - Searching/fetching course details.
    - Allowing authenticated users to create/update their course plan.
  - **Frontend UI:** Create basic Next.js pages/components to:
    - Display program requirements clearly.
    - Allow users to search for and add courses to their plan.
    - Show the user's current plan against the requirements.
  - **Validation Logic:** Implement initial logic to check if a user's selected courses meet the basic requirements of the target program (e.g., correct number of units).
  - **Automation Script:** Create a script (can be manually triggered initially) that runs the scraper and updates the database.
- **Estimated Time:** 4 - 8 weeks (This phase involves significant architectural setup).

---

### Phase 2: Expand Planner & Refine Automation

- **Goal:** Broaden the planner's capabilities to cover more programs, handle more complex requirements, improve the user experience, and make the data refresh process robust and automated.
- **Key Tasks:**
  - **Scraping Expansion:** Enhance the scraper to handle multiple programs and potentially more complex requirement structures (e.g., "choose 2 from A, B, C", GPA minimums if available). Implement robust error handling for scraping changes.
  - **Database Refinement:** Update the Prisma schema if necessary to accommodate new requirement types or data points.
  - **UI/UX Improvements:** Refine the planner interface based on initial use. Consider features like drag-and-drop planning, clearer visualization of requirement fulfillment, prerequisite warnings.
  - **Validation Enhancement:** Improve the plan validation logic to cover more complex rules and edge cases discovered during expansion.
  - **Full Automation:** Implement scheduled execution for the scraper/data processing script (e.g., using Vercel Cron Jobs, GitHub Actions, or a similar scheduler).
  - **Monitoring & Alerting:** Add basic monitoring to the automation script to detect failures (e.g., scraper breaking due to website changes) and alert you.
- **Estimated Time:** 3 - 6 weeks (Builds upon the foundation from Phase 1).

---

### Phase 3: LLM RAG Integration

- **Goal:** Implement the Retrieval-Augmented Generation (RAG) feature allowing users to ask natural language questions about programs and courses.
- **Key Tasks:**
  - **Data Preparation:** Create a pipeline to process your scraped data (program requirements, course descriptions, prerequisites) into a format suitable for embedding (cleaning, chunking).
  - **Vector Database:** Choose and set up a vector database (e.g., Pinecone, Supabase pgvector, Chroma) to store the embeddings of your prepared data.
  - **Embedding:** Implement the process to generate embeddings for your data chunks and store them in the vector database. This needs to be integrated into your automation process (Phase 2) so new data is also embedded.
  - **Langchain Implementation:**
    - Set up a Langchain chain using a suitable LLM.
    - Configure the RAG component: Use the vector database as the retriever to find relevant documents based on the user's query.
    - Develop effective prompts that instruct the LLM to answer questions based _only_ on the retrieved context.
  - **API & UI:**
    - Create a new tRPC endpoint to handle RAG queries.
    - Build a chat-like interface on the frontend for users to ask questions.
  - **Tuning & Evaluation:** Test and refine the RAG system for accuracy, relevance, and response quality. Adjust chunking strategies, embedding models, prompts, or retrieval parameters as needed.
- **Estimated Time:** 4 - 7 weeks (RAG setup and tuning can be iterative and complex).
