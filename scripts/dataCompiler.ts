import * as readline from 'readline';
import { stdin as input, stdout as output } from 'process';
import { processRawCourseData, AIparse } from '../utils/collection/parser';
import { Course, RawCourse, ParsedCourseData } from '@/lib/types';
import { scrapeCourses, parseCoursesHTML } from '../utils/collection/scrape-courses'; // Adjust the import path as needed
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import fs from 'fs/promises';
import axios from 'axios';

const DATA_DIR = path.join(__dirname, '../data'); // Directory to save data

function getDepartmentInput(): Promise<string> {
    // Input department name from user
    const rl = readline.createInterface({ input, output });

    return new Promise((resolve) => {
        rl.question('Please enter the department name (lowercase): ', (answer) => {
            rl.close(); // Close the interface after getting the input
            resolve(answer.trim()); // Resolve the promise with the trimmed answer
        });
    });
}

function getConfirmationInput(nextPhase: string): Promise<boolean> {
    // Create a readline interface
    const rl = readline.createInterface({ input, output });
    return new Promise((resolve) => {
        rl.question(`Do you want to continue to ${nextPhase}? (y/n):  `, (answer) => {
            rl.close(); // Close the interface after getting the input
            resolve(answer.trim().toLowerCase() === 'y');
        });
    });
}// Resolve the promise with true if 'yes', false otherwise

/**
 * Main function to orchestrate the data collection process.
 */
async function runDataCollection() {
    let department: string | null = null; // Keep track of the department name

    try {
        // 1. Get Department Input from User
        department = await getDepartmentInput();
        if (!department) {
            console.error("No department name entered. Exiting.");
            return;
        }
        

        // 2. Scrape Data
        console.log(`\n---------- Starting data collection for department: ${department.toUpperCase()} -----------\n`);
        console.log(`Scraping data for ${department}...`);
        let url = `https://apps.ualberta.ca/catalogue/course/${department}`;
        console.log(`Scraping URL: ${url}`);
        let web = await axios.get(url);
        const scrapedData: RawCourse[] = await parseCoursesHTML(web.data);
        if (!scrapedData) {
             console.error(`Scraping failed or returned no data for ${department}.`);
             return;
        }
        fs.writeFile(`${DATA_DIR}/${department}courses.json`, JSON.stringify(scrapedData, null, 2));

        // 3. Parse Data with AI
        console.log(`Successfully scraped ${scrapedData.length} courses!`);
        console.log(`Please check the ${department}_courses.json file for the raw data.\n`);
        let confirmation = await getConfirmationInput("AI Parsing");
        if (!confirmation) {
            console.log("Skipping AI Parsing.");
            return;
        }
        console.log("Starting AI Parsing...");
        const parsedData = await AIparse(scrapedData);
        if (!parsedData) {
            console.error(`AI Parsing failed or returned no data.`);
            return;
        }
        fs.writeFile(`${DATA_DIR}/parsed_${department}courses.json`, JSON.stringify(parsedData, null, 2));

        console.log(`Successfully parsed ${parsedData.length} courses!`);
        console.log(`Please check the parsed_${department}courses.json file for the parsed data.\n`);
        let confirmation2 = await getConfirmationInput("Database Insertion");
        if (!confirmation2) {
            console.log("Skipping Database Insertion.");
            return;
        }
        // 4. Insert Data into Database
        console.log("Starting Database Insertion...");


        // 5. Display Results
        console.log("\n--- Data Collection Complete ---");
        console.log("Department:", department);
        console.log("Parsed Data:");
        console.log(JSON.stringify(parsedData.slice(0,10), null, 2)); // Pretty print the JSON

        // For later: Add saving to DB functionality

      
    } catch (error) {
        console.error("\n--- An Error Occurred ---");
        if (department) {
            console.error(`Processing failed for department: ${department}`);
        }
        if (error instanceof Error) {
            console.error("Error Message:", error.message);
            console.error("Stack Trace:", error.stack);
        } else {
            console.error("Unknown Error:", error);
        }
    } finally {
        console.log("\nData collection process finished.");
    }
}


(async () => {
    await runDataCollection();
})();
