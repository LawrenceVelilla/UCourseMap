import { defaultMaxListeners } from 'events';
import { Schema, model, Document } from 'mongoose';

enum Operator {
  AND = 'AND',
  OR = 'OR',
  STANDALONE = 'STANDALONE',
  WILDCARD = 'WILDCARD'
}

interface Condition extends Document {
  operator: Operator;
  courses?: string[];
  pattern?: string;
}

interface CourseRequirements extends Document {
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

interface ICourse extends Document {
  code: string;
  title: string;
  description: string;
  requirements: CourseRequirements;
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
  }
});

export { Operator, Condition, CourseRequirements, ICourse };
export default model<ICourse>('Course', CourseSchema);