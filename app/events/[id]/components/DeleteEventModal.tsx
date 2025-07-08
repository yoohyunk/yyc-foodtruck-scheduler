import React from "react";
import { TutorialHighlight } from "../../../components/TutorialHighlight";

interface DeleteEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: () => void;
  shouldHighlight: (selector: string) => boolean;
}

export default function DeleteEventModal({
  isOpen,
  onClose,
  onDelete,
  shouldHighlight,
}: DeleteEventModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <h3 className="modal-title text-red-700">Delete Event</h3>
        <div className="modal-body">
          <div
            className="text-4xl mb-4 text-center"
            style={{ color: "var(--error-medium)" }}
          >
            &#10060;
          </div>
          <p className="text-lg font-bold mb-2 text-gray-900 text-center">
            Are you sure you want to delete this event?
          </p>
          <p className="mb-6 text-gray-700 text-center">
            This action cannot be undone.
          </p>
        </div>
        <div className="modal-footer flex justify-center gap-4">
          <TutorialHighlight
            isHighlighted={shouldHighlight(
              ".modal-footer button.btn-secondary"
            )}
          >
            <button className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
          </TutorialHighlight>
          <button
            className="btn-primary bg-red-600 hover:bg-red-700 text-white"
            onClick={onDelete}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
