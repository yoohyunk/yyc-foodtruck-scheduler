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

    // Use a more stable timeout to prevent multiple executions
    const timeout1 = setTimeout(() => {
      // Only proceed if the tutorial is still active and on the same step
      if (!isActive || !currentStepData) return;

      const targetElement = document.querySelector(currentStepData.target);

      // Special handling for modal checkboxes - these steps should always try to find the checkbox
      if (
        type === "check" &&
        (currentStepData.id === "select-available-employee" ||
          currentStepData.id === "select-available-truck")
      ) {
        // Wait for modal to open and find the checkbox
        let retryCount = 0;
        const maxRetries = 10;

        const findAndClickCheckbox = () => {
          // Check if tutorial is still active before proceeding
          if (!isActive || !currentStepData) return;

          const checkboxClass =
            currentStepData.id === "select-available-employee"
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

          // For employee selection, find an available employee (no warning messages, enabled checkbox)
          if (currentStepData.id === "select-available-employee") {
            // Find all employee items in the new modal structure
            const employeeItems = document.querySelectorAll(
              ".employee-list-container .employee-label"
            );

            // Find the first available employee (one without warning messages and with enabled checkbox)
            let availableEmployeeItem = null;
            for (let i = 0; i < employeeItems.length; i++) {
              const item = employeeItems[i];
              // Check if this employee has warning messages (unavailable)
              const warningElement = item.querySelector(
                ".text-xs.text-red-600"
              );

              // Skip if there are warning messages
              if (warningElement) {
                continue;
              }

              // Check if checkbox is enabled and not disabled
              const checkbox = item.querySelector(
                "input.employee-checkbox"
              ) as HTMLInputElement;

              if (checkbox && !checkbox.disabled) {
                availableEmployeeItem = item;
                break;
              }
            }

            if (availableEmployeeItem) {
              // Add a delay before clicking to make it more natural
              setTimeout(() => {
                // Check if tutorial is still active before clicking
                if (!isActive || !currentStepData) return;

                // Click the available employee label
                (availableEmployeeItem as HTMLElement).click();

                // Handle modal closing if needed
                if (extra && extra.closeModal) {
                  setTimeout(() => {
                    // Check if tutorial is still active before closing modal
                    if (!isActive || !currentStepData) return;

                    // Find and click the Save button instead of Close
                    const saveButton = document.querySelector(
                      ".modal-footer .btn-primary"
                    );
                    if (saveButton) {
                      (saveButton as HTMLElement).click();
                    }
                  }, 5000); // 5 seconds delay before saving
                }
              }, 500); // 500ms delay before clicking
            } else {
              retryCount++;
              if (retryCount < maxRetries) {
                setTimeout(findAndClickCheckbox, 200);
              }
            }
            return;
          }

          // For truck selection, find an available truck (green "Available" badge)
          if (currentStepData.id === "select-available-truck") {
            // Find all truck assignments
            const truckAssignments = document.querySelectorAll(
              ".modal-body .truck-assignment"
            );

            // Find the first available truck (one with green "Available" badge)
            let availableTruckAssignment = null;
            for (const assignment of truckAssignments) {
              const availabilityBadge = assignment.querySelector(
                ".bg-green-100.text-green-800"
              );
              if (availabilityBadge) {
                availableTruckAssignment = assignment;
                break;
              }
            }

            if (availableTruckAssignment) {
              // Step 1: Click the truck checkbox to select it
              setTimeout(() => {
                // Check if tutorial is still active before clicking
                if (!isActive || !currentStepData) return;

                // Find and click the checkbox for the available truck
                const checkbox = availableTruckAssignment.querySelector(
                  `input.${checkboxClass}`
                );
                if (checkbox) {
                  (checkbox as HTMLElement).click();

                  // Step 2: Wait for driver dropdown to appear and select a driver
                  setTimeout(() => {
                    // Check if tutorial is still active before proceeding
                    if (!isActive || !currentStepData) return;

                    // Find the driver dropdown within this truck assignment
                    const driverDropdown =
                      availableTruckAssignment.querySelector(
                        "select"
                      ) as HTMLSelectElement;

                    if (driverDropdown && driverDropdown.options.length > 1) {
                      // Select the first available driver (skip the "No driver assigned" option)
                      driverDropdown.selectedIndex = 1;
                      // Trigger change event to update the state
                      const changeEvent = new Event("change", {
                        bubbles: true,
                      });
                      driverDropdown.dispatchEvent(changeEvent);

                      // Step 3: Wait a bit and then save the assignment
                      setTimeout(() => {
                        // Check if tutorial is still active before saving
                        if (!isActive || !currentStepData) return;

                        // Find and click the Save Assignments button
                        const saveButton = document.querySelector(
                          ".modal-footer .btn-primary"
                        );
                        if (saveButton) {
                          (saveButton as HTMLElement).click();
                        }
                      }, 1000); // Wait 1 second before saving
                    } else {
                      // If no drivers available, just save the truck assignment without a driver
                      setTimeout(() => {
                        // Check if tutorial is still active before saving
                        if (!isActive || !currentStepData) return;

                        // Find and click the Save Assignments button
                        const saveButton = document.querySelector(
                          ".modal-footer .btn-primary"
                        );
                        if (saveButton) {
                          (saveButton as HTMLElement).click();
                        }
                      }, 1000); // Wait 1 second before saving
                    }
                  }, 1000); // Wait 1 second for dropdown to appear
                }
              }, 500); // 500ms delay before clicking truck checkbox
            } else {
              retryCount++;
              if (retryCount < maxRetries) {
                setTimeout(findAndClickCheckbox, 200);
              }
            }
            return;
          }
        };

        // Start looking for the checkbox with a longer initial delay for truck modal
        const initialDelay =
          currentStepData.id === "select-available-truck" ? 500 : 300;
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
            // Check if tutorial is still active before closing modal
            if (!isActive || !currentStepData) return;

            const closeBtn = document.querySelector(
              ".modal-footer .btn-secondary, .modal-footer button:first-child"
            );
            if (closeBtn) {
              (closeBtn as HTMLElement).click();
            }
          }, 3000);
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
          // Check if tutorial is still active before navigation
          if (!isActive || !currentStepData) return;

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

  // Add effect to handle Next button clicks for modal steps
  useEffect(() => {
    if (!isActive || !currentStepData) return;

    // Check if we're on a modal step that needs special handling
    if (currentStepData.id === "select-available-employee") {
      // Listen for Next button clicks
      const handleNextButtonClick = () => {
        // Check if modal is open
        const modalOverlay = document.querySelector(".modal-overlay");
        if (modalOverlay) {
          // Find and click the Save button to close the modal
          const saveButton = document.querySelector(
            ".modal-footer .btn-primary"
          );
          if (saveButton) {
            (saveButton as HTMLElement).click();
          }
        }
      };

      // Add event listener to the Next button
      const nextButton = document.querySelector(
        ".tutorial-button-primary"
      );
      if (nextButton) {
        nextButton.addEventListener("click", handleNextButtonClick);
        return () => {
          nextButton.removeEventListener("click", handleNextButtonClick);
        };
      }
    }
  }, [isActive, currentStepData]);

  // Only return after all hooks
  if (!isActive || !currentStepData) {
    return null;
  }

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
