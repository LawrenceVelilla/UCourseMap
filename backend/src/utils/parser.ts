// --- START OF FILE parser.ts ---

import { OpenAI } from 'openai';
import { CourseRequirements } from '../models/course'; // Assuming you define this type/interface
import { RawCourse, ProcessedCourseDataforDB } from '../models/course';
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });





// --- Refined Base Prompt ---
const BASEPROMPT = `
You are a helpful assistant that extracts structured course information from university course catalog descriptions.
Your task is to analyze the provided text and extract:
1.  A clean course description (excluding prerequisite, corequisite, and note sections).
2.  A structured representation of prerequisites (tagged as "Prerequisites", "Prereq", or "prereq").
3.  A structured representation of corequisites (tagged as "Corequisites", "Coreq", or "coreq").
4.  Any additional notes (often appearing after prerequisites/corequisites or marked as "Note:").

Output Rules:
- The output MUST be a single JSON object. Do not include any text before or after the JSON object.
- Use the operators: "AND", "OR", "STANDALONE", "WILDCARD".
- "STANDALONE" is for a single course requirement (e.g., "CMPUT 272"). Represent as: { "operator": "STANDALONE", "courses": ["CMPUT 272"] }
- "OR" is for a choice between multiple courses (e.g., "one of MATH 100, 114, 117"). Represent as: { "operator": "OR", "courses": ["MATH 100", "MATH 114", "MATH 117"] }
- "AND" is for multiple conditions that must *all* be met. Represent as: { "operator": "AND", "conditions": [ <list of requirement objects> ] }. Conditions can be nested (e.g., an AND containing ORs).
- For requirements like "any 300-level Computing Science course", use "WILDCARD". Represent as: { "operator": "WILDCARD", "pattern": "CMPUT 3[0-9]{2}", "description": "any 300-level Computing Science course" } (Add a human-readable description).
- If no prerequisites are found, use: { "operator": "AND", "conditions": [] }
- If no corequisites are found, omit the 'corequisites' field or use: { "operator": "AND", "conditions": [] }
- Capture any remaining relevant text (often credit restrictions, recommendations, or notes) in the "notes" field.

JSON Output Structure:
{
  "description": "<The main course description text>",
  "requirements": {
    "prerequisites": {
      "operator": "AND | OR | STANDALONE | WILDCARD",
      "conditions": [ /* Array of requirement objects */ ] | undefined,
      "courses": [ /* Array of course codes */ ] | undefined,
      "pattern": "<Regex pattern>" | undefined,
      "description": "<Human readable wildcard desc>" | undefined
    },
    "corequisites": { /* Same structure as prerequisites */ } | undefined,
    "notes": "<Extracted notes text>" | undefined
  }
}

Example 1:
Input:
    This course introduces the fundamental statistical, mathematical, and computational concepts in analyzing data. The goal for this introductory course is to provide a solid foundation in the mathematics of machine learning, in preparation for more advanced machine learning concepts. The course focuses on univariate models, to simplify some of the mathematics and emphasize some of the underlying concepts in machine learning, including: how should one think about data, how can data be summarized, how models can be estimated from data, what sound estimation principles look like, how generalization is achieved, and how to evaluate the performance of learned models. Prerequisites: CMPUT 174 or 274; one of MATH 100, 114, 117, 134, 144, or 154. Corequisites: CMPUT 175 or 275; CMPUT 272; MATH 102, 125 or 127; one of STAT 151, 161, 181, 235, 265, SCI 151, or MATH 181.
Output:
    {
      "description": "This course introduces the fundamental statistical, mathematical, and computational concepts in analyzing data. The goal for this introductory course is to provide a solid foundation in the mathematics of machine learning, in preparation for more advanced machine learning concepts. The course focuses on univariate models, to simplify some of the mathematics and emphasize some of the underlying concepts in machine learning, including: how should one think about data, how can data be summarized, how models can be estimated from data, what sound estimation principles look like, how generalization is achieved, and how to evaluate the performance of learned models.",
      "requirements": {
        "prerequisites": {
          "operator": "AND",
          "conditions": [
            { "operator": "OR", "courses": ["CMPUT 174", "CMPUT 274"] },
            { "operator": "OR", "courses": ["MATH 100", "MATH 114", "MATH 117", "MATH 134", "MATH 144", "MATH 154"] }
          ]
        },
        "corequisites": {
          "operator": "AND",
          "conditions": [
            { "operator": "OR", "courses": ["CMPUT 175", "CMPUT 275"] },
            { "operator": "STANDALONE", "courses": ["CMPUT 272"] },
            { "operator": "OR", "courses": ["MATH 102", "MATH 125", "MATH 127"] },
            { "operator": "OR", "courses": ["STAT 151", "STAT 161", "STAT 181", "STAT 235", "STAT 265", "SCI 151", "MATH 181"] }
          ]
        }
      }
    }

Example 2:
Input:
    CMPUT 174 and 175 use a problem-driven approach to introduce the fundamental ideas of Computing Science. Emphasis is on the underlying process behind the solution, independent of programming language or style. Basic notions of state, control flow, data structures, recursion, modularization, and testing are introduced through solving simple problems in a variety of domains such as text analysis, map navigation, game search, simulation, and cryptography. Students learn to program by reading and modifying existing programs as well as writing new ones. No prior programming experience is necessary. Prerequisite: Math 30, 30-1, or 30-2. See Note (1) above. Credit cannot be obtained for CMPUT 174 if credit has already been obtained for CMPUT 274, 275, or ENCMP 100, except with permission of the Department.
Output:
    {
      "description": "CMPUT 174 and 175 use a problem-driven approach to introduce the fundamental ideas of Computing Science. Emphasis is on the underlying process behind the solution, independent of programming language or style. Basic notions of state, control flow, data structures, recursion, modularization, and testing are introduced through solving simple problems in a variety of domains such as text analysis, map navigation, game search, simulation, and cryptography. Students learn to program by reading and modifying existing programs as well as writing new ones. No prior programming experience is necessary.",
      "requirements": {
        "prerequisites": {
          "operator": "OR",
          "courses": ["MATH 30", "MATH 30-1", "MATH 30-2"]
        },
        "notes": "See Note (1) above. Credit cannot be obtained for CMPUT 174 if credit has already been obtained for CMPUT 274, 275, or ENCMP 100, except with permission of the Department."
      }
    }

Example 3 (Wildcard):
Input:
    Advanced topics in database management systems. Topics may include query processing and optimization, concurrency control, recovery, distributed and parallel databases, data warehousing, data mining, stream data management, web data management, and big data management. Prerequisite: CMPUT 391. A 300-level CMPUT course. Coreq: CMPUT 401. Note: Consult the Department for the specific topics offered in a given term.
Output:
    {
        "description": "Advanced topics in database management systems. Topics may include query processing and optimization, concurrency control, recovery, distributed and parallel databases, data warehousing, data mining, stream data management, web data management, and big data management.",
        "requirements": {
            "prerequisites": {
                "operator": "AND",
                "conditions": [
                    { "operator": "STANDALONE", "courses": ["CMPUT 391"] },
                    { "operator": "WILDCARD", "pattern": "CMPUT 3[0-9]{2}", "description": "A 300-level CMPUT course" }
                ]
            },
            "corequisites": {
                "operator": "STANDALONE",
                "courses": ["CMPUT 401"]
            },
            "notes": "Consult the Department for the specific topics offered in a given term."
        }
    }

Here is the input description:
`;

// Define a type for the expected output structure (matches the prompt)
// You might want to make this more specific with nested types if needed
export interface ParsedCourseData {
  description: string;
  requirements: CourseRequirements; // Use the type from your Mongoose model or define here
}

/**
 * Use OpenAI to parse description, prerequisites, corequisites, and notes.
 */
export async function parseCourseDescription(
  rawDescription: string
): Promise<ParsedCourseData | null> { // Return null on failure
  const prompt = `${BASEPROMPT}\n${rawDescription}`;

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!});
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Or 'gpt-4o' if mini struggles
      messages: [{ role: 'user', content: prompt }, {role: 'system', content: 'You are a helpful assistant that extracts structured course information from university course catalog descriptions.'}],
      temperature: 0, // For deterministic results
      response_format: { type: 'json_object' }, // Enforce JSON output
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      console.error('OpenAI response content is empty.');
      return null;
    }

    // Safely parse the JSON output
    const parsedData = JSON.parse(content) as ParsedCourseData;

    // Basic validation (optional but recommended)
    if (!parsedData.description || !parsedData.requirements) {
        console.error('Parsed data is missing required fields (description or requirements).', parsedData);
        // You could attempt to salvage parts or just return null
        return null;
    }

    return parsedData;

  } catch (error: any) {
    console.error(`Failed to parse description with OpenAI for input: "${rawDescription.substring(0, 100)}..."`, error);
    if (error.response) {
      console.error('OpenAI API Error Status:', error.response.status);
      console.error('OpenAI API Error Data:', error.response.data);
    }
    return null; // Indicate failure
  }
}

export async function processRawCourseData(
  rawCourse: RawCourse
): Promise<ProcessedCourseDataforDB | null> {
  
  console.log(`Processing course: ${rawCourse.code}`);

  if (!rawCourse.description) {
    console.error(`No description found for course: ${rawCourse.code}`);
    return null;
  }

  try {
    const parsedData: ParsedCourseData | null = await parseCourseDescription(rawCourse.description);
    if (!parsedData) {
      console.error(`Failed to parse course description for: ${rawCourse.code}`);
      return null;
    }
    const processedData: ProcessedCourseDataforDB = {
      courseCode: rawCourse.code,
      title: rawCourse.title,
      units: rawCourse.units,
      rawDescription: rawCourse.description,
      parsedDescription: parsedData.description,
      parsingStatus: 'success',
      lastParsedAt: new Date(),
      requirements: parsedData.requirements,
      url: rawCourse.url,
    };
    return processedData;
  } catch (error) {
    console.error(`Error processing course ${rawCourse.code}:`, error);
    return null; // Indicate failure
  }
}


// --- END OF FILE parser.ts ---