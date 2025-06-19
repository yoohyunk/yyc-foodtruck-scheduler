"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTutorial } from "../TutorialContext";

export function TutorialOverlay() {
  const {
    isActive,
    currentStep,
    steps,
    nextStep,
    previousStep,
    skipTutorial,
    setPendingStepForNavigation,
  } = useTutorial();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  // Always call hooks before any return
  const currentStepData = steps[currentStep];

  // Scroll logic with proper positioning
  useEffect(() => {
    if (!isActive || !currentStepData) return;

    console.log("=== TUTORIAL STEP CHANGED ===");
    console.log("Step ID:", currentStepData.id);
    console.log("Step Target:", currentStepData.target);
    console.log("Current step index:", currentStep);

    // For welcome and overview steps, create overlay at the top
    if (
      currentStepData.id.includes("welcome") ||
      currentStepData.id === "home-welcome" ||
      currentStepData.id === "calendar-view" ||
      currentStepData.id === "event-list" ||
      currentStepData.id === "employee-list" ||
      currentStepData.id === "navigation-tips"
    ) {
      console.log("Welcome/overview step - creating overlay at top");
      setTargetRect(new DOMRect(0, 0, window.innerWidth, 300));
      return;
    }

    // For targeted steps, find and position overlay
    console.log("Looking for target element:", currentStepData.target);

    // Debug: Log all elements with TutorialHighlight class
    const allHighlights = document.querySelectorAll(".TutorialHighlight");
    console.log("All TutorialHighlight elements found:", allHighlights.length);
    allHighlights.forEach((el, index) => {
      console.log(
        `Highlight ${index}:`,
        el.className,
        el.textContent?.slice(0, 50)
      );
    });

    let targetElement = document.querySelector(currentStepData.target);

    // Fallback: If the exact selector doesn't work, try to find the element by index
    if (
      !targetElement &&
      currentStepData.target.includes(
        ".landing-links .TutorialHighlight:nth-child("
      )
    ) {
      const match = currentStepData.target.match(/nth-child\((\d+)\)/);
      if (match) {
        const index = parseInt(match[1]) - 1; // Convert to 0-based index
        const highlights = document.querySelectorAll(
          ".landing-links .TutorialHighlight"
        );
        if (highlights[index]) {
          targetElement = highlights[index];
          console.log(
            `Found element using fallback index ${index}:`,
            targetElement
          );
        }
      }
    }

    if (targetElement) {
      console.log("✅ Found target element:", targetElement);
      console.log("Element classes:", targetElement.className);
      console.log("Element text:", targetElement.textContent?.slice(0, 100));

      // Scroll to the target element
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });

      // Wait for scroll to complete, then set overlay position
      setTimeout(() => {
        const rect = targetElement.getBoundingClientRect();
        console.log("Setting target rect after scroll:", rect);
        setTargetRect(rect);
      }, 500);
    } else {
      console.log("❌ Target element not found:", currentStepData.target);
      console.log("Available elements with similar selectors:");

      // Try to find similar elements
      const parts = currentStepData.target.split(" ");
      parts.forEach((part) => {
        const similar = document.querySelectorAll(part);
        if (similar.length > 0) {
          console.log(`Elements matching "${part}":`, similar.length);
        }
      });

      setTargetRect(null);
    }
  }, [isActive, currentStep, currentStepData]);

  // Auto-action logic for steps with autoAction
  useEffect(() => {
    if (!isActive || !currentStepData || !currentStepData.autoAction) return;

    const { type, delay, nextPath, waitAfter, extra } =
      currentStepData.autoAction;
    let timeout1: NodeJS.Timeout;
    let timeout2: NodeJS.Timeout;

    timeout1 = setTimeout(() => {
      const targetElement = document.querySelector(currentStepData.target);
      if (targetElement) {
        if (type === "click") {
          (targetElement as HTMLElement).click();
        } else if (type === "focus") {
          (targetElement as HTMLElement).focus();
        } else if (type === "check") {
          if ((targetElement as HTMLInputElement).type === "checkbox") {
            (targetElement as HTMLInputElement).checked = true;
            // Trigger change event if needed
            const event = new Event("change", { bubbles: true });
            targetElement.dispatchEvent(event);
          }
        }
        // Handle extra actions like closing modals
        if (extra && extra.closeModal) {
          setTimeout(() => {
            // Try to find a close/cancel button in the modal
            const closeBtn = document.querySelector(
              '.modal-footer button, .modal button[aria-label="Close"], .modal button[aria-label="Cancel"]'
            );
            if (closeBtn) {
              (closeBtn as HTMLElement).click();
            }
          }, 800);
        }
      }
      if (nextPath) {
        // Set pending step before navigation
        setPendingStepForNavigation(currentStep + 1);
        timeout2 = setTimeout(() => {
          window.location.pathname = nextPath;
        }, waitAfter || 1000);
      }
    }, delay || 1000);

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [isActive, currentStep, currentStepData, setPendingStepForNavigation]);

  // Only return after all hooks
  if (!isActive || !currentStepData) return null;

  return (
    <>
      {/* Highlight border around target element - REMOVED */}
      {/* {targetRect && (
        <div
          ref={overlayRef}
          className="tutorial-highlight-border"
          style={{
            position: "fixed",
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            opacity: 1,
          }}
        />
      )} */}

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
