"use client";
// TEST PAGE FOR REACT FLOW

import React, { useEffect } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow, // Keep hook for fitView
  Node,
  Edge,
  Position,
  MarkerType,
  ReactFlowProvider, // Need provider for useReactFlow
} from "@xyflow/react";
import dagre from "dagre";

import "@xyflow/react/dist/style.css";

// --- 1. Your Course Graph Data ---
const courseGraphData = {
  nodes: [
    // Target Node
    { id: "CMPUT 204", label: "CMPUT 204: Algorithms I", type: "target" },
    // Prerequisite Nodes
    {
      id: "CMPUT 175",
      label: "CMPUT 175: Introduction to the Foundations of Computation II",
      type: "prerequisite",
    },
    {
      id: "CMPUT 272",
      label: "CMPUT 272: Formal Systems and Logic in Computing Science",
      type: "prerequisite",
    },
    {
      id: "CMPUT 275",
      label: "CMPUT 275: Introduction to Tangible Computing II",
      type: "prerequisite",
    },
    { id: "MATH 100", label: "MATH 100: Calculus for Engineering I", type: "prerequisite" },
    { id: "MATH 114", label: "MATH 114: Elementary Calculus I", type: "prerequisite" },
    { id: "MATH 117", label: "MATH 117: Honors Calculus I", type: "prerequisite" },
    { id: "MATH 134", label: "MATH 134: Calculus for the Life Sciences I", type: "prerequisite" },
    {
      id: "MATH 144",
      label: "MATH 144: Calculus for the Mathematical and Physical Sciences I",
      type: "prerequisite",
    },
    {
      id: "MATH 154",
      label: "MATH 154: Calculus for Business and Economics I",
      type: "prerequisite",
    },
  ],
  edges: [
    { id: "edge-CMPUT 204-CMPUT 175", source: "CMPUT 204", target: "CMPUT 175" },
    { id: "edge-CMPUT 204-CMPUT 272", source: "CMPUT 204", target: "CMPUT 272" },
    { id: "edge-CMPUT 204-CMPUT 275", source: "CMPUT 204", target: "CMPUT 275" },
    { id: "edge-CMPUT 204-MATH 100", source: "CMPUT 204", target: "MATH 100" },
    { id: "edge-CMPUT 204-MATH 114", source: "CMPUT 204", target: "MATH 114" },
    { id: "edge-CMPUT 204-MATH 117", source: "CMPUT 204", target: "MATH 117" },
    { id: "edge-CMPUT 204-MATH 134", source: "CMPUT 204", target: "MATH 134" },
    { id: "edge-CMPUT 204-MATH 144", source: "CMPUT 204", target: "MATH 144" },
    { id: "edge-CMPUT 204-MATH 154", source: "CMPUT 204", target: "MATH 154" },
  ],
};

// --- 2. Type Definitions (align with React Flow and your data) ---
interface GraphNodeData extends Record<string, unknown> {
  label: string; // The display text from your input data
  type?: "target" | "prerequisite"; // Your custom type from input data
}
// Make the AppNode type match exactly what React Flow expects
type AppNode = Node<GraphNodeData>; // Remove the string | undefined type parameter
type AppEdge = Edge; // Standard Edge type
// --- 3. Dagre Layout Function (Adapted) ---
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));
const nodeWidth = 180;
const nodeHeight = 60;
type LayoutDirection = "TB" | "LR";

const getLayoutedElements = (
  nodesToLayout: Node<GraphNodeData>[], // Expects nodes already conforming to Node<T> structure
  edgesToLayout: Edge[],
  direction: LayoutDirection,
): { nodes: Node<GraphNodeData>[]; edges: AppEdge[] } => {
  dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 60 });

  // Clear graph
  dagreGraph.nodes().forEach((nodeId: string) => dagreGraph.removeNode(nodeId));
  dagreGraph.edges().forEach((edge) => dagreGraph.removeEdge(edge.v, edge.w));

  // Add nodes/edges to Dagre
  edgesToLayout.forEach((edge) => dagreGraph.setEdge(edge.source, edge.target));
  nodesToLayout.forEach((node) =>
    dagreGraph.setNode(node.id, {
      width: node.width ?? nodeWidth,
      height: node.height ?? nodeHeight,
    }),
  );

  dagre.layout(dagreGraph);

  // Map layout results back to React Flow nodes
  const finalNodes: AppNode[] = nodesToLayout.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const position = nodeWithPosition
      ? { x: nodeWithPosition.x - nodeWidth / 2, y: nodeWithPosition.y - nodeHeight / 2 }
      : { x: 0, y: 0 }; // Fallback position

    const isHorizontal = direction === "LR";
    const targetPosition = isHorizontal ? Position.Left : Position.Top;
    const sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

    // Apply default styles
    const style =
      node.style ??
      (node.data.type === "target"
        ? {
            background: "#606c5d",
            color: "#fff",
            border: "1px solid #3a4139",
            borderRadius: "4px",
            width: nodeWidth,
            padding: "10px 15px",
            textAlign: "center",
            fontSize: "13px",
            height: nodeHeight,
          }
        : {
            background: "#f0f0e8",
            color: "#333",
            border: "1px solid #d1d1c4",
            borderRadius: "4px",
            width: nodeWidth,
            padding: "10px 15px",
            textAlign: "center",
            fontSize: "13px",
            height: nodeHeight,
          });

    // Return the fully compliant Node object
    return {
      ...node, // Includes id, data, existing style etc.
      position, // Add calculated position
      targetPosition,
      sourcePosition,
      style,
      width: nodeWidth,
      height: nodeHeight,
      type: node.type ?? "default", // Ensure a base type
    };
  });

  // Apply default edge styles/markers
  const finalEdges: AppEdge[] = edgesToLayout.map((edge) => ({
    ...edge,
    style: { strokeWidth: 1.5, stroke: "#7d8a70", ...edge.style },
    markerEnd: edge.markerEnd ?? {
      type: MarkerType.ArrowClosed,
      color: "#7d8a70",
      width: 18,
      height: 18,
    },
    type: "smoothstep",
  }));

  return { nodes: finalNodes, edges: finalEdges };
};

// --- 4. The React Component Using the Layout ---
const FlowWithLayout = () => {
  const { fitView } = useReactFlow();
  // Type the state hooks correctly
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<GraphNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>([]);

  // Effect to process input data and apply layout
  useEffect(() => {
    // Transform the raw courseGraphData into the structure needed by React Flow Node type
    const transformedNodes: Node<GraphNodeData>[] = courseGraphData.nodes.map((n) => ({
      id: n.id,
      data: { label: n.label, type: n.type as "target" | "prerequisite" }, // Move label/type into data
      position: { x: 0, y: 0 }, // Provide initial default position
      width: nodeWidth, // Provide dimensions needed by layout
      height: nodeHeight,
      type: "default", // Provide base react flow type
      // Optional: Add initial style if needed before layout calculation
      // style: n.type === 'target' ? { ... } : { ... }
    }));

    // Edges usually need less transformation, just ensure they match AppEdge type
    const transformedEdges: AppEdge[] = courseGraphData.edges.map((e) => ({
      ...e,
      // You could add default style/marker here too, but layout function also does it
    }));

    if (transformedNodes.length > 0) {
      // Pass the *transformed* nodes (which now match Node<GraphNodeData>) to layout
      const direction: LayoutDirection = "TB";
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
        transformedNodes,
        transformedEdges,
        direction,
      );

      setNodes(layoutedNodes);
      setEdges(layoutedEdges);

      window.requestAnimationFrame(() => {
        if (layoutedNodes.length > 0) {
          fitView({ padding: 0.15, duration: 300 });
        }
      });
    } else {
      setNodes([]);
      setEdges([]);
    }
    // Run only once on mount for this static example
  }, [fitView, setNodes, setEdges]);

  return (
    // Container div needs defined height
    <div style={{ height: "80vh", width: "100%", border: "1px solid #ccc" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodesDraggable={false}
        nodesConnectable={false}
        style={{ backgroundColor: "#f9f9f7" }}
        proOptions={{ hideAttribution: true }}
        minZoom={0.2}
        // fitView // Let useEffect handle fitView
      >
        <Background color="#ddd" gap={16} variant={BackgroundVariant.Dots} />
      </ReactFlow>
    </div>
  );
};

// --- 5. Main Page Component ---
// This wraps the flow component in the necessary Provider
export default function ClassesTestPage() {
  return (
    <div className="p-4 md:p-8 flex flex-col" style={{ height: "calc(100vh - 100px)" }}>
      {" "}
      {/* Adjust height as needed */}
      <h1 className="text-2xl font-bold mb-4">React Flow Test Page (CMPUT 204)</h1>
      <p className="mb-6">Displaying prerequisites for CMPUT 204 using Dagre layout.</p>
      {/* Provider is needed because FlowWithLayout uses useReactFlow */}
      <ReactFlowProvider>
        <FlowWithLayout />
      </ReactFlowProvider>
    </div>
  );
}
