# Graph State Management with Zustand

This document outlines how to implement a Zustand store for graph displays in the University Planner application.

## Why Use Zustand for Graph State Management

1. **Centralized State**: Consolidate all graph-related state (nodes, edges, view preferences, loading states) in one place
2. **Persist User Interactions**: Maintain node positions and user customizations between component mounts
3. **Simplified Component Logic**: Move data fetching and transformation logic out of components
4. **Consistency with React Flow**: Better alignment with React Flow's internal state management (which uses Zustand)
5. **Cross-Component Access**: Allow different parts of the application to access graph data without prop drilling

## Store Structure

```typescript
// utils/store/useGraphStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  InputNode as SimpleInputNode,
  AppEdge as SimpleAppEdge,
} from "@/components/SimplePrerequisiteGraphDisplay";
import type {
  InputNode as DetailedInputNode,
  AppEdge as DetailedAppEdge,
} from "@/components/DetailedPrerequisiteGraph";

interface GraphState {
  // Current view mode
  currentView: "simple" | "detailed";

  // Simple graph data
  simpleNodes: SimpleInputNode[];
  simpleEdges: SimpleAppEdge[];

  // Detailed graph data
  detailedNodes: DetailedInputNode[];
  detailedEdges: DetailedAppEdge[];

  // Loading states
  isLoadingSimpleGraph: boolean;
  isLoadingDetailedGraph: boolean;

  // Error states
  simpleGraphError: string | null;
  detailedGraphError: string | null;

  // Tracking what has been loaded
  simpleGraphLoaded: boolean;
  detailedGraphLoaded: boolean;

  // Current course context
  currentCourse: {
    id: string;
    department: string;
    code: string;
  } | null;

  // Actions
  setCurrentView: (view: "simple" | "detailed") => void;
  setSimpleGraphData: (nodes: SimpleInputNode[], edges: SimpleAppEdge[]) => void;
  setDetailedGraphData: (nodes: DetailedInputNode[], edges: DetailedAppEdge[]) => void;
  fetchDetailedGraphData: (department: string, code: string) => Promise<void>;
  resetGraphData: () => void;
  updateNodePosition: (nodeId: string, position: { x: number; y: number }) => void;
}

const useGraphStore = create<GraphState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentView: "simple",
      simpleNodes: [],
      simpleEdges: [],
      detailedNodes: [],
      detailedEdges: [],
      isLoadingSimpleGraph: false,
      isLoadingDetailedGraph: false,
      simpleGraphError: null,
      detailedGraphError: null,
      simpleGraphLoaded: false,
      detailedGraphLoaded: false,
      currentCourse: null,

      // Actions
      setCurrentView: (view) => set({ currentView: view }),

      setSimpleGraphData: (nodes, edges) =>
        set({
          simpleNodes: nodes,
          simpleEdges: edges,
          simpleGraphLoaded: true,
          simpleGraphError: null,
        }),

      setDetailedGraphData: (nodes, edges) =>
        set({
          detailedNodes: nodes,
          detailedEdges: edges,
          detailedGraphLoaded: true,
          detailedGraphError: null,
        }),

      fetchDetailedGraphData: async (department, code) => {
        const { detailedGraphLoaded, currentCourse } = get();

        // If data is already loaded for the current course, don't fetch again
        if (
          detailedGraphLoaded &&
          currentCourse?.department === department &&
          currentCourse?.code === code
        ) {
          return;
        }

        set({ isLoadingDetailedGraph: true, detailedGraphError: null });

        try {
          const response = await fetch(`/api/courses/${department}/${code}/detailed-graph`);

          if (!response.ok) {
            throw new Error(
              `Failed to fetch detailed graph: ${response.status} ${response.statusText}`,
            );
          }

          const data = await response.json();

          set({
            detailedNodes: data.nodes || [],
            detailedEdges: data.edges || [],
            detailedGraphLoaded: true,
            currentCourse: { id: `${department}-${code}`, department, code },
          });
        } catch (error) {
          set({
            detailedGraphError:
              error instanceof Error ? error.message : "Failed to load detailed graph",
          });
          console.error("Error fetching detailed graph data:", error);
        } finally {
          set({ isLoadingDetailedGraph: false });
        }
      },

      resetGraphData: () =>
        set({
          simpleNodes: [],
          simpleEdges: [],
          detailedNodes: [],
          detailedEdges: [],
          simpleGraphLoaded: false,
          detailedGraphLoaded: false,
          simpleGraphError: null,
          detailedGraphError: null,
        }),

      updateNodePosition: (nodeId, position) => {
        const { currentView, simpleNodes, detailedNodes } = get();

        if (currentView === "simple") {
          set({
            simpleNodes: simpleNodes.map((node) =>
              node.id === nodeId ? { ...node, position } : node,
            ),
          });
        } else {
          set({
            detailedNodes: detailedNodes.map((node) =>
              node.id === nodeId ? { ...node, position } : node,
            ),
          });
        }
      },
    }),
    {
      name: "graph-storage", // Name for localStorage
      partialize: (state) => ({
        // Only persist these values to localStorage
        currentView: state.currentView,
        // Optionally persist node positions if you want layouts to be remembered
        simpleNodes: state.simpleNodes.map(({ id, position }) => ({ id, position })),
        detailedNodes: state.detailedNodes.map(({ id, position }) => ({ id, position })),
      }),
    },
  ),
);

export default useGraphStore;
```

## Integration with React Flow

React Flow already uses Zustand internally, but you'll need to modify your components to use your custom store. Here's how to integrate:

### 1. Modify SimplePrerequisiteGraphDisplay.tsx

Instead of using the local state with `useNodesState` and `useEdgesState`, connect to the Zustand store:

```typescript
import useGraphStore from "@/utils/store/useGraphStore";

const PrerequisiteGraphLayout = ({
  initialNodes,
  initialEdges,
  theme,
}: PrerequisiteGraphLayoutProps) => {
  const { fitView } = useReactFlow();
  const router = useRouter();

  // Get state from Zustand store
  const {
    simpleNodes: nodes,
    simpleEdges: edges,
    updateNodePosition
  } = useGraphStore();

  // Set initial data if provided and nodes are empty
  useEffect(() => {
    if (initialNodes.length > 0 && initialEdges.length > 0) {
      useGraphStore.getState().setSimpleGraphData(initialNodes, initialEdges);
    }
  }, [initialNodes, initialEdges]);

  // Handle node movements
  const onNodeDragStop = (_event: React.MouseEvent, node: Node) => {
    updateNodePosition(node.id, node.position);
  };

  // ... rest of component logic
```

### 2. Modify DetailedPrerequisiteGraph.tsx

Similar changes would be made to the DetailedPrerequisiteGraph component.

## Example Usage in Components

### CourseResultDisplay.tsx

```typescript
import useGraphStore from "@/utils/store/useGraphStore";

export function CourseResultDisplay({
  targetCourse,
  simpleGraphNodes,
  simpleGraphEdges,
  department,
  code,
  requiredByCourses,
  corequisiteForCourses,
}: CourseResultDisplayProps) {
  // Use the graph store
  const {
    currentView,
    setCurrentView,
    setSimpleGraphData,
    fetchDetailedGraphData,
    isLoadingDetailedGraph,
    detailedGraphError,
    detailedNodes,
    resetGraphData
  } = useGraphStore();

  // Reset data when course changes
  useEffect(() => {
    resetGraphData();
    setSimpleGraphData(simpleGraphNodes, simpleGraphEdges);
    setCurrentView("simple");
  }, [targetCourse.id, targetCourse.courseCode]);

  // Handle view toggle
  const handleViewToggle = (view: "detailed" | "simple") => {
    setCurrentView(view);

    // Fetch detailed graph data if switching to detailed view
    if (view === "detailed") {
      fetchDetailedGraphData(department, code);
    }
  };

  // ... rest of component
```

## Migration Strategy

1. **Incremental Approach**:

   - First, create the store but keep using your current implementation
   - Connect one component at a time to the store
   - Validate each change before moving to the next component

2. **Data Synchronization**:

   - During transition, you may need to sync data between props and store
   - Consider adding effects that update the store when props change

3. **Testing**:
   - Add unit tests for the store logic
   - Test components with the store in isolation

## Performance Optimizations

1. **Selective Rendering**:

   - Use selectors to prevent unnecessary re-renders

   ```typescript
   const nodes = useGraphStore((state) =>
     state.currentView === "simple" ? state.simpleNodes : state.detailedNodes,
   );
   ```

2. **Memorization**:

   - Use `useMemo` for computed values derived from store data

3. **Batched Updates**:

   - Zustand already batches updates, but you can further optimize by grouping related state changes

4. **Lazy Loading**:
   - Only fetch detailed graph data when needed

## Additional Features to Consider

1. **Graph Layout Persistence**:

   - Save and restore user-customized layouts

2. **Zoom and Pan State**:

   - Preserve view position and zoom level between renders

3. **Node Selection**:

   - Track selected nodes in the store

4. **Graph Minimap**:

   - Add a minimap with state tracked in the store

5. **Undo/Redo**:
   - Implement history tracking for graph interactions

## Conclusion

Implementing a Zustand store for graph management can significantly improve the maintainability and extensibility of your React Flow graphs. It centralizes state management, simplifies components, and enables new features like persistent layouts and cross-component access to graph data.

While it requires some refactoring, the benefits can be substantial for complex graph visualizations or when user interaction with the graphs becomes more important.
