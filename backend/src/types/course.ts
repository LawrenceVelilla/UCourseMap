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