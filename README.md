# UniPlanner - University of Alberta Course Planning Tool 🎓

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI/CD Pipeline](https://github.com/yourusername/uni-planner-sup/actions/workflows/test.yml/badge.svg)](https://github.com/yourusername/uni-planner-sup/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/yourusername/uni-planner-sup/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/uni-planner-sup)

**An intelligent web application designed to help University of Alberta students navigate course selection, visualize prerequisites, build schedules, and stay on track with their degree requirements.**

Navigating university course requirements, prerequisites, and scheduling can be complex. UniPlanner aims to simplify this process by providing students with a centralized, intuitive, and performant tool. **This project represents a significant evolution from an earlier prototype built with Python/Flask/Beautiful Soup, now leveraging a modern full-stack architecture for improved integration, type safety, and performance.**

## ✨ Key Features

- **Interactive Course Browser:** Search, filter, and explore UAlberta courses.
- **Dynamic Prerequisite/Corequisite Graph:** Visualize complex course relationships using an interactive graph.
- **Schedule Builder:** Add course sections to a visual timetable and instantly detect time conflicts.
- **"Needed For" Insights:** See which courses require a specific course as a prerequisite or corequisite.
- **Optimized Data Loading:** Utilizes efficient **PostgreSQL Recursive CTEs** for fetching prerequisite graph data, significantly improving performance over traditional methods.
- **Modern Tech Stack:** Built with Next.js, TypeScript, and Tailwind CSS for a fast and responsive user experience.
- **(Planned)** Program Requirement Tracking & Validation.
- **(Planned)** AI-Powered Chatbot (RAG) for natural language course inquiries.
- **(Planned)** Automated Data Pipeline for maintaining up-to-date course information.

## 🚀 Tech Stack (Current Version)

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, React Flow (or your graph library), Zod (client-side validation)
- **Backend:** Next.js (API Routes), Supabase (PostgreSQL Database, Auth)
- **Database ORM/Toolkit:** Prisma
- **Validation:** Zod
- **Deployment:** Vercel / Netlify (Frontend), Supabase Platform
- **(Previous Version Stack):** Python, Flask, Beautiful Soup
- **(Planned - AI/Pipeline):** Python, FastAPI, LangChain, Vector DB (pgvector/Chroma), Scheduler (GitHub Actions/APScheduler)

## Data belongs to University of Alberta
