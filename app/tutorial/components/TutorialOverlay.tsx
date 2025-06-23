"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
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

  const router = useRouter();

  // Always call hooks before any return
  const currentStepData = steps[currentStep];

  // Scroll logic with proper positioning
  useEffect(() => {
    if (!isActive || !currentStepData) return;

    // For welcome and overview steps, create overlay at the top
    if (
      currentStepData.id.includes("welcome") ||
      currentStepData.id === "home-welcome" ||
      currentStepData.id === "calendar-view" ||
      currentStepData.id === "event-list" ||
      currentStepData.id === "employee-list" ||
      currentStepData.id === "navigation-tips"
    ) {
      return;
    }

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
        }
      }
    }

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    }
  }, [isActive, currentStep, currentStepData]);

  // Auto-action logic for steps with autoAction
  useEffect(() => {
    if (!isActive || !currentStepData || !currentStepData.autoAction) return;

    const { type, delay, nextPath, waitAfter, extra } =
      currentStepData.autoAction;
    const timeout1 = setTimeout(() => {
      const targetElement = document.querySelector(currentStepData.target);

      // Special handling for modal checkboxes - these steps should always try to find the checkbox
      if (
        type === "check" &&
        (currentStepData.id === "select-employee-in-modal" ||
          currentStepData.id === "select-truck-in-modal")
      ) {
        // Wait for modal to open and find the checkbox
        let retryCount = 0;
        const maxRetries = 10;

        const findAndClickCheckbox = () => {
          const checkboxClass =
            currentStepData.id === "select-employee-in-modal"
              ? "employee-checkbox"
              : "truck-checkbox";

          // First check if the modal is actually open
          const modalOverlay = document.querySelector(".modal-overlay");
          if (!modalOverlay) {
            retryCount++;
            if (retryCount < maxRetries) {
              setTimeout(findAndClickCheckbox, 200);
            }
            return;
          }

          // Try multiple selectors to find the checkbox
          const modalCheckbox =
            document.querySelector(
              `.modal-body .TutorialHighlight input.${checkboxClass}:first-child`
            ) ||
            document.querySelector(
              `.modal-body input.${checkboxClass}:first-child`
            ) ||
            document.querySelector(
              `.modal-body label:has(input.${checkboxClass}) input:first-child`
            ) ||
            document.querySelector(`.${checkboxClass}:first-child`) ||
            document.querySelector(`input.${checkboxClass}:first-child`);

          const checkboxLabel =
            document.querySelector(
              `.modal-body .TutorialHighlight label:has(input.${checkboxClass}):first-child`
            ) ||
            document.querySelector(
              `.modal-body label:has(input.${checkboxClass}):first-child`
            ) ||
            document.querySelector(
              `label:has(input.${checkboxClass}):first-child`
            ) ||
            document.querySelector(`.modal-body label:first-child`);

          if (modalCheckbox) {
            // Try clicking the label first (this is how users typically interact)
            if (checkboxLabel) {
              (checkboxLabel as HTMLElement).click();
            } else {
              // Fallback: click the checkbox directly
              (modalCheckbox as HTMLElement).click();
            }

            // Handle modal closing if needed
            if (extra && extra.closeModal) {
              setTimeout(() => {
                const closeBtn = document.querySelector(
                  ".modal-footer .btn-secondary, .modal-footer button:first-child"
                );
                if (closeBtn) {
                  (closeBtn as HTMLElement).click();
                }
              }, 800);
            }
          } else {
            retryCount++;
            if (retryCount < maxRetries) {
              // Try again after a short delay
              setTimeout(findAndClickCheckbox, 200);
            }
          }
        };

        // Start looking for the checkbox with a longer initial delay for truck modal
        const initialDelay =
          currentStepData.id === "select-truck-in-modal" ? 500 : 300;
        setTimeout(findAndClickCheckbox, initialDelay);
        return;
      }

      if (targetElement) {
        if (type === "click") {
          (targetElement as HTMLElement).click();
        } else if (type === "focus") {
          (targetElement as HTMLElement).focus();
        } else if (type === "check") {
          if ((targetElement as HTMLInputElement).type === "checkbox") {
            (targetElement as HTMLInputElement).checked = true;
            // Trigger change event to update the state
            const changeEvent = new Event("change", { bubbles: true });
            targetElement.dispatchEvent(changeEvent);
          }
        }

        // Handle extra actions like closing modals
        if (extra && extra.closeModal) {
          setTimeout(() => {
            const closeBtn = document.querySelector(
              ".modal-footer .btn-secondary, .modal-footer button:first-child"
            );
            if (closeBtn) {
              (closeBtn as HTMLElement).click();
            }
          }, 800);
        }
      }

      if (nextPath) {
        // Replace placeholders with actual IDs from global variables
        let resolvedPath = nextPath;
        if (nextPath.includes("{eventId}")) {
          const eventId = (window as { __TUTORIAL_EVENT_ID?: string })
            .__TUTORIAL_EVENT_ID;
          if (eventId) resolvedPath = nextPath.replace("{eventId}", eventId);
        }
        if (nextPath.includes("{employeeId}")) {
          const employeeId = (window as { __TUTORIAL_EMPLOYEE_ID?: string })
            .__TUTORIAL_EMPLOYEE_ID;
          if (employeeId)
            resolvedPath = nextPath.replace("{employeeId}", employeeId);
        }
        setPendingStepForNavigation(0);
        setTimeout(() => {
          router.push(resolvedPath);
        }, waitAfter || 1000);
      }
    }, delay || 1000);

    return () => {
      clearTimeout(timeout1);
    };
  }, [
    isActive,
    currentStep,
    currentStepData,
    setPendingStepForNavigation,
    router,
  ]);

  // Only return after all hooks
  if (!isActive || !currentStepData) return null;

  return (
    <>
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
