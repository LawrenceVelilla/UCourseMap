"use client";

import { useEffect, useState } from "react";
import { Program } from "@/lib/types";
import ProgramViewer from "@/components/ProgramViewer";
import { processRawProgram } from "@/utils/collection/program-organizer";

export default function ProgramPlannerPage() {
  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProgramData() {
      try {
        setLoading(true);

        // Fetch the program data
        const response = await fetch("/program_requirements.json");
        if (!response.ok) {
          throw new Error(`Failed to load program data: ${response.statusText}`);
        }

        const rawData = await response.json();

        // Process the raw data into our structured format
        const processedProgram = processRawProgram(rawData);
        setProgram(processedProgram);
      } catch (err) {
        console.error("Error loading program:", err);
        setError(err instanceof Error ? err.message : "Failed to load program data");
      } finally {
        setLoading(false);
      }
    }

    loadProgramData();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Program Planner</h1>
        <p className="text-gray-600 mt-2">
          Plan your academic journey and track your progress towards graduation
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-pulse text-center">
            <div className="h-8 w-60 bg-gray-200 rounded mb-4 mx-auto"></div>
            <div className="h-4 w-40 bg-gray-200 rounded mb-2 mx-auto"></div>
            <div className="h-4 w-52 bg-gray-200 rounded mb-2 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading program requirements...</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded mb-8">
          <p className="font-medium">Error Loading Program</p>
          <p>{error}</p>
        </div>
      ) : program ? (
        <ProgramViewer initialProgram={program} />
      ) : (
        <div className="bg-yellow-100 border border-yellow-300 text-yellow-700 p-4 rounded mb-8">
          <p>No program data available. Please select a program to view.</p>
        </div>
      )}
    </div>
  );
}
