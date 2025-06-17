"use client";

import React, { useState, FormEvent, ReactElement, useRef } from "react";
import { useRouter } from "next/navigation";

export default function InviteEmployee(): ReactElement {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [wage, setWage] = useState("$");

  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");

    const firstName = firstNameRef.current?.value.trim() || "";
    const lastName = lastNameRef.current?.value.trim() || "";
    const email = emailRef.current?.value.trim() || "";
    const wageValue = wage.trim().replace("$", "") || "";

    if (!firstName) {
      setError("First name is required.");
      return;
    }
    if (!lastName) {
      setError("Last name is required.");
      return;
    }
    if (!email) {
      setError("Email is required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!wageValue) {
      setError("Wage is required.");
      return;
    }
    const wageNumber = parseFloat(wageValue);
    if (isNaN(wageNumber) || wageNumber <= 0) {
      setError("Please enter a valid wage amount.");
      return;
    }
    if (wageNumber > 100) {
      setError("Wage must be between $0 and $100 per hour.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, wage: wageNumber }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Invite failed");

      alert(`Invite sent to ${email}!`);
      router.push("/employees");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9.]/g, ''); // Remove all non-numeric characters except decimal
    // Ensure only one decimal point
    const parts = value.split('.');
    if (parts.length > 2) {
      value = parts[0] + '.' + parts.slice(1).join('');
    }
    // Limit to 2 decimal places while typing, but don't force
    if (parts.length === 2 && parts[1].length > 2) {
      value = parts[0] + '.' + parts[1].substring(0, 2);
    }
    setWage(value ? `$${value}` : '$');
  };

  const handleWageBlur = () => {
    // Remove $ and format to two decimals if valid
    let value = wage.replace(/[^0-9.]/g, '');
    if (value && !isNaN(parseFloat(value))) {
      const num = parseFloat(value);
      if (num <= 100) {
        setWage(`$${num.toFixed(2)}`);
        return;
      }
    }
    // If not valid, keep as is
    setWage(wage);
  };

  return (
    <div className="create-employee-page">
      <h1 className="form-header">Invite Employee</h1>
      <form onSubmit={handleSubmit} className="employee-form space-y-4">
        <div className="input-group">
          <label htmlFor="firstName" className="input-label">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            ref={firstNameRef}
            className="input"
            placeholder="Enter first name"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="lastName" className="input-label">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            ref={lastNameRef}
            className="input"
            placeholder="Enter last name"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="email" className="input-label">
            Email
          </label>
          <input
            type="email"
            id="email"
            ref={emailRef}
            className="input"
            placeholder="Enter email"
            required
          />
        </div>

        <div className="input-group">
          <label htmlFor="wage" className="input-label">
            Wage
          </label>
          <input
            type="text"
            id="wage"
            className="input"
            placeholder="Enter wage (e.g., $15.50)"
            required
            value={wage}
            onChange={handleWageChange}
            onBlur={handleWageBlur}
          />
        </div>

        <button type="submit" className="button w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending invite..." : "Send Invite"}
        </button>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      </form>
    </div>
  );
}
