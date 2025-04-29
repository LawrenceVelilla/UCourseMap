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
// TODO: moving these types to a dedicated ./lib/types.ts file
// Data shape for graph nodes, used within this component.
export interface GraphNodeData extends Record<string, unknown> {
  label: string;
  isCourse: boolean;
  type?: "target" | "prerequisite" | "text_requirement";
}

export type AppNode = Node<GraphNodeData>;
export type AppEdge = Edge;
export interface InputNode
  extends Omit<
    AppNode,
    | "position"
    | "width"
    | "height"
    | "style"
    | "selected"
    | "dragging"
    | "selectable"
    | "draggable"
    | "hidden"
    | "resizing"
    | "focusable"
    | "sourcePosition"
    | "targetPosition"
  > {
  style?: React.CSSProperties;
}
export interface PrerequisiteGraphProps {
  initialNodes: InputNode[];
  initialEdges: AppEdge[];
}
export interface PrerequisiteGraphLayoutProps extends PrerequisiteGraphProps {
  theme?: string; // OPtional
}

// Configuration & Styling

// TODO: This comment relates to an old approach, edge colors are now based on depth.
// // To-DO: Remember to update the component rendering the graph to use edge.data.depth for styling.
// //       - Use edge.data.depth to determine color difference for the edges so we can see which is actually a direct prerequisite.

const dagreGraph = new dagre.graphlib.Graph({ compound: false });
dagreGraph.setDefaultEdgeLabel(() => ({}));
const nodeWidth = 180;
const nodeHeight = 45;

const getNodeStyles = (theme?: string) => {
  const isDark = theme === "dark";

  const targetNodeStyle: React.CSSProperties = {
    background: isDark ? "hsl(var(--primary))" : "#606c5d",
    color: isDark ? "hsl(var(--primary-foreground))" : "#fff",
    border: `1px solid ${isDark ? "hsl(var(--border))" : "#3a4139"}`,
    borderRadius: "4px",
    width: nodeWidth,
    padding: "8px 12px",
    textAlign: "center",
    fontSize: "14px",
    fontWeight: "bold",
    height: nodeHeight,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };
  const prereqNodeStyle: React.CSSProperties = {
    background: isDark ? "hsl(var(--secondary))" : "#f0f0e8",
    color: isDark ? "hsl(var(--secondary-foreground))" : "#333",
    border: `1px solid ${isDark ? "hsl(var(--border))" : "#d1d1c4"}`,
    borderRadius: "4px",
    width: nodeWidth,
    padding: "8px 12px",
    textAlign: "center",
    fontSize: "14px",
    height: nodeHeight,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };
  const textNodeStyle: React.CSSProperties = {
    background: "#fefae0",
    color: "#283618",
    border: `1px dashed ${isDark ? "hsl(var(--muted-foreground))" : "#e6db74"}`,
    borderRadius: "4px",
    width: nodeWidth,
    padding: "8px 12px",
    textAlign: "center",
    fontSize: "12px",
    fontStyle: "italic",
    height: nodeHeight,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return { targetNodeStyle, prereqNodeStyle, textNodeStyle };
};

// Default styles for edges and markers.
const defaultEdgeStyle: React.CSSProperties = {
  strokeWidth: 1.5,
  // stroke: '#7d8a70', // REMOVED - Color is now set dynamically based on level.
};

const defaultMarkerEnd = {
  type: MarkerType.ArrowClosed,
  // color: '#7d8a70', // REMOVED - Color is now set dynamically based on level.
  width: 18,
  height: 18,
};

// Color palette for different prerequisite levels (depth).
export const levelColors = ["#283618", "#dda15e", "#a3b18a", "#dad7cd"];
const defaultEdgeColor = levelColors[levelColors.length - 1];

type LayoutDirection = "TB" | "LR";

/**
 * Calculates node positions using Dagre layout algorithm.
 * @param nodesToLayout Nodes passed from the parent component.
 * @param edgesToLayout Edges passed from the parent component.
 * @param direction Layout direction ('TB' for top-to-bottom, 'LR' for left-to-right).
 * @returns An object containing nodes with calculated positions and styled edges.
 */
const getLayoutedElements = (
  nodesToLayout: Node<GraphNodeData>[],
  edgesToLayout: Edge[],
  direction: LayoutDirection,
  theme?: string, // Add theme parameter
): { nodes: AppNode[]; edges: AppEdge[] } => {
  const { targetNodeStyle, prereqNodeStyle, textNodeStyle } = getNodeStyles(theme);

  dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 60, marginx: 20, marginy: 20 });

  dagreGraph.nodes().forEach((nodeId: string) => {
    try {
      dagreGraph.removeNode(nodeId);
    } catch (e) {
      console.log("Dagre removeNode failed:", e);
      /* Ignore if node not found */
    }
  });
  dagreGraph.edges().forEach((edge) => {
    try {
      dagreGraph.removeEdge(edge.v, edge.w);
    } catch (e) {
      console.log("Dagre removeEdge failed:", e);
      /* Ignore if edge not found */
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
    const heightForLayout = node.height ?? nodeHeight;
    try {
      dagreGraph.setNode(node.id, { width: node.width ?? nodeWidth, height: heightForLayout });
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
    const heightForLayout = node.height ?? nodeHeight;

    const calculatedPosition = dagreNode
      ? { x: dagreNode.x - (node.width ?? nodeWidth) / 2, y: dagreNode.y - heightForLayout / 2 }
      : node.position;

    const isHorizontal = direction === "LR";
    const targetPosition = node.targetPosition ?? (isHorizontal ? Position.Left : Position.Top);
    const sourcePosition = node.sourcePosition ?? (isHorizontal ? Position.Right : Position.Bottom);

    let baseStyle: React.CSSProperties;
    if (!node.data.isCourse) {
      baseStyle = textNodeStyle;
    } else if (node.data.type === "target") {
      baseStyle = targetNodeStyle;
    } else {
      baseStyle = prereqNodeStyle;
    }
    // Merge base style with any custom styles passed via props.
    const finalStyle = { ...baseStyle, ...node.style };

    // Build the final React Flow node object with all required properties.
    const finalNode: AppNode = {
      id: node.id,
      position: calculatedPosition!,
      data: node.data,
      type: node.type ?? "default",
      style: finalStyle,
      width: nodeWidth,
      height: nodeHeight,
      sourcePosition: sourcePosition,
      targetPosition: targetPosition,
      selected: node.selected ?? false,
      dragging: node.dragging ?? false,
      selectable: node.selectable ?? true,
      draggable: node.draggable ?? false,
      hidden: node.hidden ?? false,
      resizing: node.resizing ?? false,
      focusable: node.focusable ?? true,
    };
    return finalNode;
  });

  // Process edges, applying level-based coloring.
  const finalEdges: AppEdge[] = edgesToLayout.map((edge) => {
    // console.log('[Edge Data Check] ID:', edge.id, 'Data:', edge.data);

    const depth = edge.data?.depth;
    let edgeColor = defaultEdgeColor;

    if (typeof depth === "number" && depth >= 1 && depth <= levelColors.length) {
      edgeColor = levelColors[depth - 1];
    } else if (typeof depth === "number" && depth > levelColors.length) {
      edgeColor = levelColors[levelColors.length - 1]; // last color
    }

    // console.log('[Edge Data Check] ID:', edge.id, 'Depth:', depth, 'Calculated Color:', edgeColor);
    // Build the final React Flow edge object.
    const finalEdge: AppEdge = {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type ?? "smoothstep",
      style: {
        ...defaultEdgeStyle,
        stroke: edgeColor,
        ...edge.style,
      },
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

  // Return the processed nodes and edges ready for React Flow.
  return { nodes: finalNodes, edges: finalEdges };
};

const PrerequisiteGraphLayout = ({
  initialNodes,
  initialEdges,
  theme,
}: PrerequisiteGraphLayoutProps) => {
  const { fitView } = useReactFlow();
  const router = useRouter(); // Hook for programmatic navigation.
  // State management for nodes and edges within React Flow.
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<GraphNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>([]);

  const handleNodeClick = (_event: React.MouseEvent, node: Node<GraphNodeData>) => {
    if (node.data && node.data.isCourse) {
      const courseCodeFull = node.id;
      const match = courseCodeFull.match(/^([a-zA-Z]+)\s*(\d+[a-zA-Z]*)$/);

      if (match) {
        const department = match[1].toLowerCase();
        const code = match[2].toLowerCase();
        const url = `/courses/${department}/${code}`; // Construct the internal URL.
        // console.log(`Navigating to: ${url}`);
        router.push(url); // Navigate to the course page.
      } else {
        console.warn(`Could not parse course code from node ID: ${courseCodeFull}`);
      }
    } else {
      // console.log('Clicked non-course node:', node);
    }
  };

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    console.log("[Layout Update] Theme:", theme); // Debug log
    if (!Array.isArray(initialNodes) || !Array.isArray(initialEdges)) {
      console.warn("Graph received invalid initialNodes or initialEdges.");
      return { nodes: [], edges: [] };
    }

    // Transform nodes to match React Flow's expected structure.
    const transformedNodes: Node<GraphNodeData>[] = initialNodes.map((n) => ({
      id: n.id,
      data: n.data,
      position: { x: 0, y: 0 },
      width: nodeWidth,
      height: nodeHeight,
      type: n.type ?? "default",
      style: n.style,
      selected: false,
      dragging: false,
      selectable: true,
      draggable: false,
      hidden: false,
      resizing: false,
      focusable: true,
    }));

    // Prepare edges (usually requires less transformation).
    const transformedEdges: AppEdge[] = initialEdges.map((e) => ({ ...e }));

    // Calculate layout if there are nodes.
    if (transformedNodes.length === 0) {
      return { nodes: [], edges: [] };
    }

    return getLayoutedElements(transformedNodes, transformedEdges, "TB", theme);
  }, [initialNodes, initialEdges, theme]);

  useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
    // requestAnimationFrame(() => fitView({ padding: 0.1 }));
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges, fitView]);

  return (
    <div
      style={{
        height: "min(500px, 70vh)",
        width: "100%",
        border: `1px solid ${theme === "dark" ? "hsl(var(--border))" : "#d1d1c4"}`,
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
        className="bg-background"
        nodesDraggable={false}
        nodesConnectable={false}
        style={theme === "dark" ? { backgroundColor: "#1a1a1a" } : { backgroundColor: "#FFFFFF" }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.5}
        fitView
        attributionPosition="top-right"
      >
        {/* <Background 
              variant={BackgroundVariant.Dots} 
              gap={12} 
              size={1} 
              color={theme === 'dark' ? '#000000' : '#000000'}
            /> */}
      </ReactFlow>
    </div>
  );
};

export default function PrerequisiteGraphWrapper(props: PrerequisiteGraphProps) {
  const { resolvedTheme } = useTheme();

  return (
    <ReactFlowProvider>
      <PrerequisiteGraphLayout {...props} theme={resolvedTheme} />
    </ReactFlowProvider>
  );
}
