// --- START OF FILE scripts/processCourses.ts ---
import dbConnect from '../lib/dbConnect'; // Your MongoDB connection utility
import CourseModel, { ICourse } from '../models/course';
import { parseCourseDescription } from '../utils/parser'; // Adjust path as needed
import courses from '../../courses.json'
import path from 'path';
import { json } from 'express';

const CURRENT_DIR = path.resolve(__dirname, '..');
const BACKEND_DIR = path.resolve(CURRENT_DIR, '..');
const COURSE_DATA = path.join(BACKEND_DIR, 'courses.json'); // Adjust path as needed


// --- Dummy function - Replace with your actual data fetching logic ---
async function getAllRawCourses(): Promise<Array<{ 
    courseCode: string; 
    title: string; 
    description: string 
}>> {
    // Example: Load from a JSON file, another DB, or re-scrape
    console.log("Fetching raw course data...");
    const rawCourses = courses.map((course: ICourse) => ({
        courseCode: course.courseCode,
        title: course.title,
        description: course.rawDescription,
    
    }));
    return rawCourses;
}
// --- End Dummy Function ---

async function processAndSaveCourses() {
    console.log('Connecting to database...');
    await dbConnect();
    console.log('Database connected.');

    const rawCourses = await getAllRawCourses();
    console.log(`Found ${rawCourses.length} raw courses to process.`);

    let successCount = 0;
    let failCount = 0;

    for (const rawCourse of rawCourses) {
        console.log(`\nProcessing course: ${rawCourse.courseCode} - ${rawCourse.title}`);

        // Optional: Check if already processed recently
        const existingCourse = await CourseModel.findOne({ courseCode: rawCourse.courseCode });
        if (existingCourse?.parsingStatus === 'success' && existingCourse.lastParsedAt) {
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            if (existingCourse.lastParsedAt > twentyFourHoursAgo) {
                console.log(`Skipping ${rawCourse.courseCode}, already parsed successfully recently.`);
                successCount++; // Count previously successful ones as success for this run
                continue;
            }
        }


        const parsedData = await parseCourseDescription(rawCourse.description);

        if (parsedData) {
            console.log(`Successfully parsed: ${rawCourse.courseCode}`);
            try {
                await CourseModel.findOneAndUpdate(
                    { courseCode: rawCourse.courseCode }, // Find by unique course code
                    {
                        $set: {
                            title: rawCourse.title, // Update title in case it changed
                            rawDescription: rawCourse.description,
                            parsedDescription: parsedData.description,
                            requirements: parsedData.requirements,
                            parsingStatus: 'success',
                            lastParsedAt: new Date(),
                        },
                        $setOnInsert: { // Set these only if creating a new document
                            courseCode: rawCourse.courseCode,
                        }
                    },
                    {
                        upsert: true, // Create if doesn't exist, update if it does
                        new: true, // Return the updated document (optional)
                        runValidators: true, // Ensure schema validation runs on update
                    }
                );
                console.log(`Saved to DB: ${rawCourse.courseCode}`);
                successCount++;
            } catch (dbError) {
                console.error(`Failed to save ${rawCourse.courseCode} to DB:`, dbError);
                failCount++;
                // Optionally update status to failed even if parsing worked but DB failed
                 await CourseModel.findOneAndUpdate(
                    { courseCode: rawCourse.courseCode },
                    { parsingStatus: 'failed', lastParsedAt: new Date() },
                    { upsert: true } // Create if doesn't exist
                 );
            }
        } else {
            console.error(`Failed to parse: ${rawCourse.courseCode}`);
            failCount++;
            // Update status to 'failed' in DB
            try {
                 await CourseModel.findOneAndUpdate(
                    { courseCode: rawCourse.courseCode },
                    {
                        $set: {
                           title: rawCourse.title, // Still save basic info
                           rawDescription: rawCourse.description,
                           parsingStatus: 'failed',
                           lastParsedAt: new Date(),
                           // Clear old parsed data if desired
                           // parsedDescription: undefined,
                           // requirements: undefined,
                        },
                         $setOnInsert: {
                            courseCode: rawCourse.courseCode,
                        }
                    },
                    { upsert: true, runValidators: true }
                 );
                 console.log(`Marked as failed in DB: ${rawCourse.courseCode}`);
            } catch (dbError) {
                 console.error(`Failed to mark ${rawCourse.courseCode} as failed in DB:`, dbError);
            }
        }

        // Optional: Add a small delay to avoid hitting API rate limits if processing many courses
        // await new Promise(resolve => setTimeout(resolve, 500)); // 0.5 second delay
    }

    console.log(`\nProcessing complete. Success: ${successCount}, Failed: ${failCount}`);
    // Close DB connection if necessary (depends on your dbConnect setup)
    // await mongoose.connection.close();
}

processAndSaveCourses().catch(err => {
    console.error("Unhandled error during course processing:", err);
    process.exit(1);
});

// --- END OF FILE scripts/processCourses.ts ---