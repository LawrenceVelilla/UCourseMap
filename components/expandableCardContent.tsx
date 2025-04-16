'use client';

import React, { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';

interface ExpandableCardContentProps {
  children: React.ReactNode;
  collapsedHeight?: number; // in pixels, default value provided below
  overlayColor?: string; // optional, for future use
}

export function ExpandableCardContent({
  children,
  collapsedHeight = 150, // adjust as needed for your design
}: ExpandableCardContentProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [fullHeight, setFullHeight] = useState<number>(0);
  
    // Measure full content height when mounted or children change.
    useEffect(() => {
      if (containerRef.current) {
        const measuredHeight = containerRef.current.scrollHeight;
        setFullHeight(measuredHeight);
        if (!expanded) {
          containerRef.current.style.height = `${collapsedHeight}px`;
          containerRef.current.style.overflow = 'hidden';
        }
      }
    }, [children, expanded, collapsedHeight]);
  
    // Toggle expand / collapse state with a smooth height animation.
    const toggleExpand = () => {
      if (!containerRef.current) return;
  
      if (expanded) {
        // Animate from full height back to collapsed height.
        animate(containerRef.current, {
          height: collapsedHeight,
          duration: 300,
          easing: 'easeOutQuad',
          complete: () => setExpanded(false),
        });
      } else {
        // Animate from collapsed height to full content height.
        animate(containerRef.current, {
          height: fullHeight,
          duration: 300,
          easing: 'easeOutQuad',
          begin: () => {
            containerRef.current!.style.overflow = 'visible';
          },
          complete: () => setExpanded(true),
        });
      }
    };
  
    return (
      <div>
        {/* Wrapping element with relative positioning to position the fade overlay */}
        <div className="relative">
          <div ref={containerRef}>
            {children}
            {/* Fade overlay, only show when not expanded and content exceeds the collapsed height */}
            {!expanded && fullHeight > collapsedHeight && (
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent"
              />
            )}
          </div>
        </div>
        {/* Toggle button appears only if the content is taller than the collapsedHeight */}
        {fullHeight > collapsedHeight && (
          <div className="flex justify-center">
          <button
            onClick={toggleExpand}
            className="bg-[#606c5d] text-white shadow-md hover:text-[#344E41] hover:bg-transparent duration-200 transition-colors
            rounded-full pr-5 pl-5 text-sm text-center"
          >
            {expanded ? 'Show Less' : 'Show More'}
          </button>
          </div>
        )}
      </div>
    );
  }