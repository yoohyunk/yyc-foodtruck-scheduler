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
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "0.5rem",
        flexWrap: "wrap",
      }}
    >
      <TutorialHighlight
        isHighlighted={shouldHighlight(
          ".navigation-container .TutorialHighlight:nth-child(1) button"
        )}
      >
        <button
          className="navigation-button bg-secondary-dark text-primary-dark hover:bg-primary-light hover:text-white"
          onClick={onPrevious}
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            fontWeight: "600",
            transition: "all 0.3s ease",
            border: "none",
            cursor: "pointer",
            fontSize: "0.875rem",
            minWidth: "80px",
            minHeight: "44px",
          }}
        >
          &larr; Prev
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
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            fontWeight: "600",
            transition: "all 0.3s ease",
            border: "none",
            cursor: "pointer",
            fontSize: "0.875rem",
            minWidth: "80px",
            minHeight: "44px",
          }}
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
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            fontWeight: "600",
            transition: "all 0.3s ease",
            border: "none",
            cursor: "pointer",
            fontSize: "0.875rem",
            minWidth: "80px",
            minHeight: "44px",
          }}
        >
          Next &rarr;
        </button>
      </TutorialHighlight>
    </TutorialHighlight>
  );
};
