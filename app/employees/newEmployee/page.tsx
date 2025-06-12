"use client";

import React, { useState, FormEvent, ReactElement, useRef } from "react";
import { useRouter } from "next/navigation";

export default function InviteEmployee(): ReactElement {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError("");

    const firstName = firstNameRef.current?.value.trim() || "";
    const lastName = lastNameRef.current?.value.trim() || "";
    const email = emailRef.current?.value.trim() || "";

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

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Invite failed");

      alert(`Invite sent to ${email}!`);
      router.push("/employees");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
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

        <button type="submit" className="button w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending invite..." : "Send Invite"}
        </button>

        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      </form>
    </div>
  );
}
