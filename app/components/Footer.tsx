"use client";

import React, { useState } from "react";
import { TutorialButton } from "../tutorial";
import Link from "next/link";
import { SUPPORTED_LANGUAGES } from "../translationAi/translator";

// Recursively translate all text nodes inside an element
async function translateElementText(element: HTMLElement, to: string) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);
  const textNodes: Text[] = [];
  let node: Text | null = walker.nextNode() as Text | null;
  while (node) {
    if (node.textContent && node.textContent.trim()) {
      textNodes.push(node);
    }
    node = walker.nextNode() as Text | null;
  }

  for (const textNode of textNodes) {
    const original = textNode.textContent || "";
    // Call your API for each text node (could be optimized for batching)
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: original, to }),
    });
    const data = await res.json();
    if (res.ok && data.text) {
      textNode.textContent = data.text;
    }
  }
}

export default function Footer() {
  const [selectedLang, setSelectedLang] = useState("en");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTranslate = async () => {
    setLoading(true);
    setError(null);
    try {
      const main = document.querySelector(".main-content");
      if (!main) {
        setError("No content to translate.");
        setLoading(false);
        return;
      }
      await translateElementText(main as HTMLElement, selectedLang);
    } catch (err: unknown) {
      let message = "Translation failed";
      if (
        typeof err === "object" &&
        err &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
      ) {
        message = (err as { message: string }).message;
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="footer bg-gray-100 py-4 px-6 flex flex-col md:flex-row items-center justify-between border-t border-gray-200">
      <div className="flex flex-row flex-wrap justify-center items-center gap-6">
        <Link
          href="/"
          className="hover:text-primary-light transition-colors font-bold flex items-center"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Dashboard
        </Link>
        <Link
          href="/contact"
          className="hover:text-primary-light transition-colors"
        >
          Contact
        </Link>
        <TutorialButton />
        <span className="text-sm text-primary-light ml-4">
          © {new Date().getFullYear()} YYC Food Trucks
        </span>
      </div>
      {/* Translation UI - clean, subtle, professional */}
      <div className="flex items-center gap-2 mt-4 md:mt-0 bg-white border border-gray-200 rounded-md px-3 py-1 shadow-sm">
        <label
          htmlFor="language-select"
          className="text-sm text-gray-700 font-medium mr-1"
        >
          Language:
        </label>
        <select
          id="language-select"
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-light text-sm bg-white transition-colors duration-150"
          disabled={loading}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleTranslate}
          className="ml-2 px-3 py-1 border border-primary-dark text-primary-dark font-semibold rounded hover:bg-primary-light hover:text-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light transition-colors duration-150 text-sm disabled:opacity-60 disabled:cursor-not-allowed bg-white shadow-sm"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center">
              <span className="inline-block h-4 w-4 mr-2 border-2 border-primary-dark border-t-transparent rounded-full animate-spin"></span>
              Translating...
            </span>
          ) : (
            <span>Translate</span>
          )}
        </button>
        {error && (
          <span className="ml-2 text-red-500 text-xs font-medium">{error}</span>
        )}
      </div>
    </footer>
  );
}
