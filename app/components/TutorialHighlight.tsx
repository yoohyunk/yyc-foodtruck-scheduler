"use client";

import React, { ReactNode, useEffect, useRef } from "react";

interface TutorialHighlightProps {
  children: ReactNode;
  isHighlighted: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function TutorialHighlight({ 
  children, 
  isHighlighted, 
  className = "", 
  style = {} 
}: TutorialHighlightProps) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;

    if (isHighlighted) {
      // Add highlight styles
      element.style.position = "relative";
      element.style.zIndex = "10";
      element.style.backgroundColor = "rgba(34, 197, 94, 0.2)";
      element.style.border = "3px solid #22c55e";
      element.style.borderRadius = "8px";
      element.style.boxShadow = "0 0 20px rgba(34, 197, 94, 0.4)";
      element.style.animation = "tutorial-pulse 2s ease-in-out infinite";
      element.style.transition = "all 0.3s ease";
    } else {
      // Remove highlight styles
      element.style.position = "";
      element.style.zIndex = "";
      element.style.backgroundColor = "";
      element.style.border = "";
      element.style.borderRadius = "";
      element.style.boxShadow = "";
      element.style.animation = "";
      element.style.transition = "";
    }
  }, [isHighlighted]);

  // Always include the TutorialHighlight class for selector targeting
  const combinedClassName = `TutorialHighlight ${className}`.trim();

  return (
    <div 
      ref={elementRef}
      className={combinedClassName}
      style={style}
    >
      {children}
    </div>
  );
}

// Add the pulse animation to the document
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes tutorial-pulse {
      0% {
        box-shadow: 0 0 20px rgba(34, 197, 94, 0.4);
        transform: scale(1);
      }
      50% {
        box-shadow: 0 0 30px rgba(34, 197, 94, 0.6);
        transform: scale(1.02);
      }
      100% {
        box-shadow: 0 0 20px rgba(34, 197, 94, 0.4);
        transform: scale(1);
      }
    }
  `;
  document.head.appendChild(style);
} 