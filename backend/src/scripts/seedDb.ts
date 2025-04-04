// scripts/seedDb.ts
import { MongoClient, ObjectId } from 'mongodb';
import { ProcessedCourseDataforDB } from '../models/course';
import fs from 'fs/promises';
import path from 'path';



async function seedFromJson(filePath: string) {
    try {
        console.log(`Reading JSON data from: ${filePath}`);
        const jsonData = await fs.readFile(filePath, 'utf-8');
        const coursesArray: ProcessedCourseDataforDB[] = JSON.parse(jsonData); // Assumes JSON is an array of Course objects

        if (!Array.isArray(coursesArray)) {
            throw new Error('JSON data is not an array.');
        }

        console.log(`Parsed ${coursesArray.length} courses from JSON.`);

        // Optional: Add preprocessing here if your JSON doesn't exactly match
        // the final schema (e.g., generate flattenedPrerequisites)
        // coursesArray.forEach(course => {
        //     if (course.prerequisites?.rule) {
        //         course.flattenedPrerequisites = extractCoursesFromRule(course.prerequisites.rule);
        //     }
        //     // Add similar logic for corequisites, generate ObjectIds if needed, etc.
        // });


        const coursesCollection = await '';

        // Optional: Clear existing data first (use with caution!)
        // await coursesCollection.deleteMany({});
        // console.log('Cleared existing courses collection.');

        if (coursesArray.length > 0) {
            console.log('Inserting courses into database...');
            const result = await coursesCollection.insertMany(coursesArray);
            console.log(`Successfully inserted ${result.insertedCount} documents.`);
        } else {
            console.log('No courses found in JSON file to insert.');
        }

    } catch (error) {
        console.error('Error seeding database from JSON:', error);
    } finally {
        // Close MongoDB client if your connectToDatabase doesn't handle caching/pooling well
        // await client.close(); // Assuming client is accessible here
    }
}

// Load environment variables if using dotenv (optional, Next.js handles .env.local)
// require('dotenv').config({ path: '../.env.local' }); // Adjust path

seedFromJson(path.join(__dirname, '../../parsed_courses.json'))