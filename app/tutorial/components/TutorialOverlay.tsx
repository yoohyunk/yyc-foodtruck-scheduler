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
          setTargetRect(rect);
          
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
    <>
      {/* Top overlay */}
      {targetRect && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{
            top: 0,
            left: 0,
            right: 0,
            height: targetRect.top,
            backgroundColor: 'rgba(254, 243, 199, 0.15)',
          }}
        />
      )}
      
      {/* Left overlay */}
      {targetRect && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{
            top: targetRect.top,
            left: 0,
            width: targetRect.left,
            height: targetRect.height,
            backgroundColor: 'rgba(254, 243, 199, 0.15)',
          }}
        />
      )}
      
      {/* Right overlay */}
      {targetRect && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{
            top: targetRect.top,
            left: targetRect.right,
            right: 0,
            height: targetRect.height,
            backgroundColor: 'rgba(254, 243, 199, 0.15)',
          }}
        />
      )}
      
      {/* Bottom overlay */}
      {targetRect && (
        <div 
          className="fixed z-50 pointer-events-none"
          style={{
            top: targetRect.bottom,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(254, 243, 199, 0.15)',
          }}
        />
      )}

      {/* Highlighted element border */}
      <div
        ref={overlayRef}
        className="absolute border-4 border-blue-500 rounded-lg transition-opacity duration-300 opacity-0 shadow-2xl z-50 pointer-events-none"
        style={{
          boxShadow: '0 0 0 4px rgba(59, 130, 246, 0.3), 0 0 20px rgba(59, 130, 246, 0.5)',
          background: 'transparent'
        }}
      />

      {/* Tutorial popup */}
      <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 bg-white p-6 rounded-xl shadow-2xl max-w-md border border-gray-200 z-50">
        <h3 className="text-xl font-bold mb-3 text-gray-900">{currentStepData.title}</h3>
        <p className="mb-6 text-gray-700 leading-relaxed">{currentStepData.content}</p>
        <div className="flex justify-between gap-3">
          <button
            onClick={previousStep}
            disabled={currentStep === 0}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-300 transition-colors font-medium"
          >
            Previous
          </button>
          <button
            onClick={skipTutorial}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Skip
          </button>
          <button
            onClick={nextStep}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            {currentStep === steps.length - 1 ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </>
  );
}
