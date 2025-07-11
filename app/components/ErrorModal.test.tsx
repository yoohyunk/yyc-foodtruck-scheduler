import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import ErrorModal from "./ErrorModal";
import { ValidationError } from "@/lib/formValidation";

const errors: ValidationError[] = [
  { field: "email", message: "Email is invalid" },
  { field: "password", message: "Password is too short" },
];

describe("ErrorModal", () => {
  it("renders nothing when isOpen is false", () => {
    render(<ErrorModal isOpen={false} onClose={jest.fn()} errors={errors} />);
    expect(
      screen.queryByText("Please fix the following errors:")
    ).not.toBeInTheDocument();
  });

  it("renders the modal and error messages when open", () => {
    render(<ErrorModal isOpen={true} onClose={jest.fn()} errors={errors} />);
    expect(
      screen.getByText("Please fix the following errors:")
    ).toBeInTheDocument();
    expect(screen.getByText("Email is invalid")).toBeInTheDocument();
    expect(screen.getByText("Password is too short")).toBeInTheDocument();
  });

  it("calls onClose when OK button is clicked", () => {
    const onClose = jest.fn();
    render(<ErrorModal isOpen={true} onClose={onClose} errors={errors} />);
    fireEvent.click(screen.getByText("OK"));
    expect(onClose).toHaveBeenCalled();
  });

  it("renders with custom title", () => {
    render(
      <ErrorModal
        isOpen={true}
        onClose={jest.fn()}
        errors={errors}
        title="Custom Title"
      />
    );
    expect(screen.getByText("Custom Title")).toBeInTheDocument();
  });

  it("shows confirm and cancel for confirmation type", () => {
    const onConfirm = jest.fn();
    const onClose = jest.fn();
    render(
      <ErrorModal
        isOpen={true}
        onClose={onClose}
        errors={errors}
        type="confirmation"
        onConfirm={onConfirm}
        confirmText="Yes"
        cancelText="No"
      />
    );
    // Both buttons
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();

    // Confirm button triggers both onConfirm and onClose
    fireEvent.click(screen.getByText("Yes"));
    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();

    // Cancel button only triggers onClose
    fireEvent.click(screen.getByText("No"));
    expect(onClose).toHaveBeenCalledTimes(2); // Called twice now
  });
});
