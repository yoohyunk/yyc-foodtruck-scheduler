"use client";

import { useTutorial } from "../../tutorial/TutorialContext";
import { TutorialHighlight } from "../../components/TutorialHighlight";

interface ViewToggleProps {
  viewMode: "daily" | "weekly" | "monthly";
  onViewChange: (view: "daily" | "weekly" | "monthly") => void;
}

export const ViewToggle = ({ viewMode, onViewChange }: ViewToggleProps) => {
  const { shouldHighlight } = useTutorial();

  return (
    <TutorialHighlight
      isHighlighted={shouldHighlight(".view-toggle-container")}
      className="view-toggle-container"
    >
      <TutorialHighlight
        isHighlighted={shouldHighlight(".view-toggle-container .TutorialHighlight:nth-child(1) button")}
      >
        <button
          className={`view-toggle-button ${
            viewMode === "daily"
              ? "bg-primary-medium text-white"
              : "bg-secondary-dark text-primary-dark"
          }`}
          onClick={() => onViewChange("daily")}
        >
          Daily View
        </button>
      </TutorialHighlight>
      <TutorialHighlight
        isHighlighted={shouldHighlight(".view-toggle-container .TutorialHighlight:nth-child(2) button")}
      >
        <button
          className={`view-toggle-button ${
            viewMode === "weekly"
              ? "bg-primary-medium text-white"
              : "bg-secondary-dark text-primary-dark"
          }`}
          onClick={() => onViewChange("weekly")}
        >
          Weekly View
        </button>
      </TutorialHighlight>
      <TutorialHighlight
        isHighlighted={shouldHighlight(".view-toggle-container .TutorialHighlight:nth-child(3) button")}
      >
        <button
          className={`view-toggle-button ${
            viewMode === "monthly"
              ? "bg-primary-medium text-white"
              : "bg-secondary-dark text-primary-dark"
          }`}
          onClick={() => onViewChange("monthly")}
        >
          Monthly View
        </button>
      </TutorialHighlight>
    </TutorialHighlight>
  );
};
