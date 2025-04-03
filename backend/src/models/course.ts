import { Schema, model, Document } from 'mongoose';

// Remove unnecessary import from 'events'
// import { defaultMaxListeners } from 'events'; 

export enum Operator {
  AND = 'AND',
  OR = 'OR',
  STANDALONE = 'STANDALONE',
  WILDCARD = 'WILDCARD'
}

export interface Condition {
  operator: Operator;
  courses?: string[];
  pattern?: string;
}

export interface CourseRequirements {
  prerequisites: {
    operator: Operator;
    conditions: Condition[];
  };
  corequisites?: {
    operator: Operator;
    conditions: Condition[];
  };
  notes?: string;
}

export interface ICourse extends Document {
  code: string;
  title: string;
  description: string;
  requirements?: CourseRequirements;
  // Add these fields to accommodate simple API operations
  prerequisites?: string[];
  corequisites?: string[];
}

const CourseSchema = new Schema<ICourse>({
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  requirements: {
    prerequisites: {
      operator: { type: String, enum: Object.values(Operator), default: Operator.AND },
      conditions: [{
        operator: { type: String, enum: Object.values(Operator), required: true },
        courses: { type: [String] },
        pattern: { type: String }
      }]
    },
    corequisites: {
      operator: { type: String, enum: Object.values(Operator), default: Operator.AND },
      conditions: [{
        operator: { type: String, enum: Object.values(Operator), required: true },
        courses: { type: [String] },
        pattern: { type: String }
      }]
    },
    notes: String
  },
  // Simple fields for backward compatibility with current API
  prerequisites: [String],
  corequisites: [String]
});

// Export both types and the model
export { ICourse as CourseDocument };
export const Course = model<ICourse>('Course', CourseSchema);