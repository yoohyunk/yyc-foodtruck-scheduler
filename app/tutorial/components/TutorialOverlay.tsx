"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTutorial } from "../TutorialContext";

export function TutorialOverlay() {
  const { isActive, currentStep, steps, nextStep, previousStep, skipTutorial } = useTutorial();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (isActive) {
      const currentStepData = steps[currentStep];
      const targetElement = document.querySelector(currentStepData.target);

      if (targetElement) {
        // First, scroll the element into view
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });

        // Wait for scroll to complete before positioning highlight
        const scrollDelay = currentStepData.id.includes('button') ? 800 : 600;

        setTimeout(() => {
          // Get the element's position after scroll
          const rect = targetElement.getBoundingClientRect();
          setTargetRect(rect);
          
          // Position the highlight overlay
          const overlay = overlayRef.current;
          if (overlay) {
            overlay.style.top = `${rect.top}px`;
            overlay.style.left = `${rect.left}px`;
            overlay.style.width = `${rect.width}px`;
            overlay.style.height = `${rect.height}px`;
            overlay.style.opacity = '1';
          }
        }, scrollDelay);
      }
    }
  }, [isActive, currentStep, steps]);

  if (!isActive) return null;

  const currentStepData = steps[currentStep];

  return (
    <>
      {/* Overlay sections */}
      {targetRect && (
        <>
          <div 
            className="tutorial-overlay-section"
            style={{
              top: 0,
              left: 0,
              right: 0,
              height: targetRect.top,
            }}
          />
          <div 
            className="tutorial-overlay-section"
            style={{
              top: targetRect.top,
              left: 0,
              width: targetRect.left,
              height: targetRect.height,
            }}
          />
          <div 
            className="tutorial-overlay-section"
            style={{
              top: targetRect.top,
              left: targetRect.right,
              right: 0,
              height: targetRect.height,
            }}
          />
          <div 
            className="tutorial-overlay-section"
            style={{
              top: targetRect.bottom,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
        </>
      )}

      {/* Highlighted element border */}
      <div
        ref={overlayRef}
        className="tutorial-highlight-border"
      />

      {/* Tutorial popup */}
      <div className="tutorial-popup">
        {/* Top accent bar */}
        <div className="tutorial-accent-bar" />
        
        {/* Content container */}
        <div className="tutorial-content">
          <div className="tutorial-header">
            <h3 className="tutorial-title">{currentStepData.title}</h3>
            <div className="tutorial-divider" />
            <p className="tutorial-description">{currentStepData.content}</p>
          </div>
          
          {/* Progress indicator */}
          <div className="tutorial-progress">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`tutorial-progress-dot ${
                  index === currentStep 
                    ? 'tutorial-progress-dot-active' 
                    : index < currentStep 
                    ? 'tutorial-progress-dot-completed' 
                    : 'tutorial-progress-dot-inactive'
                }`}
              />
            ))}
          </div>
          
          {/* Action buttons */}
          <div className="tutorial-actions">
            <button
              onClick={previousStep}
              disabled={currentStep === 0}
              className="tutorial-button tutorial-button-secondary"
            >
              ← Previous
            </button>
            
            <button
              onClick={skipTutorial}
              className="tutorial-button tutorial-button-skip"
            >
              Skip
            </button>
            
            <button
              onClick={nextStep}
              className="tutorial-button tutorial-button-primary"
            >
              {currentStep === steps.length - 1 ? 'Finish ✨' : 'Next →'}
            </button>
          </div>
        </div>
        
        {/* Corner accents */}
        <div className="tutorial-corner-accent tutorial-corner-accent-top" />
        <div className="tutorial-corner-accent tutorial-corner-accent-bottom" />
      </div>
    </>
  );
}
