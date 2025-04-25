"use client";

import { useState, useEffect } from "react";
import ProgramViewer from "@/components/ProgramViewer";
import PlanBuilder from "@/components/PlanBuilder";
import { useProgramPlanStore } from "@/utils/store/programPlanStore";
import { Button } from "@/components/ui/button";

// TODO: Replace with dynamic program selection later
const PROGRAM_FILE_IDENTIFIER = "program_requirements_structured.json";

export default function PlannerPage() {
  const [activeTab, setActiveTab] = useState<"viewer" | "builder">("viewer");
  const loadProgramData = useProgramPlanStore((state) => state.loadProgramData);
  const program = useProgramPlanStore((state) => state.program);
  const resetState = useProgramPlanStore((state) => state.resetState);

  // Load the default program when the component mounts
  useEffect(() => {
    console.log(`PlannerPage: Loading program data using identifier: ${PROGRAM_FILE_IDENTIFIER}`);
    resetState();
    void loadProgramData(PROGRAM_FILE_IDENTIFIER);

    // Optional: Cleanup function to reset state when leaving the page
    return () => {
      console.log("PlannerPage: Unmounting, resetting state.");
      resetState();
    };
  }, [loadProgramData, resetState]); // Dependencies

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">
        Program Planner {program ? `- ${program.programName}` : ""}
      </h1>

      {/* Tab Buttons */}
      <div className="mb-6 flex space-x-2 border-b">
        <Button
          variant={activeTab === "viewer" ? "secondary" : "ghost"}
          onClick={() => setActiveTab("viewer")}
          className={`pb-2 rounded-none border-b-2 ${activeTab === "viewer" ? "border-primary" : "border-transparent"} hover:border-muted-foreground/50`}
        >
          Program Requirements
        </Button>
        <Button
          variant={activeTab === "builder" ? "secondary" : "ghost"}
          onClick={() => setActiveTab("builder")}
          className={`pb-2 rounded-none border-b-2 ${activeTab === "builder" ? "border-primary" : "border-transparent"} hover:border-muted-foreground/50`}
        >
          My Plan Builder
        </Button>
      </div>

      {/* Content Area */}
      <div className="tab-content">
        {activeTab === "viewer" && (
          // ProgramViewer reads the program from the store, no need for initialProgram prop here
          <ProgramViewer />
        )}
        {activeTab === "builder" && <PlanBuilder />}
      </div>
    </div>
  );
}
