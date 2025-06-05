'use client';

import React, { useEffect, useRef } from 'react';
import { useTutorial } from '../TutorialContext';

export function TutorialOverlay() {
  const { isActive, currentStep, steps, nextStep, previousStep, skipTutorial } = useTutorial();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isActive && overlayRef.current) {
      const currentStepData = steps[currentStep];
      const targetElement = document.querySelector(currentStepData.target);
      
      if (targetElement) {
        // First scroll the target element into view with a longer delay for navigation buttons
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'center'
        });

        // Wait for scroll to complete before positioning overlay
        // Use a longer delay for navigation buttons to ensure proper scrolling
        const delay = currentStepData.id.includes('button') ? 800 : 500;
        
        setTimeout(() => {
          const rect = targetElement.getBoundingClientRect();
          const overlay = overlayRef.current;
          
          if (overlay) {
            // Position the overlay
            overlay.style.top = `${rect.top}px`;
            overlay.style.left = `${rect.left}px`;
            overlay.style.width = `${rect.width}px`;
            overlay.style.height = `${rect.height}px`;
            overlay.style.opacity = '1';
          }
        }, delay);
      }
    }
  }, [isActive, currentStep, steps]);

  if (!isActive) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      <div
        ref={overlayRef}
        className="absolute border-2 border-primary-light rounded-lg transition-opacity duration-300 opacity-0"
      />
      <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg max-w-md">
        <h3 className="text-lg font-semibold mb-2">{currentStepData.title}</h3>
        <p className="mb-4">{currentStepData.content}</p>
        <div className="flex justify-between">
          <button
            onClick={previousStep}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={skipTutorial}
            className="px-4 py-2 bg-gray-200 rounded"
          >
            Skip
          </button>
          <button
            onClick={nextStep}
            className="px-4 py-2 bg-primary-medium text-white rounded"
          >
            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
} 