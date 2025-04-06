import { OpenAI } from 'openai'; 
import { Course, RawCourse, RequirementsData } from '../../lib/types'; 
import path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

// TODO:
// 1. Add caching to avoid repeated API calls for the same course.
// 2. Implement a retry mechanism for API calls.
// 3. Add more robust error handling and logging.
// 4. Consider using a queue system for processing large batches of courses.
// 5. Implement a rate limiter to avoid hitting API limits.
// 6. Add unit tests for the parsing logic.
// 7. Consider using a more structured approach for the OpenAI API calls, such as a wrapper class.
// 8. Add a fallback mechanism in case OpenAI API is down or slow.




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
- Flatten the prerequisites and corequisites into "flattenedPrerequisites" and "flattenedCorequisites" arrays.
- Capture any remaining relevant text (often credit restrictions, recommendations, or notes) in the "notes" field.
- The output should be a valid JSON object. If the JSON is malformed, return null.

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
        },
        "notes": ""
      },
      "flattenedPrerequisites": ["CMPUT 174", "CMPUT 274", "MATH 100", "MATH 114", "MATH 117", "MATH 134", "MATH 144", "MATH 154"],
      "flattenedCorequisites": ["CMPUT 175", "CMPUT 275", "CMPUT 272", "MATH 102", "MATH 125", "MATH 127", "STAT 151", "STAT 161", "STAT 181", "STAT 235", "STAT 265", "SCI 151", "MATH 181"]
    }

Example 2:
Input:
    This course focuses on ethics issues in Artificial Intelligence (AI) and Data Science (DS). The main themes are privacy, fairness/bias, and explainability in DS. The objectives are to learn how to identify and measure these aspects in outputs of algorithms, and how to build algorithms that correct for these issues. The course will follow a case-studies based approach, where we will examine these aspects by considering real-world case studies for each of these ethics issues. The concepts will be introduced through a humanities perspective by using case studies with an emphasis on a technical treatment including implementation work. Prerequisite: one of CMPUT 191 or 195, or one of CMPUT 174 or 274 and one of STAT 151, 161, 181, 235, 265, SCI 151, MATH 181, or CMPUT 267.
Output:
    {
      "description": "This course focuses on ethics issues in Artificial Intelligence (AI) and Data Science (DS). The main themes are privacy, fairness/bias, and explainability in DS. The objectives are to learn how to identify and measure these aspects in outputs of algorithms, and how to build algorithms that correct for these issues. The course will follow a case-studies based approach, where we will examine these aspects by considering real-world case studies for each of these ethics issues. The concepts will be introduced through a humanities perspective by using case studies with an emphasis on a technical treatment including implementation work.",
      "requirements": {
        "prerequisites": {
          "operator": "OR",
          "conditions": [
          { 
            "operator": "OR", 
            "courses": ["CMPUT 191", "CMPUT 195"] 
          },
          { 
            "operator": "AND",
            "conditions": [
            { "operator": "OR", "courses": ["CMPUT 174", "CMPUT 274"] },
            { "operator": "OR", "courses": ["STAT 151", "STAT 161", "STAT 181", "STAT 235", "STAT 265", "SCI 151", "MATH 181", "CMPUT 267"] }
            ] 
          }
          ]
        },
        "corequisites": {
          "operator": "AND",
          "conditions": []
        },
        "notes": "" 
      },
      flattenedPrerequisites: ["CMPUT 191", "CMPUT 195", "CMPUT 174", "CMPUT 274", "STAT 151", "STAT 161", "STAT 181", "STAT 235", "STAT 265", "SCI 151", "MATH 181", "CMPUT 267"],
      flattenedCorequisites: []
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
        },
        flattenedPrerequisites: ["CMPUT 391", "CMPUT 3[0-9]{2}"],
        flattenedCorequisites: ["CMPUT 401"]
    }

Here is the input description:
`;


export interface ParsedCourseData {
  description: string;
  requirements: RequirementsData
  flattenedPrerequisites: string[];
  flattenedCorequisites: string[];
}


export async function parseCourseDescription(
  rawDescription: string
): Promise<ParsedCourseData | null> { // Return null on failure
  const prompt = `${BASEPROMPT}\n${rawDescription}`;

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!});
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }, {role: 'system', content: 'You are a helpful assistant that extracts structured course information from university course catalog descriptions.'}],
      temperature: 0, // No creativity needed
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      console.error('OpenAI response content is empty.');
      return null;
    }

    // Safely parse the JSON output
    const parsedData = JSON.parse(content) as ParsedCourseData;

    
    if (!parsedData.description || !parsedData.requirements) {
        console.error('Parsed data is missing required fields (description or requirements).', parsedData);
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
): Promise<Course | null> {
  if (!rawCourse.description) {
    console.error(`No description found for course: ${rawCourse.courseCode}`);
    return null;
  }

  try {
    const parsedData: ParsedCourseData | null = await parseCourseDescription(rawCourse.description);
    if (!parsedData) {
      console.error(`Failed to parse course description for: ${rawCourse.courseCode}`);
      return null;
    }
    const processedData: Course = {
      id: undefined,
      department: rawCourse.department,
      courseCode: rawCourse.courseCode,
      title: rawCourse.title,
      units: rawCourse.units,
      parsedDescription: parsedData.description,
      requirements: parsedData.requirements,
      flattenedPrerequisites: parsedData.flattenedPrerequisites || [],
      flattenedCorequisites: parsedData.flattenedCorequisites || [],
      url: rawCourse.url,
      updatedAt: new Date().toISOString(),
    };
    return processedData;
  } catch (error) {
    console.error(`Error processing course ${rawCourse.courseCode}:`, error);
    return null; // Indicate failure
  }
}

export async function AIparse(
  rawCourses: RawCourse[]
): Promise<Course[]> {
  const parsedCourses: Course[] = [];
  console.log(`Parsing ${rawCourses.length} ${rawCourses[0].department} courses...`);
  let courseCount = 0;
  for (let i = 0; i < rawCourses.length; i++) {
    const courseToParse: RawCourse = rawCourses[i];
    console.log(`\nParsing course ${i + 1}: ${courseToParse.courseCode}`);
    const parsedCourse = await processRawCourseData(courseToParse);
    if (parsedCourse) {
      parsedCourses.push(parsedCourse);
    }
    courseCount++;
  }
  console.log(`\nParsed ${courseCount} courses successfully.`);
  return parsedCourses;
}