// Define types locally instead of importing from backend
// This creates a proper separation between frontend and backend

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
    conditions?: Condition[];
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
  
  export interface Course {
    _id?: string;
    code: string;
    title: string;
    description?: string;
    requirements?: CourseRequirements;
    prerequisites?: string[];
    corequisites?: string[];
  }
  
  export default function RequirementTree({ condition }: { condition: Condition }) {
    return (
      <div className="ml-4 border-l-2 pl-2">
        {condition.operator === 'WILDCARD' ? (
          <div>Any course matching: {condition.pattern?.replace('^', '').replace('$', '')}</div>
        ) : condition.operator === 'STANDALONE' ? (
          <div>{condition.courses?.[0]}</div>
        ) : (
          <>
            <div className="font-bold">{condition.operator}:</div>
            {condition.courses?.map((course, i) => (
              <div key={i}>{course}</div>
            ))}
            {condition.conditions?.map((cond, i) => (
              <RequirementTree key={i} condition={cond} />
            ))}
          </>
        )}
      </div>
    );
  }