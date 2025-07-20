"use client";

import { useState, useEffect } from "react";
import { useTutorial } from "../../tutorial/TutorialContext";
import { TutorialHighlight } from "../../components/TutorialHighlight";

interface ViewToggleProps {
  viewMode: "daily" | "weekly" | "monthly";
  onViewChange: (view: "daily" | "weekly" | "monthly") => void;
}

export const ViewToggle = ({ viewMode, onViewChange }: ViewToggleProps) => {
  const { shouldHighlight } = useTutorial();
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // If mobile and monthly is selected, switch to daily
  useEffect(() => {
    if (isMobile && viewMode === "monthly") {
      onViewChange("daily");
    }
  }, [isMobile, viewMode, onViewChange]);

  return (
    <TutorialHighlight
      isHighlighted={shouldHighlight(".view-toggle-container")}
      className="view-toggle-container"
      style={{
        display: "flex",
        gap: "0.5rem",
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
      <TutorialHighlight
        isHighlighted={shouldHighlight(
          ".view-toggle-container .TutorialHighlight:nth-child(1) button"
        )}
      >
        <button
          className={`view-toggle-button ${
            viewMode === "daily"
              ? "bg-primary-medium text-white"
              : "bg-secondary-dark text-primary-dark"
          }`}
          onClick={() => onViewChange("daily")}
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
          Daily
        </button>
      </TutorialHighlight>
      <TutorialHighlight
        isHighlighted={shouldHighlight(
          ".view-toggle-container .TutorialHighlight:nth-child(2) button"
        )}
      >
        <button
          className={`view-toggle-button ${
            viewMode === "weekly"
              ? "bg-primary-medium text-white"
              : "bg-secondary-dark text-primary-dark"
          }`}
          onClick={() => onViewChange("weekly")}
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
          Weekly
        </button>
      </TutorialHighlight>
      <TutorialHighlight
        isHighlighted={shouldHighlight(
          ".view-toggle-container .TutorialHighlight:nth-child(3) button"
        )}
      >
        <button
          className={`view-toggle-button ${
            viewMode === "monthly"
              ? "bg-primary-medium text-white"
              : "bg-secondary-dark text-primary-dark"
          }`}
          onClick={() => onViewChange("monthly")}
          disabled={isMobile}
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            fontWeight: "600",
            transition: "all 0.3s ease",
            border: "none",
            cursor: isMobile ? "not-allowed" : "pointer",
            fontSize: "0.875rem",
            minWidth: "80px",
            minHeight: "44px",
            opacity: isMobile ? 0.5 : 1,
            filter: isMobile ? "grayscale(50%)" : "none",
          }}
          title={
            isMobile
              ? "Monthly view not available on mobile"
              : "Switch to monthly view"
          }
        >
          Monthly
          {isMobile && (
            <span
              style={{
                fontSize: "0.75rem",
                display: "block",
                marginTop: "0.25rem",
                opacity: 0.7,
              }}
            >
              (Desktop only)
            </span>
          )}
        </button>
      </TutorialHighlight>
    </TutorialHighlight>
  );
};
