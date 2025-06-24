"use client";

import React, {
  useState,
  FormEvent,
  ReactElement,
  useRef,
  useEffect,
} from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ErrorModal from "../../components/ErrorModal";
import {
  validateForm,
  ValidationRule,
  ValidationError,
  validateEmail,
  validateNumber,
  createValidationRule,
  handleAutofill,
} from "../../../lib/formValidation";

export default function InviteEmployee(): ReactElement {
  const router = useRouter();
  const { isAdmin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );

  // Refs for form fields
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const employeeTypeRef = useRef<HTMLSelectElement>(null);
  const wageRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Set up autofill detection for all form fields
  useEffect(() => {
    const fields = [
      firstNameRef,
      lastNameRef,
      emailRef,
      employeeTypeRef,
      wageRef,
    ];

    fields.forEach((fieldRef) => {
      if (fieldRef.current) {
        handleAutofill(fieldRef.current, () => {
          // Update form data when autofill is detected
          const fieldName = fieldRef.current?.name;
          console.log(`Autofill detected for field: ${fieldName}`);
          if (fieldName) {
            // Trigger a synthetic change event to update form state
            const event = new Event("change", { bubbles: true });
            fieldRef.current?.dispatchEvent(event);
          }
        });
      }
    });
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    // Check if user is admin before allowing employee type selection
    if (!isAdmin) {
      setValidationErrors([
        {
          field: "admin",
          message:
            "Only administrators can invite new employees and set employee types.",
          element: null,
        },
      ]);
      setShowErrorModal(true);
      return;
    }

    const formData = {
      firstName: firstNameRef.current?.value.trim() || "",
      lastName: lastNameRef.current?.value.trim() || "",
      email: emailRef.current?.value.trim() || "",
      employeeType: employeeTypeRef.current?.value || "",
      wage: wageRef.current?.value || "",
    };

    const validationRules: ValidationRule[] = [
      createValidationRule(
        "firstName",
        true,
        undefined,
        "First name is required.",
        firstNameRef.current
      ),
      createValidationRule(
        "lastName",
        true,
        undefined,
        "Last name is required.",
        lastNameRef.current
      ),
      createValidationRule(
        "email",
        true,
        (value: unknown) => typeof value === "string" && validateEmail(value),
        "Please enter a valid email address.",
        emailRef.current
      ),
      createValidationRule(
        "employeeType",
        true,
        undefined,
        "Employee type is required.",
        employeeTypeRef.current
      ),
      createValidationRule(
        "wage",
        true,
        (value: unknown) =>
          (typeof value === "string" || typeof value === "number") &&
          validateNumber(value, 0),
        "Wage is required and must be a positive number.",
        wageRef.current
      ),
    ];

    const validationErrors = validateForm(formData, validationRules);
    setValidationErrors(validationErrors);

    if (validationErrors.length > 0) {
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          employeeType: formData.employeeType,
          wage: parseFloat(formData.wage),
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Invite failed");

      setValidationErrors([
        {
          field: "success",
          message: `Invite sent to ${formData.email}!`,
          element: null,
        },
      ]);
      setShowErrorModal(true);
      setTimeout(() => {
        router.push("/employees");
      }, 2000);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setValidationErrors([
        {
          field: "submit",
          message: errorMessage,
          element: null,
        },
      ]);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="create-employee-page">
        <h1 className="form-header">Invite Employee</h1>
        {!isAdmin && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <p className="text-yellow-800">
              <strong>Access Restricted:</strong> Only administrators can invite
              new employees and set employee types.
            </p>
          </div>
        )}
        <form ref={formRef} onSubmit={handleSubmit} className="employee-form">
          <div className="input-group">
            <label htmlFor="firstName" className="input-label">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={firstNameRef}
              type="text"
              id="firstName"
              name="firstName"
              className="input-field"
              disabled={!isAdmin}
            />
          </div>

          <div className="input-group">
            <label htmlFor="lastName" className="input-label">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={lastNameRef}
              type="text"
              id="lastName"
              name="lastName"
              className="input-field"
              disabled={!isAdmin}
            />
          </div>

          <div className="input-group">
            <label htmlFor="email" className="input-label">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              ref={emailRef}
              type="email"
              id="email"
              name="email"
              className="input-field"
              disabled={!isAdmin}
            />
          </div>

          <div className="input-group">
            <label htmlFor="employeeType" className="input-label">
              Employee Type <span className="text-red-500">*</span>
              {!isAdmin && (
                <span className="text-yellow-600 ml-2">(Admin Only)</span>
              )}
            </label>
            <select
              ref={employeeTypeRef}
              id="employeeType"
              name="employeeType"
              className="input-field"
              disabled={!isAdmin}
            >
              <option value="">Select Employee Type</option>
              <option value="Driver">Driver</option>
              <option value="Server">Server</option>
              <option value="Admin">Admin</option>
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="wage" className="input-label">
              Hourly Wage <span className="text-red-500">*</span>
              {!isAdmin && (
                <span className="text-yellow-600 ml-2">(Admin Only)</span>
              )}
            </label>
            <input
              ref={wageRef}
              type="number"
              id="wage"
              name="wage"
              min="0"
              step="0.01"
              className="input-field"
              disabled={!isAdmin}
            />
          </div>

          <button
            type="submit"
            className="button"
            disabled={isSubmitting || !isAdmin}
          >
            {isSubmitting
              ? "Sending Invite..."
              : isAdmin
                ? "Send Invite"
                : "Admin Access Required"}
          </button>
        </form>
      </div>

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errors={validationErrors}
        title={
          validationErrors.length === 1 && validationErrors[0].field === "success"
            ? "Success!"
            : "Please fix the following errors:"
        }
      />
    </>
  );
}
