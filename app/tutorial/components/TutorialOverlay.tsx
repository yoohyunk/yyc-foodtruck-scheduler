"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTutorial } from "../TutorialContext";

export function TutorialOverlay() {
  const { isActive, currentStep, steps, nextStep, previousStep, skipTutorial } = useTutorial();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Always call hooks before any return
  const currentStepData = steps[currentStep];

  // Simple, foolproof scroll logic
  useEffect(() => {
    if (!isActive || !currentStepData) return;

    console.log("=== TUTORIAL STEP CHANGED ===");
    console.log("Step ID:", currentStepData.id);
    console.log("Step Target:", currentStepData.target);
    console.log("Current step index:", currentStep);

    // For overview steps, scroll to top
    if (
      currentStepData.id.includes("welcome") ||
      currentStepData.id === "home-welcome" ||
      currentStepData.id === "calendar-view" ||
      currentStepData.id === "event-list" ||
      currentStepData.id === "employee-list" ||
      currentStepData.id === "navigation-tips"
    ) {
      console.log("Scrolling to top for overview step");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTargetRect(new DOMRect(0, 0, window.innerWidth, 100));
      return;
    }

    // For targeted steps, find and scroll to element
    console.log("Looking for target element:", currentStepData.target);
    
    // Debug: Log all elements with TutorialHighlight class
    const allHighlights = document.querySelectorAll('.TutorialHighlight');
    console.log("All TutorialHighlight elements found:", allHighlights.length);
    allHighlights.forEach((el, index) => {
      console.log(`Highlight ${index}:`, el.className, el.textContent?.slice(0, 50));
    });
    
    let targetElement = document.querySelector(currentStepData.target);
    
    // Fallback: If the exact selector doesn't work, try to find the element by index
    if (!targetElement && currentStepData.target.includes('.landing-links .TutorialHighlight:nth-child(')) {
      const match = currentStepData.target.match(/nth-child\((\d+)\)/);
      if (match) {
        const index = parseInt(match[1]) - 1; // Convert to 0-based index
        const highlights = document.querySelectorAll('.landing-links .TutorialHighlight');
        if (highlights[index]) {
          targetElement = highlights[index];
          console.log(`Found element using fallback index ${index}:`, targetElement);
        }
      }
    }
    
    if (targetElement) {
      console.log("✅ Found target element:", targetElement);
      console.log("Element classes:", targetElement.className);
      console.log("Element text:", targetElement.textContent?.slice(0, 100));
      
      // Scroll to element immediately
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
      
      // Set overlay position after a short delay to allow scroll to complete
      setTimeout(() => {
        const rect = targetElement.getBoundingClientRect();
        console.log("Setting target rect:", rect);
        setTargetRect(rect);
      }, 500);
    } else {
      console.log("❌ Target element not found:", currentStepData.target);
      console.log("Available elements with similar selectors:");
      
      // Try to find similar elements
      const parts = currentStepData.target.split(' ');
      parts.forEach(part => {
        const similar = document.querySelectorAll(part);
        if (similar.length > 0) {
          console.log(`Elements matching "${part}":`, similar.length);
        }
      });
      
      setTargetRect(null);
    }
  }, [isActive, currentStep, currentStepData]);

  // Only return after all hooks
  if (!isActive || !currentStepData) return null;

  return (
    <>
      {/* Overlay sections */}
      {targetRect && (
        <>
          <div
            className="tutorial-overlay-section"
            style={{ top: 0, left: 0, right: 0, height: targetRect.top }}
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
            style={{ top: targetRect.bottom, left: 0, right: 0, bottom: 0 }}
          />
        </>
      )}
      <div ref={overlayRef} className="tutorial-highlight-border" />
      <div className="tutorial-popup">
        <div className="tutorial-accent-bar" />
        <div className="tutorial-content">
          <div className="tutorial-header">
            <h3 className="tutorial-title">{currentStepData.title}</h3>
            <div className="tutorial-divider" />
            <p className="tutorial-description">{currentStepData.content}</p>
          </div>
          <div className="tutorial-progress">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`tutorial-progress-dot ${index === currentStep ? "tutorial-progress-dot-active" : index < currentStep ? "tutorial-progress-dot-completed" : "tutorial-progress-dot-inactive"}`}
              />
            ))}
          </div>
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
              {currentStep === steps.length - 1 ? "Finish ✨" : "Next →"}
            </button>
          </div>
        </div>
        <div className="tutorial-corner-accent tutorial-corner-accent-top" />
        <div className="tutorial-corner-accent tutorial-corner-accent-bottom" />
      </div>
    </>
  );
}
