// --- START OF FILE models/course.ts ---
import mongoose, { Schema, Document } from 'mongoose';

// Define interfaces for the nested requirement structures
// This provides better type safety than mongoose.Schema.Types.Mixed
interface RequirementCondition {
    operator: 'AND' | 'OR' | 'STANDALONE' | 'WILDCARD';
    conditions?: RequirementCondition[]; // For nested AND/OR
    courses?: string[];               // For OR/STANDALONE
    pattern?: string;                 // For WILDCARD
    description?: string;             // For WILDCARD description
}

// Interface for the main requirements object stored in the DB
export interface CourseRequirements {
    prerequisites?: RequirementCondition;
    corequisites?: RequirementCondition;
    notes?: string;
}

// Interface for the Course document
export interface ICourse extends Document {
    courseCode: string; // e.g., "CMPUT 174"
    title: string;
    rawDescription: string; // The original description scraped
    parsedDescription?: string; // The description extracted by OpenAI
    requirements?: CourseRequirements; // The structured requirements from OpenAI
    lastParsedAt?: Date;
    parsingStatus: 'pending' | 'success' | 'failed'; // To track processing
    // Add other fields like credits, faculty, etc. if you have them
}

// Define the schema for the raw scraped course data
export interface RawCourse {
    code: string; // e.g., "CMPUT 174"
    title: string;
    units: {
        credits: number;
        feeIndex: number;
        term: string;
    }
    description: string; // The original description scraped
    url: string; // The URL of the course page
}
    

const RequirementConditionSchema = new Schema<RequirementCondition>({
    operator: { type: String, required: true, enum: ['AND', 'OR', 'STANDALONE', 'WILDCARD'] },
    conditions: [{ type: Schema.Types.Mixed /* Self-reference */ }], // Using Mixed for flexibility in nesting
    courses: [{ type: String }],
    pattern: { type: String },
    description: { type: String },
}, { _id: false }); // No separate _id for subdocuments

// Recursive definition workaround for Mongoose
RequirementConditionSchema.add({ conditions: [RequirementConditionSchema] });

const CourseRequirementsSchema = new Schema<CourseRequirements>({
    prerequisites: RequirementConditionSchema,
    corequisites: RequirementConditionSchema,
    notes: String,
}, { _id: false });

const CourseSchema = new Schema<ICourse>({
    courseCode: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    rawDescription: { type: String, required: true },
    parsedDescription: { type: String },
    requirements: CourseRequirementsSchema,
    lastParsedAt: { type: Date },
    parsingStatus: { type: String, required: true, enum: ['pending', 'success', 'failed'], default: 'pending' },
}, { timestamps: true }); // Adds createdAt and updatedAt automatically

export interface ProcessedCourseDataforDB {
    courseCode: string;
    title: string;
    units?:{
        credits: number;
        feeIndex: number;
        term: string;
    }
    term?: string;
    rawDescription: string;
    parsedDescription?: string;
    parsingStatus?: 'pending' | 'success' | 'failed';
    lastParsedAt?: Date;
    requirements?: CourseRequirements;
    url?: string;
}

// Avoid redefining the model if it's already compiled (useful for Next.js hot reloading)
export default mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);

// --- END OF FILE models/course.ts ---