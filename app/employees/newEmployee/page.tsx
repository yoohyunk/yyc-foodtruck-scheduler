"use client";

import React, { useState, FormEvent, ReactElement, useRef } from "react";
import { useRouter } from "next/navigation";
import ErrorModal from "../../components/ErrorModal";
import {
  validateForm,
  ValidationRule,
  ValidationError,
  validateEmail,
  validateNumber,
  createValidationRule,
} from "../../../lib/formValidation";

export default function InviteEmployee(): ReactElement {
  const router = useRouter();
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

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

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
      const response = await fetch("/api/employees", {
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

      if (response.ok) {
        router.push("/employees");
      } else {
        setShowErrorModal(true);
      }
    } catch {
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="create-employee-page">
        <h1 className="form-header">Invite Employee</h1>
        <form onSubmit={handleSubmit} className="employee-form">
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
            />
          </div>

          <div className="input-group">
            <label htmlFor="employeeType" className="input-label">
              Employee Type <span className="text-red-500">*</span>
            </label>
            <select
              ref={employeeTypeRef}
              id="employeeType"
              name="employeeType"
              className="input-field"
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
            </label>
            <input
              ref={wageRef}
              type="number"
              id="wage"
              name="wage"
              min="0"
              step="0.01"
              className="input-field"
            />
          </div>

          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? "Sending Invite..." : "Send Invite"}
          </button>
        </form>
      </div>

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errors={validationErrors}
      />
    </>
  );
}
