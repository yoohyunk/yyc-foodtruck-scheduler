"use client";

import React from "react";
import { useTutorial } from "../TutorialContext";

export function TutorialButton() {
  const { startTutorial } = useTutorial();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTutorial();
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-2 text-primary-light hover:text-white transition-colors"
      style={{ cursor: "pointer" }}
      type="button"
      data-testid="tutorial-button"
    >
      <span>📚</span>
      <span>Help</span>
    </button>
  );
}
