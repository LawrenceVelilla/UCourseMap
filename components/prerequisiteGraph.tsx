
'use client'
import React, { useEffect, useMemo } from 'react';
import dagre from 'dagre'; 
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

import '@xyflow/react/dist/style.css';

// Types --> Should prolly move to ./lib/types.ts
export interface GraphNodeData extends Record<string, unknown> {
  label: string;      // Display text (course code or description)
  isCourse: boolean;  // Flag to differentiate node types for styling/logic
  type?: 'target' | 'prerequisite' | 'text_requirement'; // Category for styling/logic
}
// Specific Node type used internally and by hooks
export type AppNode = Node<GraphNodeData>;
// Specific Edge type (using base type)
export type AppEdge = Edge;

export interface InputNode extends Omit<AppNode, 'position' | 'width' | 'height' | 'style' | 'selected' | 'dragging' | 'selectable' | 'draggable' | 'hidden' | 'resizing' | 'focusable' | 'sourcePosition' | 'targetPosition'> {
  style?: React.CSSProperties; // Allow optional style override from parent
}
export interface PrerequisiteGraphProps {
  initialNodes: InputNode[];
  initialEdges: AppEdge[];
}


// To-DO: Remember to update the component rendering the graph to use edge.data.depth for styling.
//       - Use edge.data.depth to determine color difference for the edges so we can see which is actually a direct prerequisite.

// dagre
const dagreGraph = new dagre.graphlib.Graph({ compound: false });
dagreGraph.setDefaultEdgeLabel(() => ({}));
const nodeWidth = 180; 
const nodeHeight = 45; 

// Default styles defined outside for reuse
const targetNodeStyle: React.CSSProperties = {
    background: '#606c5d', color: '#fff', border: '1px solid #3a4139', borderRadius: '4px', width: nodeWidth, padding: '8px 12px', textAlign: 'center', fontSize: '14px', fontWeight: 'bold', height: nodeHeight, display: 'flex', alignItems: 'center', justifyContent: 'center'
};
const prereqNodeStyle: React.CSSProperties = {
    background: '#f0f0e8', color: '#333', border: '1px solid #d1d1c4', borderRadius: '4px', width: nodeWidth, padding: '8px 12px', textAlign: 'center', fontSize: '14px', height: nodeHeight, display: 'flex', alignItems: 'center', justifyContent: 'center'
};
const textNodeStyle: React.CSSProperties = {
    background: '#fefae0d', border: '1px dashed #e6db74', borderRadius: '4px', width: nodeWidth, padding: '8px 12px', textAlign: 'center', fontSize: '12px', fontStyle: 'italic', height: nodeHeight, display: 'flex', alignItems: 'center', justifyContent: 'center' // Fixed height for consistent layout
};

const defaultEdgeStyle: React.CSSProperties = {
    strokeWidth: 1.5,
    stroke: '#7d8a70',
};

const defaultMarkerEnd = {
    type: MarkerType.ArrowClosed,
    color: '#7d8a70',
    width: 18,
    height: 18,
};

type LayoutDirection = 'TB' | 'LR';

const getLayoutedElements = (
    nodesToLayout: Node<GraphNodeData>[], 
    edgesToLayout: Edge[],
    direction: LayoutDirection
): { nodes: AppNode[]; edges: AppEdge[] } => {

    dagreGraph.setGraph({ rankdir: direction, nodesep: 60, ranksep: 60, marginx: 20, marginy: 20 });

    // Clear graph before layout
    dagreGraph.nodes().forEach((nodeId: string) => { try { dagreGraph.removeNode(nodeId); } catch (e) {} });
    dagreGraph.edges().forEach(edge => { try { dagreGraph.removeEdge(edge.v, edge.w); } catch (e) {} });

    // Add nodes/edges to Dagre, providing appropriate dimensions
    edgesToLayout.forEach((edge) => { try { dagreGraph.setEdge(edge.source, edge.target); } catch(e) {} });
    nodesToLayout.forEach((node) => {
        const heightForLayout = node.height ?? nodeHeight;
        try { dagreGraph.setNode(node.id, { width: node.width ?? nodeWidth, height: heightForLayout }); } catch(e) {}
    });

    // Run Layout
    try { dagre.layout(dagreGraph); }
    catch (layoutError) {
        console.error("Dagre layout failed:", layoutError);
        // Return nodes with initial positions if layout fails
        return { nodes: nodesToLayout.map(n => ({...n, position: n.position ?? { x: 0, y: 0 } })), edges: edgesToLayout };
    }

    // Map layout results back to final React Flow node structure
    const finalNodes: AppNode[] = nodesToLayout.map((node) => {
        const dagreNode = dagreGraph.node(node.id);
        const heightForLayout = node.height ?? nodeHeight; // Use the same height as passed to Dagre
        const calculatedPosition = dagreNode
            ? { x: dagreNode.x - (node.width ?? nodeWidth) / 2, y: dagreNode.y - heightForLayout / 2 }
            : node.position; // Use original position if layout failed for this node

        const isHorizontal = direction === 'LR';
        const targetPosition = node.targetPosition ?? (isHorizontal ? Position.Left : Position.Top);
        const sourcePosition = node.sourcePosition ?? (isHorizontal ? Position.Right : Position.Bottom);

        // Determine style based on node data
        let defaultStyle: React.CSSProperties;
        if (!node.data.isCourse) {
            defaultStyle = textNodeStyle;
        } else if (node.data.type === 'target') {
            defaultStyle = targetNodeStyle;
        } else {
            defaultStyle = prereqNodeStyle;
        }
        const finalStyle = { ...defaultStyle, ...node.style }; // Merge styles

        // Construct the final AppNode object explicitly with all required fields
        const finalNode: AppNode = {
            id: node.id,
            position: calculatedPosition!, // Assert non-null
            data: node.data,
            type: node.type ?? 'default',
            style: finalStyle,
            width: nodeWidth,
            height: nodeHeight, // Use the standard height for rendering
            sourcePosition: sourcePosition,
            targetPosition: targetPosition,
            // Include default values for base properties
            selected: node.selected ?? false, dragging: node.dragging ?? false,
            selectable: node.selectable ?? true, draggable: node.draggable ?? false,
            hidden: node.hidden ?? false, resizing: node.resizing ?? false,
            focusable: node.focusable ?? true,
        };
        return finalNode;
    });

    // Map edges to final AppEdge array with defaults
    const finalEdges: AppEdge[] = edgesToLayout.map(edge => {
        const finalEdge: AppEdge = {
            id: edge.id,
            source: edge.source, target: edge.target,
            type: edge.type ?? 'smoothstep', // Use smoothstep for curved edges
            style: { ...defaultEdgeStyle, ...edge.style },
            markerEnd: edge.markerEnd ?? defaultMarkerEnd,
            animated: edge.animated ?? false, selected: edge.selected ?? false,
            hidden: edge.hidden ?? false, data: edge.data,
        };
        return finalEdge;
    });

    return { nodes: finalNodes, edges: finalEdges };
};


// Renders the graph using calculated layout; accepts props from the wrapper
const PrerequisiteGraphLayout = ({ initialNodes, initialEdges }: PrerequisiteGraphProps) => {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<GraphNodeData>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>([]);

  useEffect(() => {
      if (!Array.isArray(initialNodes) || !Array.isArray(initialEdges)) {
         setNodes([]); setEdges([]); return;
      }

      // 1. Transform InputNode[] (props) into Node<GraphNodeData>[] required for layout function
      // Cause bitchass layout fail if we don't set position and dimensions
      const transformedNodes: Node<GraphNodeData>[] = initialNodes.map(n => ({
          id: n.id,
          data: n.data,
          position: { x: 0, y: 0 }, 
          width: nodeWidth,         
          height: nodeHeight,       
          type: n.type ?? 'default',
          style: n.style,
          selected: false, dragging: false, selectable: true, draggable: false, hidden: false, resizing: false, focusable: true
      }));

      // 2. Ensure edges match AppEdge type (usually less transformation needed)
      const transformedEdges: AppEdge[] = initialEdges.map(e => ({ ...e }));

      // 3. Apply layout only if there are nodes to process
      if (transformedNodes.length > 0) {
          const direction = 'TB' as LayoutDirection; // Top-to-Bottom layout
          // Call layout function with nodes that have dimensions
          const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
              transformedNodes,
              transformedEdges,
              direction
          );

          // Update state with the final, layouted nodes and edges
          setNodes(layoutedNodes);
          setEdges(layoutedEdges);

          // Fit view after layout is applied and state is set
          window.requestAnimationFrame(() => {
              if (layoutedNodes.length > 0) { // Check again in case state updates are async
                   fitView({ padding: 0.2, duration: 300, includeHiddenNodes: false }); // Adjusted padding
              }
          });
      } else {
        // If we get here, usually means no nodes were passed
          // Clear nodes and edges to avoid rendering empty graph
          setNodes([]);
          setEdges([]);
      }
    // Dependencies: Rerun layout when the initial props change
  }, [initialNodes, initialEdges, fitView, setNodes, setEdges]);


  return (
    <div style={{ height: '500px', width: '100%', border: '1px solid #d1d1c4', borderRadius: '4px' }}>
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange} 
            onEdgesChange={onEdgesChange}
            nodesDraggable={false}       
            nodesConnectable={false}
            style={{ backgroundColor: '#f9f9f7' }}
            proOptions={{ hideAttribution: true }} 
            minZoom={0.5}
            // fitView // Let useEffect handle fitting the view
        >
            <Controls /> 
            <Background color="#ddd" gap={16} variant={BackgroundVariant.Dots} />
        </ReactFlow>
    </div>
  );
};


export default function PrerequisiteGraphWrapper(props: PrerequisiteGraphProps) {    
    return (
        <ReactFlowProvider>
             <PrerequisiteGraphLayout {...props} />
        </ReactFlowProvider>
    );
}