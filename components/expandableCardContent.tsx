'use client';

import React, { useEffect, useRef, useState } from 'react';
import { animate } from 'animejs';

interface ExpandableCardContentProps {
  children: React.ReactNode;
  collapsedHeight?: number;
  overlayColor?: string;
}

export function ExpandableCardContent({
  children,
  collapsedHeight = 150,
}: ExpandableCardContentProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [expanded, setExpanded] = useState(false);
    const [fullHeight, setFullHeight] = useState<number>(0);
    const [isOverflowing, setIsOverflowing] = useState(false);
  
    // Reset to collapsed state whenever children change
    useEffect(() => {
      setExpanded(false);
    }, [children]);

    // Measure full content height when mounted or children change
    useEffect(() => {
      if (containerRef.current) {
        // Temporarily set height to auto to measure full height
        containerRef.current.style.height = 'auto';
        const measuredHeight = containerRef.current.scrollHeight;
        setFullHeight(measuredHeight);
        
        // Check if content overflows collapsed height
        setIsOverflowing(measuredHeight > collapsedHeight);
        
        // Reset to collapsed state if not expanded
        if (!expanded) {
          containerRef.current.style.height = `${collapsedHeight}px`;
          containerRef.current.style.overflow = 'hidden';
        } else {
          // If expanded, still need to update height in case content changed
          containerRef.current.style.height = 'auto';
          containerRef.current.style.overflow = 'visible';
        }
      }
    }, [children, expanded, collapsedHeight]);
  
    // Toggle expand / collapse state with a smooth height animation
    const toggleExpand = () => {
      if (!containerRef.current) return;
  
      if (expanded) {
        // Animate from full height back to collapsed height
        animate(containerRef.current, {
          height: collapsedHeight,
          duration: 300,
          easing: 'easeOutQuad',
          complete: () => {
            if (containerRef.current) {
              containerRef.current.style.overflow = 'hidden';
            }
            setExpanded(false);
          },
        });
      } else {
        // Animate from collapsed height to full content height
        animate(containerRef.current, {
          height: fullHeight,
          duration: 300,
          easing: 'easeOutQuad',
          begin: () => {
            if (containerRef.current) {
              containerRef.current.style.overflow = 'visible';
            }
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
            {!expanded && isOverflowing && (
              <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-white to-transparent" />
            )}
          </div>
        </div>
        {/* Toggle button appears only if the content is taller than the collapsedHeight */}
        {isOverflowing && (
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