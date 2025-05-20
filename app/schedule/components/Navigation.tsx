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
  return (
    <div className="navigation-container">
      <button
        className="navigation-button bg-secondary-dark text-primary-dark hover:bg-primary-light hover:text-white"
        onClick={onPrevious}
      >
        &larr; Previous
      </button>
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
      <button
        className="navigation-button bg-secondary-dark text-primary-dark hover:bg-primary-light hover:text-white"
        onClick={onNext}
      >
        Next &rarr;
      </button>
    </div>
  );
};
