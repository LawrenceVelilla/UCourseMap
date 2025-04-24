import { mapRequirementPatternToDescription, shouldExcludeGraphNode, cn } from "@/lib/utils";

describe("mapRequirementPatternToDescription", () => {
  test("handles null or undefined input", () => {
    expect(mapRequirementPatternToDescription("")).toBe("");
    expect(mapRequirementPatternToDescription(undefined as any)).toBe("");
    expect(mapRequirementPatternToDescription(null as any)).toBe("");
  });

  test("preserves standard course codes", () => {
    expect(mapRequirementPatternToDescription("CMPUT 175")).toBe("CMPUT 175");
    expect(mapRequirementPatternToDescription("MATH 101")).toBe("MATH 101");
    expect(mapRequirementPatternToDescription("ENGL 102")).toBe("ENGL 102");
    expect(mapRequirementPatternToDescription("PHYS101")).toBe("PHYS101"); // No space
    expect(mapRequirementPatternToDescription("BIOL 107A")).toBe("BIOL 107A"); // With letter suffix
  });

  test("handles level pattern formats", () => {
    expect(mapRequirementPatternToDescription("CMPUT 1[0-9]{2}")).toBe(
      "Any 100-level CMPUT course",
    );
    expect(mapRequirementPatternToDescription("MATH 2[0-9]{2}")).toBe("Any 200-level MATH course");
    expect(mapRequirementPatternToDescription("PHYS 3[0-9]{2}")).toBe("Any 300-level PHYS course");
  });

  test("handles other level notations", () => {
    expect(mapRequirementPatternToDescription("300-LEVEL ARTS")).toBe("Any 300-level ARTS course");
    expect(mapRequirementPatternToDescription("100 LEVEL SCIENCE")).toBe(
      "Any 100-level SCIENCE course",
    );
    expect(mapRequirementPatternToDescription("3* ARTS")).toBe("A 300-level ARTS course or higher");
  });

  test("handles exact mappings", () => {
    expect(mapRequirementPatternToDescription("MATHEMATICS 30-1")).toBe("Mathematics 30-1");
    expect(mapRequirementPatternToDescription("MATH 30-1")).toBe("Mathematics 30-1");
  });

  test("preserves other requirement text", () => {
    expect(mapRequirementPatternToDescription("Consent of department")).toBe(
      "Consent of department",
    );
    expect(mapRequirementPatternToDescription("Minimum GPA of 2.0")).toBe("Minimum GPA of 2.0");
  });
});

describe("shouldExcludeGraphNode", () => {
  test("excludes empty or null identifiers", () => {
    expect(shouldExcludeGraphNode("")).toBe(true);
    expect(shouldExcludeGraphNode(null as any)).toBe(true);
    expect(shouldExcludeGraphNode(undefined as any)).toBe(true);
  });

  // These tests might need adjustment based on actual implementation details
  test("handles valid identifiers", () => {
    expect(shouldExcludeGraphNode("CMPUT 175")).toBe(false);
  });
});

describe("cn utility", () => {
  test("combines class names correctly", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
    expect(cn("class1", { class2: true, class3: false })).toBe("class1 class2");
    expect(cn("p-4", "mt-2", "text-center")).toBe("p-4 mt-2 text-center");
  });

  test("handles tailwind conflicting classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("mt-2", "mt-4")).toBe("mt-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});
