interface ViewToggleProps {
  viewMode: "daily" | "weekly" | "monthly";
  onViewChange: (view: "daily" | "weekly" | "monthly") => void;
}

export const ViewToggle = ({ viewMode, onViewChange }: ViewToggleProps) => {
  return (
    <div className="view-toggle-container">
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
    </div>
  );
};
