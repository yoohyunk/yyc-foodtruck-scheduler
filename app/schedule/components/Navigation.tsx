"use client";

import { useTutorial } from "../../tutorial/TutorialContext";
import { TutorialHighlight } from "../../components/TutorialHighlight";

interface NavigationProps {
  viewMode: "daily" | "weekly" | "monthly";
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export const Navigation = ({
  viewMode,
  onPrevious,
  onNext,
  onToday,
}: NavigationProps) => {
  const { shouldHighlight } = useTutorial();

  return (
    <TutorialHighlight
      isHighlighted={shouldHighlight(".navigation-container")}
      className="navigation-container"
    >
      <TutorialHighlight
        isHighlighted={shouldHighlight(
          ".navigation-container .TutorialHighlight:nth-child(1) button"
        )}
      >
        <button
          className="navigation-button bg-secondary-dark text-primary-dark hover:bg-primary-light hover:text-white"
          onClick={onPrevious}
        >
          &larr; Previous
        </button>
      </TutorialHighlight>
      <TutorialHighlight
        isHighlighted={shouldHighlight(
          ".navigation-container .TutorialHighlight:nth-child(2) button"
        )}
      >
        <button
          className="navigation-button bg-primary-medium text-white hover:bg-primary-dark"
          onClick={onToday}
        >
          {viewMode === "daily"
            ? "Today"
            : viewMode === "weekly"
              ? "This Week"
              : "This Month"}
        </button>
      </TutorialHighlight>
      <TutorialHighlight
        isHighlighted={shouldHighlight(
          ".navigation-container .TutorialHighlight:nth-child(3) button"
        )}
      >
        <button
          className="navigation-button bg-secondary-dark text-primary-dark hover:bg-primary-light hover:text-white"
          onClick={onNext}
        >
          Next &rarr;
        </button>
      </TutorialHighlight>
    </TutorialHighlight>
  );
};
