import axios from 'axios';
import * as cheerio from 'cheerio';
import { OpenAI } from 'openai';
import { ICourse } from '../models/course'; // Your Mongoose model

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Target URL
const COURSE_CATALOG_URL = 'https://apps.ualberta.ca/catalogue/course/cmput';

interface RawCourse {
  code: string;
  title: string;
  description: string;
}


const basePrompt = `
  You are a helpful assistant that extracts course information from a university course catalog.
  You will be given a course description, and your task is to extract the prerequisites and corequisites.
  Your job is to output:
  - A course description
  - A list of prerequisites (which are tagged as "Prerequisites", "Prereq", or "prereq" in the description)
  - A list of corequisites (which are tagged as "Corequisites", "Coreq", or "coreq" in the description)

   - For prerequisites or corequisites like "any 300-level Computing Science course", do: { "operator": "WILDCARD", "pattern": "CMPUT 3[0-9]{2}" }
   - For any text that is marked as Note, or is after the prerequisites/corequisites, do: "Note": <the text>

  The output should be in JSON format with the following structure:
  
  Example 1:
    Input: 
        This course introduces the fundamental statistical, mathematical, and computational concepts in analyzing data. The goal for this introductory course is to provide a solid foundation in the mathematics of machine learning, in preparation for more advanced machine learning concepts. The course focuses on univariate models, to simplify some of the mathematics and emphasize some of the underlying concepts in machine learning, including: how should one think about data, how can data be summarized, how models can be estimated from data, what sound estimation principles look like, how generalization is achieved, and how to evaluate the performance of learned models. Prerequisites: CMPUT 174 or 274; one of MATH 100, 114, 117, 134, 144, or 154. Corequisites: CMPUT 175 or 275; CMPUT 272; MATH 102, 125 or 127; one of STAT 151, 161, 181, 235, 265, SCI 151, or MATH 181.
    Output:
        {
          "description": "This course focuses on ethics issues in Artificial Intelligence (AI) and Data Science (DS). The main themes are privacy, fairness/bias, and explainability in DS. The objectives are to learn how to identify and measure these aspects in outputs of algorithms, and how to build algorithms that correct for these issues. The course will follow a case-studies based approach, where we will examine these aspects by considering real-world case studies for each of these ethics issues. The concepts will be introduced through a humanities perspective by using case studies with an emphasis on a technical treatment including implementation work.",
          "requirements": {
        	"prerequisites": {
				"operator": "AND",
				"conditions": [
				{ "operator": "OR", "courses": ["MATH 100", "MATH 114", "MATH 117", "MATH 134", "MATH 144", "MATH 154"] },
				{ "operator": "OR", "courses": ["CMPUT 174", "CMPUT 274"] }
			]},
			"corequisites": {
				"operator": "AND",
				"conditions": [
				{ "operator": "OR", "courses": ["STAT 151", "STAT 161", "STAT 181", "STAT 235", "STAT 265", "SCI 151", "MATH 181"] },
				{ "operator": "OR", "courses": ["CMPUT 175", "CMPUT 275"] },
				{ "operator": "STANDALONE", "courses": ["CMPUT 272"] },
				{ "operator": "OR", "courses": ["MATH 102", "MATH 125", "MATH 127"] }
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
          "prerequisites": {
            {
              "type": "one_of",
              "options": [{ "operator": "OR", "courses": ["Math 30", "Math 30-1", "Math 30-2"] }]
            }
          },
          "corequisites": {},
          "notes": "Credit cannot be obtained for CMPUT 174 if credit has already been obtained for CMPUT 274, 275, or ENCMP 100, except with permission of the Department."

        }
  `

/**
 * Use OpenAI to parse prerequisites/corequisites from description.
 */
async function parseWithOpenAI(description: string): Promise<{
  description: string;
  requirements: {
    prerequisites: { operator: string; conditions: any[] };
    corequisites?: { operator: string; conditions: any[] };
    notes?: string;
  }
}> {
  const prompt = `${basePrompt}
  Description: ${description}
  `;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0,
  });

  // Safely parse the JSON output
  try {
    return JSON.parse(response.choices[0].message.content!);
  } catch (error) {
    console.error('Failed to parse OpenAI output:', error);
    return { prerequisites: {}, corequisites: {} };
  }
}

/**
 * Save courses to MongoDB.
 */
async function saveCourses(courses: RawCourse[]) {
  for (const course of courses) {
    const { prerequisites, corequisites } = await parseWithOpenAI(course.description);

    await course.findOneAndUpdate(
      { code: course.code },
      {
        title: course.title,
        description: course.description,
        prerequisites,
        corequisites,
        university: 'University of Alberta',
      },
      { upsert: true }
    );
  }
}
