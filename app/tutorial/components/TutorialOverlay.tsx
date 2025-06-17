"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTutorial } from "../TutorialContext";

export function TutorialOverlay() {
  const { isActive, currentStep, steps, nextStep, previousStep, skipTutorial } =
    useTutorial();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Always call hooks before any return
  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (!isActive || !currentStepData) return;
    // Skip scrolling for overview steps that should scroll to top
    if (
      currentStepData.id.includes("welcome") ||
      currentStepData.id === "calendar-view" ||
      currentStepData.id === "event-list" ||
      currentStepData.id === "employee-list" ||
      currentStepData.id === "navigation-tips"
    ) {
      setTimeout(() => {
        setTargetRect(new DOMRect(0, 0, window.innerWidth, 100));
      }, 1000);
      return;
    }
    const targetElement = document.querySelector(currentStepData.target);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
      const scrollDelay = currentStepData.id.includes("button") ? 800 : 600;
      setTimeout(() => {
        const rect = targetElement.getBoundingClientRect();
        setTargetRect(rect);
        const overlay = overlayRef.current;
        if (overlay) {
          overlay.style.top = `${rect.top}px`;
          overlay.style.left = `${rect.left}px`;
          overlay.style.width = `${rect.width}px`;
          overlay.style.height = `${rect.height}px`;
          overlay.style.opacity = "1";
        }
      }, scrollDelay);
    }
  }, [isActive, currentStep, steps, currentStepData]);

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
