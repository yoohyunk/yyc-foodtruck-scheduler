"use client";

import React from "react";
import { useTutorial } from "../TutorialContext";

export function TutorialButton() {
  const { startTutorial } = useTutorial();

  return (
    <button
      onClick={startTutorial}
      className="flex items-center gap-2 text-primary-light hover:text-white transition-colors"
    >
      <span>📚</span>
      <span>Help</span>
    </button>
  );
}
