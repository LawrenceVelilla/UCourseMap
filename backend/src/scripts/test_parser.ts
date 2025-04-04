// --- START OF FILE scripts/test_parser.ts ---

import dotenv from 'dotenv';
import path from 'path';
import util from 'util'; // For deep equality check
import fs from 'fs'; // For file system operations

// Load environment variables from .env.local at the project root
// Adjust path if needed
import courses from '../../courses.json'; // Adjust path as needed
import { parseCourseDescription, ParsedCourseData, processRawCourseData } from '../utils/parser'; // Adjust path as needed
import { ProcessedCourseDataforDB, RawCourse } from '../models/course';
// --- Test Cases ---
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// Make a new JSON file with the output of the OpenAI API


interface TestCase {
  name: string;
  inputDescription: string;
  expectedOutput: ParsedCourseData | null; // Use null if expecting parsing failure, otherwise ParsedCourseData
}


const numCourses = courses.length;
// Already have the first 30 courses in the courses.json file
const courseToTest = courses.slice(0,10); // <-- Start from 30

console.log(`Running tests on ${courseToTest.length} courses out of ${numCourses} total courses.`);

const descriptions: string[] = courseToTest.map((dict) => dict.description);


async function runTest() {
    console.log("Starting Parser Accuracy Tests...\n");
    if (!process.env.OPENAI_API_KEY) {
        console.error("ERROR: OPENAI_API_KEY environment variable not set.");
        process.exit(1);
    }
    let passCount = 0;
    let failCount = 0;
    
    
    try {
        const listofParsedData = [];
        for (let i = 0; i < courseToTest.length; i++) {
            const testCase = courseToTest[i];
            console.log(`--- Running Test Case ${i + 1}: ${testCase.code} ---`);
            console.log("Raw data:", testCase);

            console.log("Passing description to OpenAI API...");
            const parsedData = await processRawCourseData(testCase);
            console.log(`Scraped ${courses.length} courses`);

            console.log("Parsed data:", JSON.stringify(parsedData, null, 2));
            console.log("Writing parsed data to listofParsedData...");
            listofParsedData.push(parsedData);

        }
        console.log("All test cases processed successfully.");
        passCount++;
        // Write the parsed data to a JSON file
        const outputFilePath = path.join(__dirname, '../../parsed_courses.json');
        console.log(`Writing parsed data to ${outputFilePath}...`);
        fs.writeFileSync(outputFilePath, JSON.stringify(listofParsedData, null, 2));

    
    }
    catch (error) {
        console.error("Error during OpenAI call:", error);
        failCount++;
    }

    console.log("--- Test Summary ---");
    console.log(`Total Tests: ${courseToTest.length}`);
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log("--------------------");
}

runTest();


// async function runTests() {
//   console.log("Starting Parser Accuracy Tests...\n");

//   if (!process.env.OPENAI_API_KEY) {
//     console.error("ERROR: OPENAI_API_KEY environment variable not set.");
//     process.exit(1);
//   }

//   let passCount = 0;
//   let failCount = 0;

//   for (let i = 0; i < testCases.length; i++) {
//     const testCase = testCases[i];
//     console.log(`--- Running Test Case ${i + 1}: ${testCase.name} ---`);
//     console.log("Input Description (truncated):", testCase.inputDescription.substring(0, 100) + "...");

//     let actualOutput: ParsedCourseData | null = null;
//     let errorOccurred: any = null;

//     try {
//       actualOutput = await parseCourseDescription(testCase.inputDescription);
//     } catch (error) {
//       console.error("Error during OpenAI call:", error);
//       errorOccurred = error;
//     }

//     // Use util.isDeepStrictEqual for robust object comparison
//     const passed = !errorOccurred && util.isDeepStrictEqual(actualOutput, testCase.expectedOutput);

//     if (passed) {
//       console.log("Result: ✅ PASS\n");
//       passCount++;
//     } else {
//       console.log("Result: ❌ FAIL\n");
//       failCount++;
//       if (errorOccurred) {
//         console.log("Reason: Error occurred during parsing.");
//       } else {
//         console.log("Expected Output:", JSON.stringify(testCase.expectedOutput, null, 2));
//         console.log("Actual Output:", JSON.stringify(actualOutput, null, 2));
//       }
//       console.log("\n--------------------------------------\n");
//     }
//      // Optional: Add a small delay between API calls if needed
//      // await new Promise(resolve => setTimeout(resolve, 500));
//   }

//   console.log("--- Test Summary ---");
//   console.log(`Total Tests: ${testCases.length}`);
//   console.log(`✅ Passed: ${passCount}`);
//   console.log(`❌ Failed: ${failCount}`);
//   console.log("--------------------");

//   // Exit with non-zero code if any tests failed
//   process.exit(failCount > 0 ? 1 : 0);
// }

// // Run the tests
// runTests();

// --- END OF FILE scripts/test_parser.ts ---