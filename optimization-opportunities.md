# Optimization Opportunities for University Planner

This document outlines potential optimization and refactoring opportunities for the University Planner application, with a focus on improving performance, maintainability, and user experience.

## 1. Memoization Opportunities

React Flow components frequently recompute layouts and process node/edge data. Consider these optimizations:

### High Impact:
- Memoize graph layout calculations to prevent recalculation on every render
- Use `React.memo()` for child components that don't change frequently
- Apply `useMemo()` to expensive computations in graph rendering

### Implementation Example:
```tsx
// Before
const layoutedElements = getLayoutedElements(transformedNodes, transformedEdges, "TB", theme);

// After
const layoutedElements = useMemo(() => 
  getLayoutedElements(transformedNodes, transformedEdges, "TB", theme),
  [transformedNodes, transformedEdges, theme]
);
```

## 2. Efficient Rendering in React Flow

React Flow is performance-intensive, especially with large graphs:

### High Impact:
- Use `useCallback` for all event handlers to prevent recreation on each render
- Split large components into smaller, more focused ones
- Reduce unnecessary `fitView()` calls which trigger expensive recalculations

### Implementation Example:
```tsx
// Before
const handleNodeClick = (_event: React.MouseEvent, node: Node<GraphNodeData>) => {
  if (node.data && node.data.nodeType === "course") {
    const courseCodeFull = node.id;
    // Navigation logic...
  }
};

// After
const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node<GraphNodeData>) => {
  if (node.data && node.data.nodeType === "course") {
    const courseCodeFull = node.id;
    // Navigation logic...
  }
}, [/* dependencies */]);
```

## 3. Data Fetching Optimization

Improve the data fetching patterns, especially for graph data:

### High Impact:
- Implement proper caching using React Query
- Move data fetching logic to custom hooks
- Add error boundaries specific to graph components

### Implementation Example:
```tsx
// Create a custom hook
function useDetailedGraphData(department: string, code: string) {
  return useQuery({
    queryKey: ['detailedGraph', department, code],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${department}/${code}/detailed-graph`);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// In component
const { data, isLoading, error } = useDetailedGraphData(department, code);
```

## 4. Theme Handling

Current implementation recalculates theme-dependent styles on each render:

### Medium Impact:
- Extract theme-specific styles into constants or memoized values
- Use CSS variables for theme colors instead of conditional inline styles
- Consider a more efficient theming approach

### Implementation Example:
```tsx
// Before
style={theme === "dark" ? { backgroundColor: "#1a1a1a" } : { backgroundColor: "#FFFFFF" }}

// After - Using CSS variables in your global styles
className={`bg-theme-background ${theme === "dark" ? "dark" : "light"}`}

// In your CSS
:root {
  --theme-background: #FFFFFF;
}
.dark {
  --theme-background: #1a1a1a;
}
.bg-theme-background {
  background-color: var(--theme-background);
}
```

## 5. Component Structure Refactoring

Several components have mixed responsibilities:

### Medium Impact:
- Separate data fetching, data transformation, and rendering concerns
- Create specialized utility functions for graph processing
- Implement clear boundaries between different responsibilities

### Implementation Example:
```tsx
// Before: Mixed concerns in component
function CourseResultDisplay() {
  // Data fetching
  // Data transformation
  // Rendering logic
  // Event handling
  // All mixed together
}

// After: Separated concerns
function useCourseData(courseId) {
  // Data fetching only
}

function transformCourseData(data) {
  // Pure function for data transformation
}

function CourseResultDisplay() {
  const { data, isLoading } = useCourseData(courseId);
  const transformedData = useMemo(() => 
    transformCourseData(data),
    [data]
  );
  // Rendering logic only
}
```

## 6. Bundle Size and Code Splitting

React Flow is a large library, and bundle size may impact performance:

### Medium Impact:
- Extend dynamic imports for more components
- Consider code-splitting more aggressively
- Evaluate if you need all the React Flow features

### Implementation Example:
```tsx
// Consider more granular code splitting
const CourseGraph = dynamic(() => 
  import('@/components/graphs/CourseGraph').then(mod => mod.CourseGraph), 
  { 
    ssr: false,
    loading: () => <GraphLoadingPlaceholder />
  }
);
```

## 7. State Management

Consider centralizing complex state management:

### High Impact:
- Implement a Zustand store for graph state (see graph-store-implementation.md)
- Use selective rendering with store selectors
- Add persistence for user graph preferences

### Implementation Example:
```tsx
// See utils/store/graph-store-implementation.md for detailed implementation
import useGraphStore from "@/utils/store/useGraphStore";

function GraphComponent() {
  // Get only what this component needs
  const { 
    nodes, 
    edges, 
    updateNodePosition 
  } = useGraphStore(state => ({
    nodes: state.currentView === "simple" ? state.simpleNodes : state.detailedNodes,
    edges: state.currentView === "simple" ? state.simpleEdges : state.detailedEdges,
    updateNodePosition: state.updateNodePosition
  }));
  
  // Rest of component...
}
```

## 8. Event Handling

Current event handling can be optimized:

### Medium Impact:
- Use `useCallback` for all event handlers
- Implement debouncing for handlers that fire frequently
- Consider using the Event Delegation pattern

### Implementation Example:
```tsx
// Add debouncing for handlers that might fire frequently
import { useCallback } from 'react';
import useDebounce from '@/hooks/useDebounce';

function GraphComponent() {
  const handleZoom = useCallback((evt) => {
    // Handle zoom
  }, []);
  
  const debouncedHandleZoom = useDebounce(handleZoom, 100);
  
  // Use debouncedHandleZoom instead of handleZoom
}
```

## 9. Virtual Rendering for Large Lists

If displaying large lists of courses:

### High Impact (for large datasets):
- Consider virtual rendering libraries (react-window, react-virtualized)
- Only render visible elements to improve performance
- Implement pagination for large datasets

### Implementation Example:
```tsx
import { FixedSizeList } from 'react-window';

function CourseList({ courses }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <CourseItem course={courses[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={500}
      width="100%"
      itemCount={courses.length}
      itemSize={60}
    >
      {Row}
    </FixedSizeList>
  );
}
```

## 10. Performance Testing and Monitoring

Add proper performance monitoring:

### Medium Impact:
- Add performance measurement (React Profiler, Lighthouse)
- Create performance tests as part of CI/CD
- Monitor real-user performance metrics

## Implementation Priority

Focus on these optimizations in this order for maximum impact:

1. Add memoization to prevent expensive recalculations
2. Implement proper data fetching patterns with caching
3. Refactor component structure to separate concerns
4. Consider implementing Zustand store for complex graph state
5. Optimize React Flow rendering
6. Improve theme handling
7. Address event handling optimizations
8. Further code splitting and bundle size optimization

## Conclusion

These optimizations will help maintain good performance as your application grows, particularly if you add more complex graph interactions in the future. The improvements are ordered roughly by impact vs. implementation effort, with higher-impact changes listed first.