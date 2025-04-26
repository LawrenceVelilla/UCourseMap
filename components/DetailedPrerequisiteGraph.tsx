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

import "@xyflow/react/dist/style.css";

// --- Type Definitions ---

// Data shape for graph nodes, used within this component.
export interface GraphNodeData extends Record<string, unknown> {
  label: string; // Display text (e.g., "MATH 101", "AND", "OR", "Min. grade C-")
  nodeType: "course" | "and" | "or" | "text_requirement"; // The type of entity this node represents.
  isTarget?: boolean; // Optional: True if this is the main course the graph is for.
}

// Specific React Flow Node type used internally by hooks and components.
export type AppNode = Node<GraphNodeData>;

// Specific React Flow Edge type (can be extended later if needed).
export type AppEdge = Edge;

// Simplified node type used for props passed *into* the graph component.
// Omits properties automatically handled by React Flow or layout.
export interface InputNode
  extends Omit<
    AppNode,
    | "position"
    | "width"
    | "height"
    // | "style" // Keep style optional
    | "selected"
    | "dragging"
    | "selectable"
    | "draggable"
    | "hidden"
    | "resizing"
    | "focusable"
    | "sourcePosition"
    | "targetPosition"
    | "nodeType" // Ensure nodeType is part of data
    | "isTarget" // Ensure isTarget is part of data
  > {
  data: GraphNodeData; // Explicitly require data matching the new structure
  style?: React.CSSProperties; // Allow optional style overrides from the parent.
}

// Props definition for the main graph component.
export interface PrerequisiteGraphProps {
  initialNodes: InputNode[]; // Nodes received from the parent wrapper.
  initialEdges: AppEdge[]; // Edges received from the parent wrapper.
}

// Add theme to props
export interface PrerequisiteGraphLayoutProps extends PrerequisiteGraphProps {
  theme?: string; // Add theme prop (optional)
}

// --- Configuration & Styling ---

// Initialize Dagre graph for layout calculations.
const dagreGraph = new dagre.graphlib.Graph({ compound: false });
dagreGraph.setDefaultEdgeLabel(() => ({})); // Default empty label for edges.

// Standard dimensions for graph nodes.
const nodeWidth = 180;
const nodeHeight = 45;
const operatorNodeWidth = 60; // Smaller width for AND/OR
const operatorNodeHeight = 40; // Smaller height for AND/OR

// Function to get styles based on theme
const getNodeStyles = (theme?: string) => {
  const isDark = theme === "dark";

  // Shared properties
  const baseNodeStyle: React.CSSProperties = {
    borderRadius: "4px",
    padding: "8px 12px",
    textAlign: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: `1px solid ${isDark ? "hsl(var(--border))" : "#ccc"}`, // Consistent border base
  };

  const courseNodeBase: React.CSSProperties = {
    ...baseNodeStyle,
    width: nodeWidth,
    height: nodeHeight,
    fontSize: "14px",
    cursor: "pointer",
  };

  const targetNodeStyle: React.CSSProperties = {
    ...courseNodeBase,
    background: isDark ? "hsl(var(--primary))" : "#606c5d", // Use primary for dark target
    color: isDark ? "hsl(var(--primary-foreground))" : "#fff",
    border: `1px solid ${isDark ? "hsl(var(--border))" : "#3a4139"}`,
    fontWeight: "bold",
  };

  const prereqNodeStyle: React.CSSProperties = {
    ...courseNodeBase,
    background: isDark ? "hsl(var(--secondary))" : "#f0f0e8", // Use secondary for dark prereq
    color: isDark ? "hsl(var(--secondary-foreground))" : "#333",
    border: `1px solid ${isDark ? "hsl(var(--border))" : "#d1d1c4"}`,
  };

  const textNodeStyle: React.CSSProperties = {
    ...baseNodeStyle,
    width: nodeWidth, // Keep same width for now
    height: nodeHeight,
    background: "#fefae0", // Fixed typo in hex color code for cream color
    color: isDark ? "hsl(var(--muted-foreground))" : "#283618", // Adjusted dark text color
    border: `1px dashed ${isDark ? "hsl(var(--muted-foreground))" : "#b0a060"}`, // Adjusted dark border
    fontSize: "12px",
    fontStyle: "italic",
  };

  const operatorNodeBase: React.CSSProperties = {
    ...baseNodeStyle,
    width: operatorNodeWidth,
    height: operatorNodeHeight,
    fontSize: "12px",
    fontWeight: "bold",
    borderRadius: "50%", // Make operators circular
  };

  const andNodeStyle: React.CSSProperties = {
    ...operatorNodeBase,
    background: isDark ? "#a0522d" : "#dda15e", // Brown/Orange shades
    color: isDark ? "#ffffff" : "#333",
    border: `1px solid ${isDark ? "#804124" : "#b1804b"}`,
  };

  const orNodeStyle: React.CSSProperties = {
    ...operatorNodeBase,
    background: isDark ? "#5f9ea0" : "#a3b18a", // Teal/Green shades
    color: isDark ? "#ffffff" : "#333",
    border: `1px solid ${isDark ? "#4c7e80" : "#828e6e"}`,
  };

  return { targetNodeStyle, prereqNodeStyle, textNodeStyle, andNodeStyle, orNodeStyle };
};

// Base style for edges (stroke color is applied dynamically).
const defaultEdgeStyle: React.CSSProperties = {
  strokeWidth: 1.5,
};

// Base style for edge markers (arrowheads). Color is applied dynamically.
const defaultMarkerEnd = {
  type: MarkerType.ArrowClosed,
  width: 18,
  height: 18,
};

// Color palette for different prerequisite levels (depth).
export const levelColors = ["#283618", "#dda15e", "#a3b18a", "#dad7cd"];
const defaultEdgeColor = levelColors[levelColors.length - 1];

// Type for specifying layout orientation.
type LayoutDirection = "TB" | "LR";

// --- Layout Function ---

/**
 * Calculates node positions using Dagre layout algorithm.
 */
const getLayoutedElements = (
  nodesToLayout: Node<GraphNodeData>[],
  edgesToLayout: Edge[],
  direction: LayoutDirection,
  theme?: string,
): { nodes: AppNode[]; edges: AppEdge[] } => {
  const { targetNodeStyle, prereqNodeStyle, textNodeStyle, andNodeStyle, orNodeStyle } =
    getNodeStyles(theme);

  dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 60, marginx: 20, marginy: 20 });

  // Clear previous graph elements
  dagreGraph.nodes().forEach((nodeId: string) => {
    try {
      dagreGraph.removeNode(nodeId);
    } catch (e) {
      /* Ignore */
    }
  });
  dagreGraph.edges().forEach((edge) => {
    try {
      dagreGraph.removeEdge(edge.v, edge.w);
    } catch (e) {
      /* Ignore */
    }
  });

  // Add nodes and edges to Dagre, providing dimensions for layout.
  edgesToLayout.forEach((edge) => {
    try {
      dagreGraph.setEdge(edge.source, edge.target);
    } catch (e) {
      console.error("Dagre setEdge failed:", e);
    }
  });

  nodesToLayout.forEach((node) => {
    // Use specific dimensions for operators, default for others
    const nodeType = node.data.nodeType;
    const widthForLayout = nodeType === "and" || nodeType === "or" ? operatorNodeWidth : nodeWidth;
    const heightForLayout =
      nodeType === "and" || nodeType === "or" ? operatorNodeHeight : nodeHeight;

    try {
      dagreGraph.setNode(node.id, { width: widthForLayout, height: heightForLayout });
    } catch (e) {
      console.error("Dagre setNode failed:", e);
    }
  });

  // Execute the Dagre layout algorithm.
  try {
    dagre.layout(dagreGraph);
  } catch (layoutError) {
    console.error("Dagre layout failed:", layoutError);
    return {
      nodes: nodesToLayout.map((n) => ({ ...n, position: n.position ?? { x: 0, y: 0 } })),
      edges: edgesToLayout,
    };
  }

  // Process layout results and map back to React Flow node structure.
  const finalNodes: AppNode[] = nodesToLayout.map((node) => {
    const dagreNode = dagreGraph.node(node.id);

    // Use specific dimensions for operators, default for others
    const nodeType = node.data.nodeType;
    const currentWidth = nodeType === "and" || nodeType === "or" ? operatorNodeWidth : nodeWidth;
    const currentHeight = nodeType === "and" || nodeType === "or" ? operatorNodeHeight : nodeHeight;

    const calculatedPosition = dagreNode
      ? { x: dagreNode.x - currentWidth / 2, y: dagreNode.y - currentHeight / 2 }
      : (node.position ?? { x: 0, y: 0 }); // Added fallback for position

    const isHorizontal = direction === "LR";
    const targetPosition = isHorizontal ? Position.Left : Position.Top;
    const sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    // Select base style based on node type
    let baseStyle: React.CSSProperties;
    switch (node.data.nodeType) {
      case "course":
        baseStyle = node.data.isTarget ? targetNodeStyle : prereqNodeStyle;
        break;
      case "and":
        baseStyle = andNodeStyle;
        break;
      case "or":
        baseStyle = orNodeStyle;
        break;
      case "text_requirement":
        baseStyle = textNodeStyle;
        break;
      default:
        baseStyle = prereqNodeStyle; // Fallback style
    }

    const finalStyle = { ...baseStyle, ...node.style };

    const finalNode: AppNode = {
      id: node.id,
      position: calculatedPosition,
      data: node.data,
      type: node.type ?? "default",
      style: finalStyle,
      width: currentWidth, // Use potentially different width
      height: currentHeight, // Use potentially different height
      sourcePosition: sourcePosition,
      targetPosition: targetPosition,
      selected: node.selected ?? false,
      dragging: node.dragging ?? false,
      selectable: node.selectable ?? true,
      draggable: node.draggable ?? false, // Keep nodes non-draggable generally
      hidden: node.hidden ?? false,
      resizing: node.resizing ?? false,
      focusable: node.focusable ?? true,
    };
    return finalNode;
  });

  // Process edges (unchanged from previous version)
  const finalEdges: AppEdge[] = edgesToLayout.map((edge) => {
    const depth = edge.data?.depth;
    let edgeColor = defaultEdgeColor;

    if (typeof depth === "number" && depth >= 1 && depth <= levelColors.length) {
      edgeColor = levelColors[depth - 1];
    } else if (typeof depth === "number" && depth > levelColors.length) {
      edgeColor = levelColors[levelColors.length - 1];
    }

    const finalEdge: AppEdge = {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type ?? "smoothstep",
      style: { ...defaultEdgeStyle, stroke: edgeColor, ...edge.style },
      markerEnd: {
        ...defaultMarkerEnd,
        color: edgeColor,
        ...(typeof edge.markerEnd === "object" ? edge.markerEnd : {}),
      },
      animated: edge.animated ?? false,
      selected: edge.selected ?? false,
      hidden: edge.hidden ?? false,
      data: { ...edge.data, calculatedColor: edgeColor },
    };
    return finalEdge;
  });

  return { nodes: finalNodes, edges: finalEdges };
};

// --- React Flow Component ---

/**
 * Internal component that renders the React Flow graph and handles interactions.
 */
const PrerequisiteGraphLayout = ({
  initialNodes,
  initialEdges,
  theme,
}: PrerequisiteGraphLayoutProps) => {
  const { fitView } = useReactFlow();
  const router = useRouter();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<GraphNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>([]);

  /**
   * Handles clicks on graph nodes.
   * If a course node is clicked, navigates to that course's page.
   */
  const handleNodeClick = (_event: React.MouseEvent, node: Node<GraphNodeData>) => {
    // Only act on clicks if it's a course node.
    if (node.data && node.data.nodeType === "course") {
      const courseCodeFull = node.id;
      const match = courseCodeFull.match(/^([a-zA-Z]+)\s*(\d+[a-zA-Z]*)$/);

      if (match) {
        const department = match[1].toLowerCase();
        const code = match[2].toLowerCase();
        const url = `/courses/${department}/${code}`;
        router.push(url);
      } else {
        console.warn(`Could not parse course code from node ID: ${courseCodeFull}`);
      }
    }
    // Clicks on AND/OR/Text nodes do nothing for now.
  };

  // Update layout when nodes, edges, or theme change
  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    console.log("[Layout Update] Theme:", theme);

    if (!Array.isArray(initialNodes) || !Array.isArray(initialEdges)) {
      console.warn("Graph received invalid initialNodes or initialEdges.");
      return { nodes: [], edges: [] };
    }

    // 1. Transform InputNodes to Nodes for layout - Ensure data matches GraphNodeData
    const transformedNodes: Node<GraphNodeData>[] = initialNodes.map((n) => {
      // Determine dimensions based on node type from InputNode's data
      const nodeType = n.data.nodeType;
      const widthForLayout =
        nodeType === "and" || nodeType === "or" ? operatorNodeWidth : nodeWidth;
      const heightForLayout =
        nodeType === "and" || nodeType === "or" ? operatorNodeHeight : nodeHeight;

      return {
        id: n.id,
        data: n.data, // Pass the whole data object
        position: { x: 0, y: 0 },
        width: widthForLayout, // Use potentially different width for layout calc
        height: heightForLayout, // Use potentially different height for layout calc
        type: n.type ?? "default",
        style: n.style,
        // Default React Flow props
        selected: false,
        dragging: false,
        selectable: true,
        draggable: false,
        hidden: false,
        resizing: false,
        focusable: true,
      };
    });

    const transformedEdges: AppEdge[] = initialEdges.map((e) => ({ ...e }));

    if (transformedNodes.length === 0) {
      return { nodes: [], edges: [] };
    }

    return getLayoutedElements(transformedNodes, transformedEdges, "TB", theme);
  }, [initialNodes, initialEdges, theme]);

  // Effect to update React Flow state
  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    // Optional: Recenter view after layout changes
    // requestAnimationFrame(() => fitView({ padding: 0.1 }));
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges, fitView]);

  // Render the React Flow component (styles mostly unchanged here)
  return (
    <div
      style={{
        height: "min(500px, 70vh)",
        width: "100%",
        border: `1px solid ${theme === "dark" ? "hsl(var(--border))" : "#d1d1c4"}`, // Theme-aware border
        borderRadius: "5px",
      }}
      className="touch-manipulation"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        className="bg-background" // Use theme variable for background
        nodesDraggable={false}
        nodesConnectable={false}
        // Style applied directly for explicit theme control if needed beyond className
        style={theme === "dark" ? { backgroundColor: "#1a1a1a" } : { backgroundColor: "#FFFFFF" }} // Set graph background color.
        proOptions={{ hideAttribution: true }}
        minZoom={0.25}
        maxZoom={2.5}
        fitView
        fitViewOptions={{ padding: 0.2, includeHiddenNodes: false }}
        attributionPosition="top-right"
        zoomOnScroll={true}
        panOnScroll={true}
        zoomOnPinch={true}
        panOnDrag={true}
      ></ReactFlow>
    </div>
  );
};

// --- Wrapper Component --- (Unchanged)

/**
 * Wraps the PrerequisiteGraphLayout with ReactFlowProvider.
 */
export default function PrerequisiteGraphWrapper(props: PrerequisiteGraphProps) {
  const { resolvedTheme } = useTheme();

  return (
    <ReactFlowProvider>
      <PrerequisiteGraphLayout {...props} theme={resolvedTheme} />
    </ReactFlowProvider>
  );
}
