import { mapRequirementPatternToDescription } from '../lib/utils';

const testPatterns = [
    "ENCMP 100",      // Should return unchanged
    "CMPUT 272",      // Should return unchanged
    "ZOOL 2XX",       // Should map
    "ZOOL 2[0-9]{2}",  // Should map (if regex covers it)
    "STAT 1XX",       // Should map
    "300-LEVEL ARTS", // Should map
    "MATHEMATICS 30-1", // Should map
    "MATH 31",        // Should map
    "CONSENT OF DEPARTMENT", // Should return unchanged (to be filtered later)
    "invalid string", // Should return unchanged
    " PHYS 124 ",     // Should return "PHYS 124" (after trim)
    "1*-LEVEL SCIENCE" // Should map (if regex added)
];

testPatterns.forEach(p => {
    console.log(`Input: "${testPatterns[3]}" ==> Output: "${mapRequirementPatternToDescription(testPatterns[3])}"`);
});