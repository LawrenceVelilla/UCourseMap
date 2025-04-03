import { Course } from '../../backend/src/models/course';

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