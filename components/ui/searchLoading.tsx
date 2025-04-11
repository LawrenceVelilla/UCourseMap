// components/AnimeSpinner.tsx
'use client';

import React, { useEffect, useRef } from 'react';
import {animate} from 'animejs';

export function AnimeSpinner() {
  const spinnerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (spinnerRef.current) {
      animate(
        spinnerRef.current,
        {
        
        rotate: '360deg',
        easing: 'linear',
        duration: 1000,
        loop: true,
      });
    }
  }, []);

  return (
    <div
      ref={spinnerRef}
      style={{
        width: '16px',
        height: '16px',
        border: '2px solid currentColor',
        borderTop: '2px solid transparent',
        borderRadius: '50%',
        display: 'inline-block',
        marginRight: '8px',
      }}
    />
  );
}
