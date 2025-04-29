import * as readline from "readline";
import { stdin as input, stdout as output } from "process";
import fs from "fs/promises";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";
import { AIparse } from "../utils/collection/parser";
import { parseCoursesHTML } from "../utils/collection/scrape-courses";
import type { Course, RawCourse } from "@/lib/types";
import { save as saveCoursesToDB } from "./saveToDB";

dotenv.config({ path: path.resolve(__dirname, "../.env") });
const DATA_DIR = path.resolve(__dirname, "../data");

async function checkFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function getDepartmentInput(): Promise<string> {
  const rl = readline.createInterface({ input, output });
  return new Promise((resolve) => {
    rl.question("Please enter the department name (lowercase, e.g., cmput): ", (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase());
    });
  });
}

function getConfirmationInput(phase: string): Promise<boolean> {
  const rl = readline.createInterface({ input, output });
  return new Promise((resolve) => {
    rl.question(`\nDo you want to continue to ${phase}? (y/n): `, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

function getNum(list: any[], action: string = "parse"): Promise<number> {
  const rl = readline.createInterface({ input, output });
  const total = list.length;
  return new Promise((resolve) => {
    rl.question(
      `\nHow many courses do you want to ${action}? (Total available: ${total})\n` +
        ` Options: a (all) | h (half: ${Math.floor(total / 2)}) | <number>: `,
      (answer) => {
        rl.close();
        const trimmedAnswer = answer.trim().toLowerCase();
        if (trimmedAnswer === "a" || trimmedAnswer === "") resolve(total);
        else if (trimmedAnswer === "h") resolve(Math.floor(total / 2));
        else {
          const ans = parseInt(trimmedAnswer);
          if (isNaN(ans)) {
            console.warn("Invalid input. Defaulting to all.");
            resolve(total);
          } else if (ans < 0) {
            console.warn("Input negative. Defaulting to all.");
            resolve(total);
          } else if (ans > total) {
            console.warn(`Input > available. Defaulting to all.`);
            resolve(total);
          } else resolve(ans);
        }
      },
    );
  });
}

function getStartNum(list: any[], action: string = "parsing"): Promise<number> {
  const rl = readline.createInterface({ input, output });
  const total = list.length;
  return new Promise((resolve) => {
    rl.question(
      `\nWhat is the starting index for ${action}? (0 to ${total - 1}, default: 0): `,
      (answer) => {
        rl.close();
        const ans = parseInt(answer.trim());
        if (isNaN(ans) || answer.trim() === "") resolve(0);
        else if (ans < 0) {
          console.warn("Start index < 0. Defaulting to 0.");
          resolve(0);
        } else if (ans >= total) {
          console.warn(`Start index >= total. Defaulting to 0.`);
          resolve(0);
        } else resolve(ans);
      },
    );
  });
}

async function runDataCollection() {
  let department: string | null = null;
  let scrapedData: RawCourse[] = [];
  // Define parsedData type to include keywords and exclude parsedDescription
  let parsedData: Course[] = [];
  let ranScraping = false;
  let ranParsing = false;

  try {
    department = await getDepartmentInput();
    if (!department) throw new Error("No department name entered.");

    const rawDataPath = path.join(DATA_DIR, `${department}courses.json`);
    const parsedDataPath = path.join(DATA_DIR, `parsed_${department}courses.json`);

    console.log(`\n---------- Pipeline Start: ${department.toUpperCase()} ----------`);
    await fs.mkdir(DATA_DIR, { recursive: true });

    // 1. Scrape Data
    if (await getConfirmationInput("Scraping")) {
      ranScraping = true;
      console.log(`\n[1/3] Scraping data for ${department}...`);
      const url = `https://apps.ualberta.ca/catalogue/course/${department}`;
      const { data: htmlContent } = await axios.get(url);
      scrapedData = await parseCoursesHTML(htmlContent);
      if (!scrapedData || scrapedData.length === 0)
        throw new Error(`Scraping failed or returned no data.`);
      await fs.writeFile(rawDataPath, JSON.stringify(scrapedData, null, 2));
      console.log(`✅ Scraped ${scrapedData.length} raw courses to ${rawDataPath}`);
    } else {
      console.log(
        `\n[1/3] Skipping scraping. Data will be loaded from ${rawDataPath}.\n` +
          `If you want to scrape again, delete the file and rerun the script.`,
      );
      scrapedData = await fs
        .readFile(rawDataPath, "utf-8")
        .then((data) => JSON.parse(data) as RawCourse[]);

      if (scrapedData.length === 0) {
        console.log(`\n[1/3] No data to parse. Please scrape data first or check ${rawDataPath}.`);
        return;
      }
    }

    // 2. Parse Data with AI
    if (await getConfirmationInput("AI Parsing (Keywords, Requirements)")) {
      ranParsing = true;
      const limit = await getNum(scrapedData, "parse");
      const start = await getStartNum(scrapedData, "parsing");
      const dataToParse = scrapedData.slice(start, start + limit);

      if (dataToParse.length === 0) console.log("\nNo courses selected for parsing.");
      else {
        console.log(
          `\n[2/3] AI Parsing ${dataToParse.length} courses (index ${start} to ${start + limit - 1})...`,
        );
        // AIparse should return ParsedCourseForCompiler[]
        parsedData = await AIparse(dataToParse);
        if (!parsedData) throw new Error(`AI Parsing failed.`);
        parsedData = parsedData.filter((p) => p != null);
        await fs.writeFile(parsedDataPath, JSON.stringify(parsedData, null, 2));
        console.log(`✅ Parsed ${parsedData.length} courses to ${parsedDataPath}`);
      }
    } else {
      console.log(
        `\n[2/3] Skipping AI parsing. Data will be loaded from ${parsedDataPath}.\n` +
          `If you want to parse again, delete the file and rerun the script.`,
      );
      parsedData = await fs
        .readFile(parsedDataPath, "utf-8")
        .then((data) => JSON.parse(data) as Course[]);
      if (parsedData.length === 0) {
        console.log(
          `\n[2/3] No data to parse. Please scrape data first or check ${parsedDataPath}.`,
        );
        return;
      }
    }

    if (parsedData.length === 0)
      parsedData = await fs
        .readFile(parsedDataPath, "utf-8")
        .then((data) => JSON.parse(data) as Course[]);

    // 3. Insert Data into Database
    const parsedFileExists = await checkFileExists(parsedDataPath);
    if (!parsedFileExists) {
      /* ... skip message ... */
    } else if (await getConfirmationInput("Database Insertion")) {
      console.log(`\n[3/3] Saving data from ${parsedDataPath} to Database...`);
      const saveResult = await saveCoursesToDB(department); // Call imported function
      if (!saveResult.success)
        console.warn(`⚠️ Database save finished with ${saveResult.failed} errors.`);
      else console.log(`✅ Database save completed successfully.`);
    } else {
      console.log(
        `\n[3/3] Skipping database insertion. Data saved to ${parsedDataPath}.\n` +
          `You can manually insert the data into the database using the saveToDB script.`,
      );
    }

    console.log("\n--- Pipeline Complete ---");
  } catch (error) {
    console.error("\n--- ❌ Pipeline Error ---");
    if (department) console.error(`  Department: ${department}`);
    console.error("  Error:", error instanceof Error ? error.message : error);
  } finally {
    console.log("\nData collection script finished.");
  }
}

runDataCollection().catch((e) => {
  console.error("❌ Critical error running data compiler:", e);
  process.exit(1);
});
