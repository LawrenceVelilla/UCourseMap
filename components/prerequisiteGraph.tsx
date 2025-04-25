<<<<<<< HEAD
=======
"use client";
import React, { useEffect, useMemo } from "react";
import dagre from "dagre";
import { useTheme } from "next-themes";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Node,
  Edge,
  Position,
  MarkerType,
  ReactFlowProvider,
} from "@xyflow/react";
import { useRouter } from "next/navigation";
>>>>>>> 2189e6d (feat: Implement Intial MVP for the Plan Builder and Program Planner)

'use client'
import React, { useEffect, useMemo } from 'react';
import dagre from 'dagre'; 
import { useTheme } from 'next-themes';
import {
    ReactFlow,
    Controls,
    Background,
    BackgroundVariant, 
    useNodesState,
    useEdgesState,
    useReactFlow,
    Node,        
    Edge,        
    Position,    
    MarkerType,   
    ReactFlowProvider 
} from '@xyflow/react';
import { useRouter } from 'next/navigation';

import '@xyflow/react/dist/style.css';

// --- Type Definitions ---
// TODO: Consider moving these types to a dedicated ./lib/types.ts file

// Data shape for graph nodes, used within this component.
export interface GraphNodeData extends Record<string, unknown> {
  label: string;      // Display text (e.g., "MATH 101" or "Min. grade C-")
  isCourse: boolean;  // True if the node represents a course, false for text requirements.
  type?: 'target' | 'prerequisite' | 'text_requirement'; // Helps differentiate node roles for styling or logic.
}

// Specific React Flow Node type used internally by hooks and components.
export type AppNode = Node<GraphNodeData>;

// Specific React Flow Edge type (can be extended later if needed).
export type AppEdge = Edge;

// Simplified node type used for props passed *into* the graph component.
// Omits properties automatically handled by React Flow or layout.
export interface InputNode extends Omit<AppNode, 'position' | 'width' | 'height' | 'style' | 'selected' | 'dragging' | 'selectable' | 'draggable' | 'hidden' | 'resizing' | 'focusable' | 'sourcePosition' | 'targetPosition'> {
  style?: React.CSSProperties; // Allow optional style overrides from the parent.
}

// Props definition for the main graph component.
export interface PrerequisiteGraphProps {
  initialNodes: InputNode[]; // Nodes received from the parent wrapper.
  initialEdges: AppEdge[];   // Edges received from the parent wrapper.
}

// Add theme to props
export interface PrerequisiteGraphLayoutProps extends PrerequisiteGraphProps {
    theme?: string; // Add theme prop (optional)
}

// --- Configuration & Styling ---

// TODO: This comment relates to an old approach, edge colors are now based on depth.
// // To-DO: Remember to update the component rendering the graph to use edge.data.depth for styling.
// //       - Use edge.data.depth to determine color difference for the edges so we can see which is actually a direct prerequisite.

// Initialize Dagre graph for layout calculations.
const dagreGraph = new dagre.graphlib.Graph({ compound: false });
dagreGraph.setDefaultEdgeLabel(() => ({})); // Default empty label for edges.

// Standard dimensions for graph nodes.
const nodeWidth = 180; 
const nodeHeight = 45; 

// Function to get styles based on theme
const getNodeStyles = (theme?: string) => {
    const isDark = theme === 'dark';

    const targetNodeStyle: React.CSSProperties = {
        background: isDark ? 'hsl(var(--primary))' : '#606c5d', // Use primary for dark target
        color: isDark ? 'hsl(var(--primary-foreground))' : '#fff',
        border: `1px solid ${isDark ? 'hsl(var(--border))' : '#3a4139'}`,
        borderRadius: '4px', width: nodeWidth, padding: '8px 12px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', height: nodeHeight, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer'
    };
    const prereqNodeStyle: React.CSSProperties = {
        background: isDark ? 'hsl(var(--secondary))' : '#f0f0e8', // Use secondary for dark prereq
        color: isDark ? 'hsl(var(--secondary-foreground))' : '#333',
        border: `1px solid ${isDark ? 'hsl(var(--border))' : '#d1d1c4'}`,
        borderRadius: '4px', width: nodeWidth, padding: '8px 12px', textAlign: 'center', fontSize: '14px', height: nodeHeight, display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer'
    };
    const textNodeStyle: React.CSSProperties = {
        background: isDark ? 'hsl(var(--muted))' : '#fefae0d', // Use muted for dark text
        color: '#283618', // Define a dark text color if needed
        border: `1px dashed ${isDark ? 'hsl(var(--muted-foreground))' : '#e6db74'}`,
        borderRadius: '4px', width: nodeWidth, padding: '8px 12px', textAlign: 'center', fontSize: '12px', fontStyle: 'italic', height: nodeHeight, display: 'flex', alignItems: 'center', justifyContent: 'center'
    };

    return { targetNodeStyle, prereqNodeStyle, textNodeStyle };
};

// Base style for edges (stroke color is applied dynamically).
const defaultEdgeStyle: React.CSSProperties = {
    strokeWidth: 1.5,
    // stroke: '#7d8a70', // REMOVED - Color is now set dynamically based on level.
};

// Base style for edge markers (arrowheads). Color is applied dynamically.
const defaultMarkerEnd = {
    type: MarkerType.ArrowClosed,
    // color: '#7d8a70', // REMOVED - Color is now set dynamically based on level.
    width: 18,
    height: 18,
};

// Color palette for different prerequisite levels (depth).
export const levelColors = ['#283618', '#dda15e', '#a3b18a', '#dad7cd'];
// Fallback color used if depth is missing or exceeds palette size.
const defaultEdgeColor = levelColors[levelColors.length - 1]; 

// Type for specifying layout orientation.
type LayoutDirection = 'TB' | 'LR';

// --- Layout Function ---

/**
 * Calculates node positions using Dagre layout algorithm.
 * @param nodesToLayout Nodes passed from the parent component.
 * @param edgesToLayout Edges passed from the parent component.
 * @param direction Layout direction ('TB' for top-to-bottom, 'LR' for left-to-right).
 * @returns An object containing nodes with calculated positions and styled edges.
 */
const getLayoutedElements = (
<<<<<<< HEAD
    nodesToLayout: Node<GraphNodeData>[], 
    edgesToLayout: Edge[],
    direction: LayoutDirection,
    theme?: string // Add theme parameter
=======
  nodesToLayout: Node<GraphNodeData>[],
  edgesToLayout: Edge[],
  direction: LayoutDirection,
  theme?: string, // Add theme parameter
>>>>>>> 2189e6d (feat: Implement Intial MVP for the Plan Builder and Program Planner)
): { nodes: AppNode[]; edges: AppEdge[] } => {

    // Get theme-based styles
    const { targetNodeStyle, prereqNodeStyle, textNodeStyle } = getNodeStyles(theme);

<<<<<<< HEAD
    // Configure Dagre graph settings.
    dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 60, marginx: 20, marginy: 20 });

    // Clear previous graph elements to prevent errors on re-layout.
    dagreGraph.nodes().forEach((nodeId: string) => { try { dagreGraph.removeNode(nodeId); } catch (e) { /* Ignore if node not found */ } });
    dagreGraph.edges().forEach(edge => { try { dagreGraph.removeEdge(edge.v, edge.w); } catch (e) { /* Ignore if edge not found */ } });

    // Add nodes and edges to Dagre, providing dimensions for layout.
    edgesToLayout.forEach((edge) => { try { dagreGraph.setEdge(edge.source, edge.target); } catch(e) { console.error("Dagre setEdge failed:", e); } });
    nodesToLayout.forEach((node) => {
        const heightForLayout = node.height ?? nodeHeight;
        try { dagreGraph.setNode(node.id, { width: node.width ?? nodeWidth, height: heightForLayout }); } catch(e) { console.error("Dagre setNode failed:", e); }
    });

    // Execute the Dagre layout algorithm.
    try { dagre.layout(dagreGraph); }
    catch (layoutError) {
        console.error("Dagre layout failed:", layoutError);
        // Fallback: Return nodes with original (likely 0,0) positions if layout fails.
        return { nodes: nodesToLayout.map(n => ({...n, position: n.position ?? { x: 0, y: 0 } })), edges: edgesToLayout };
    }
=======
  // Clear previous graph elements to prevent errors on re-layout.
  dagreGraph.nodes().forEach((nodeId: string) => {
    try {
      dagreGraph.removeNode(nodeId);
    } catch (e) {
      console.error("Dagre removeNode failed:", e);
    }
  });
  dagreGraph.edges().forEach((edge) => {
    try {
      dagreGraph.removeEdge(edge.v, edge.w);
    } catch (e) {
      console.error("Dagre removeEdge failed:", e);
    }
  });
>>>>>>> 2189e6d (feat: Implement Intial MVP for the Plan Builder and Program Planner)

    // Process layout results and map back to React Flow node structure.
    const finalNodes: AppNode[] = nodesToLayout.map((node) => {
        const dagreNode = dagreGraph.node(node.id);
        const heightForLayout = node.height ?? nodeHeight; // Consistent height value.
        
        // Calculate position based on Dagre output, centered adjusted by node dimensions.
        const calculatedPosition = dagreNode
            ? { x: dagreNode.x - (node.width ?? nodeWidth) / 2, y: dagreNode.y - heightForLayout / 2 }
            : node.position; // Fallback to original position if node layout failed.

        // Determine source/target handle positions based on layout direction.
        const isHorizontal = direction === 'LR';
        const targetPosition = node.targetPosition ?? (isHorizontal ? Position.Left : Position.Top);
        const sourcePosition = node.sourcePosition ?? (isHorizontal ? Position.Right : Position.Bottom);

        // Select base style based on node type USING THEME-AWARE STYLES
        let baseStyle: React.CSSProperties;
        if (!node.data.isCourse) {
            baseStyle = textNodeStyle;
        } else if (node.data.type === 'target') {
            baseStyle = targetNodeStyle;
        } else {
            baseStyle = prereqNodeStyle;
        }
        // Merge base style with any custom styles passed via props.
        const finalStyle = { ...baseStyle, ...node.style }; 

        // Build the final React Flow node object with all required properties.
        const finalNode: AppNode = {
            id: node.id,
            position: calculatedPosition!, // Assert non-null as we have fallbacks.
            data: node.data,
            type: node.type ?? 'default', // Default React Flow node type.
            style: finalStyle,
            width: nodeWidth,
            height: nodeHeight, // Use standard height for rendering consistency.
            sourcePosition: sourcePosition,
            targetPosition: targetPosition,
            // Include default values for base properties expected by React Flow.
            selected: node.selected ?? false, dragging: node.dragging ?? false,
            selectable: node.selectable ?? true, draggable: node.draggable ?? false,
            hidden: node.hidden ?? false, resizing: node.resizing ?? false,
            focusable: node.focusable ?? true,
        };
        return finalNode;
    });

    // Process edges, applying level-based coloring.
    const finalEdges: AppEdge[] = edgesToLayout.map(edge => {
        // --- DEBUGGING: Log edge data to check depth ---
        // console.log('[Edge Data Check] ID:', edge.id, 'Data:', edge.data);
        // ------------------------------------------------

        // Determine edge color based on the 'depth' property from edge.data.
        // Assumes depth is 1-indexed (direct prerequisites are level 1).
        const depth = edge.data?.depth;
        let edgeColor = defaultEdgeColor; // Start with the fallback color.
        
        if (typeof depth === 'number' && depth >= 1 && depth <= levelColors.length) {
             edgeColor = levelColors[depth - 1]; // Select color from palette based on depth.
        } else if (typeof depth === 'number' && depth > levelColors.length) {
             edgeColor = levelColors[levelColors.length - 1]; // Use the last color for depths beyond the palette size.
        }
        // If depth is missing or not a number, the fallback color remains.

        // --- DEBUGGING: Log calculated color ---
        // console.log('[Edge Data Check] ID:', edge.id, 'Depth:', depth, 'Calculated Color:', edgeColor);
        // ---------------------------------------

        // Build the final React Flow edge object.
        const finalEdge: AppEdge = {
            id: edge.id,
            source: edge.source, target: edge.target,
            type: edge.type ?? 'smoothstep', // Use smoothstep for nice curved edges.
            style: {
                 ...defaultEdgeStyle, // Include base styles like strokeWidth.
                 stroke: edgeColor,    // Apply the calculated level-based color.
                 ...edge.style        // Allow specific edge style overrides from props.
            },
            markerEnd: {
                 ...defaultMarkerEnd, // Include base marker styles like type and size.
                 color: edgeColor,    // Apply the level-based color to the arrowhead.
                ...(typeof edge.markerEnd === 'object' ? edge.markerEnd : {}) // Allow specific marker style overrides from props.
            },
            // Include default values for base properties expected by React Flow.
            animated: edge.animated ?? false, selected: edge.selected ?? false,
            hidden: edge.hidden ?? false,
            // Keep original data, optionally add calculated color for debugging/state trigger.
            data: { ...edge.data, calculatedColor: edgeColor },
        };
        return finalEdge;
    });

    // Return the processed nodes and edges ready for React Flow.
    return { nodes: finalNodes, edges: finalEdges };
};

// --- React Flow Component ---

/**
 * Internal component that renders the React Flow graph and handles interactions.
 */
const PrerequisiteGraphLayout = ({ initialNodes, initialEdges, theme }: PrerequisiteGraphLayoutProps) => {
  const { fitView } = useReactFlow();
  const router = useRouter(); // Hook for programmatic navigation.
  // State management for nodes and edges within React Flow.
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<GraphNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>([]);

  /**
   * Handles clicks on graph nodes.
   * If a course node is clicked, navigates to that course's page.
   */
  const handleNodeClick = (_event: React.MouseEvent, node: Node<GraphNodeData>) => {
      // Only act on clicks if it's a course node (not a text requirement).
      if (node.data && node.data.isCourse) {
          const courseCodeFull = node.id; // Node ID is expected to be the full code (e.g., "MATH 101").
          // Attempt to parse department and code using regex.
          const match = courseCodeFull.match(/^([a-zA-Z]+)\s*(\d+[a-zA-Z]*)$/);

          if (match) {
              const department = match[1].toLowerCase();
              const code = match[2].toLowerCase();
              const url = `/courses/${department}/${code}`; // Construct the internal URL.
              // console.log(`Navigating to: ${url}`); // Debugging log.
              router.push(url); // Navigate to the course page.
          } else {
              // Log a warning if parsing fails (shouldn't happen with valid course codes).
              console.warn(`Could not parse course code from node ID: ${courseCodeFull}`);
          }
      } else {
          // Optional: Log clicks on non-course nodes for debugging.
          // console.log('Clicked non-course node:', node);
      }
  };

  // Update layout when nodes, edges, or theme change
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
      console.log("[Layout Update] Theme:", theme); // Debug log

      // Basic validation: Ensure props are arrays.
      if (!Array.isArray(initialNodes) || !Array.isArray(initialEdges)) {
         console.warn("Graph received invalid initialNodes or initialEdges.");
         return { nodes: [], edges: [] }; // Return empty layout
      }

      // 1. Transform InputNodes to Nodes with position/dimensions for layout
      const transformedNodes: Node<GraphNodeData>[] = initialNodes.map(n => ({
          id: n.id,
          data: n.data,
          position: { x: 0, y: 0 }, // Initial position (will be overwritten by layout).
          width: nodeWidth,         // Standard width for layout.
          height: nodeHeight,       // Standard height for layout.
          type: n.type ?? 'default',
          style: n.style,
          // Set default React Flow node properties.
          selected: false, dragging: false, selectable: true, draggable: false, hidden: false, resizing: false, focusable: true
      }));

      // 2. Prepare edges (usually requires less transformation).
      const transformedEdges: AppEdge[] = initialEdges.map(e => ({ ...e }));

      // 3. Calculate layout if there are nodes.
      if (transformedNodes.length === 0) {
          return { nodes: [], edges: [] };
      }

      return getLayoutedElements(transformedNodes, transformedEdges, 'TB', theme); // Pass theme here

  }, [initialNodes, initialEdges, theme]); // Add theme to dependencies

  // Effect to update React Flow state when layouted elements change
  useEffect(() => {
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      // Optional: Recenter view after layout possibly changes node positions drastically
      // requestAnimationFrame(() => fitView({ padding: 0.1 }));
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges, fitView]);

  // Render the React Flow component.
  return (
<<<<<<< HEAD
    <div style={{ height: '500px', width: '100%', border: '1px solid #d1d1c4', borderRadius: '5px' }}>
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            className="bg-background"
            nodesDraggable={false}       // Prevent users from dragging nodes.
            nodesConnectable={false}   // Prevent users from creating new edges.
            style={theme === 'dark' ? { backgroundColor: '#1a1a1a' } : {backgroundColor: '#ede8e8'}} // Set graph background color.
            proOptions={{ hideAttribution: true }} // Hide React Flow attribution mark.
            minZoom={0.5}
            fitView
            attributionPosition="top-right"
        >
            
            <Background 
              variant={BackgroundVariant.Dots} 
              gap={12} 
              size={1} 
              color={theme === 'dark' ? '#1a1a1a' : '#ddd'}
            />
        </ReactFlow>
=======
    <div
      style={{
        height: "min(500px, 70vh)", // Responsive height based on viewport
        width: "100%",
        border: "1px solid #d1d1c4",
        borderRadius: "5px",
      }}
      className="touch-manipulation" // Improves touch behavior on mobile
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        className="bg-background"
        nodesDraggable={false}
        nodesConnectable={false}
        style={theme === "dark" ? { backgroundColor: "#1a1a1a" } : { backgroundColor: "#FFFFFF" }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.25} // Lower minimum zoom for mobile
        maxZoom={2.5} // Higher maximum zoom for pinch-to-zoom
        fitView
        fitViewOptions={{
          padding: 0.2, // More padding around the graph
          includeHiddenNodes: false,
        }}
        attributionPosition="top-right"
        zoomOnScroll={true}
        panOnScroll={true} // Enable pan with scroll for better mobile interaction
        zoomOnPinch={true} // Enable pinch-to-zoom on mobile
        panOnDrag={true}
      ></ReactFlow>
>>>>>>> 2189e6d (feat: Implement Intial MVP for the Plan Builder and Program Planner)
    </div>
  );
};

// --- Wrapper Component ---

/**
 * Wraps the PrerequisiteGraphLayout with ReactFlowProvider.
 * This provider is necessary for React Flow hooks (like useReactFlow) to work.
 */
export default function PrerequisiteGraphWrapper(props: PrerequisiteGraphProps) {    
    const { resolvedTheme } = useTheme(); // Get the currently resolved theme

    return (
        <ReactFlowProvider>
             {/* Pass the theme to the layout component */}
            <PrerequisiteGraphLayout {...props} theme={resolvedTheme} />
        </ReactFlowProvider>
    );
}