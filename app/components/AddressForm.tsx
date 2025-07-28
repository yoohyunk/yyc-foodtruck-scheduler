import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { cleanPostalCode } from "@/lib/utils";

interface AddressFormProps {
  value: string;
  onChange: (
    address: string,
    coordinates?: { latitude: number; longitude: number }
  ) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  onCheckAddress?: () => boolean;
  onAddressError?: (errors: ValidationError[]) => void;
}

interface AddressFormData {
  streetNumber: string;
  streetName: string;
  direction: string;
  city: string;
  postalCode: string;
}

interface AutocompleteSuggestion {
  display: string;
  streetNumber: string;
  streetName: string;
  city: string;
  postalCode: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  fullAddress: string;
}

interface AddressValidation {
  streetNumber: boolean;
  streetName: boolean;
  postalCode: boolean;
  direction: boolean;
}

interface AddressErrorMessages {
  streetNumber: string;
  streetName: string;
  postalCode: string;
  direction: string;
}

interface ValidationError {
  field: string;
  message: string;
  element: HTMLInputElement | null;
}

export interface AddressFormRef {
  validate: () => boolean;
}

const ALBERTA_CITIES = [
  "Calgary",
  "Airdrie",
  "Banff",
  "Canmore",
  "Cochrane",
  "Edmonton",
  "Fort McMurray",
  "Grande Prairie",
  "Leduc",
  "Lethbridge",
  "Medicine Hat",
  "Okotoks",
  "Red Deer",
  "Spruce Grove",
  "St. Albert",
];

const DIRECTION_OPTIONS = ["None", "NW", "NE", "SW", "SE"];

// Add abbreviation expansion function at the top
function expandAbbreviations(streetName: string): string {
  return streetName
    .replace(/\bAve\b/gi, "Avenue")
    .replace(/\bSt\b/gi, "Street")
    .replace(/\bRd\b/gi, "Road")
    .replace(/\bDr\b/gi, "Drive")
    .replace(/\bBlvd\b/gi, "Boulevard")
    .replace(/\bCres\b/gi, "Crescent")
    .replace(/\bPl\b/gi, "Place")
    .replace(/\bCt\b/gi, "Court")
    .replace(/\bLn\b/gi, "Lane")
    .replace(/\bTer\b/gi, "Terrace");
}

// Add getFullAddress function before it is used
const getFullAddress = (data: {
  streetNumber: string;
  streetName: string;
  direction: string;
  city: string;
  postalCode: string;
}) => {
  // Clean up any double spaces and normalize spacing
  const cleanStreetName = data.streetName.replace(/\s+/g, " ").trim();
  const cleanDirection =
    data.direction && data.direction !== "None" ? data.direction.trim() : "";

  const baseAddress = `${data.streetNumber} ${cleanStreetName}${cleanDirection ? " " + cleanDirection : ""}, ${data.city}`;

  // Add postal code if provided
  const withPostal = data.postalCode
    ? `${baseAddress}, ${data.postalCode}`
    : baseAddress;

  return withPostal;
};

const AddressForm = forwardRef<AddressFormRef, AddressFormProps>(
  (
    {
      value,
      onChange,
      required = false,
      className = "",
      onCheckAddress,
      onAddressError,
    },
    ref
  ) => {
    const [formData, setFormData] = useState<AddressFormData>({
      streetNumber: "",
      streetName: "",
      direction: "None",
      city: "Calgary",
      postalCode: "",
    });

    const [validation, setValidation] = useState<AddressValidation>({
      streetNumber: false,
      streetName: false,
      postalCode: true,
      direction: true,
    });

    const [errorMessages, setErrorMessages] = useState<AddressErrorMessages>({
      streetNumber: "",
      streetName: "",
      postalCode: "",
      direction: "",
    });

    const [showErrors, setShowErrors] = useState(false);

    const [checkStatus, setCheckStatus] = useState<null | "success" | "error">(
      null
    );
    const [checkMessage, setCheckMessage] = useState<string>("");
    const [isChecking, setIsChecking] = useState(false);

    // Autocomplete state
    const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>(
      []
    );
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

    const streetNumberRef = useRef<HTMLInputElement>(null);
    const streetNameRef = useRef<HTMLInputElement>(null);
    const postalCodeRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<HTMLDivElement>(null);

    // Expose validate method to parent
    useImperativeHandle(ref, () => ({
      validate: () => {
        const newValidation = {
          streetNumber: validateStreetNumber(formData.streetNumber),
          streetName: validateStreetName(formData.streetName),
          postalCode: validatePostalCode(formData.postalCode),
          direction: true, // Direction is always valid since it's a select with predefined options
        };

        const newErrorMessages = {
          streetNumber: newValidation.streetNumber
            ? ""
            : "Please enter a valid street number (e.g., 123 or 123A)",
          streetName: newValidation.streetName
            ? ""
            : "Please enter a valid street name",
          postalCode: newValidation.postalCode
            ? ""
            : "Please enter a valid postal code (e.g., T2N 1N4)",
          direction: "", // Direction is always valid
        };

        setValidation(newValidation);
        setErrorMessages(newErrorMessages);
        setShowErrors(true);

        // Only clear success/error status if validation fails
        if (!Object.values(newValidation).every(Boolean)) {
          setCheckStatus(null);
          setCheckMessage("");
        }

        // Find first error and scroll to it
        if (!newValidation.streetNumber) {
          streetNumberRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          streetNumberRef.current?.focus();
        } else if (!newValidation.streetName) {
          streetNameRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          streetNameRef.current?.focus();
        } else if (!newValidation.postalCode) {
          postalCodeRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          postalCodeRef.current?.focus();
        }

        return Object.values(newValidation).every(Boolean);
      },
    }));

    // Validate postal code format
    const validatePostalCode = (code: string): boolean => {
      if (!code || code.trim() === "") return true; // Optional: empty is valid
      // Remove spaces for validation
      const cleanCode = code.replace(/\s/g, "");
      // Canadian postal code format: A1A1A1
      const postalCodeRegex = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;
      return postalCodeRegex.test(cleanCode);
    };

    // Validate street number
    const validateStreetNumber = (number: string): boolean => {
      // Just ensure it starts with a number
      return /^\d/.test(number);
    };

    // Validate street name
    const validateStreetName = (name: string): boolean => {
      // Just ensure it's not empty
      return name.trim().length > 0;
    };

    // Handler for street number change with autocomplete
    const handleStreetNumberChange = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const value = e.target.value; // allow spaces as typed
      const newFormData = { ...formData, streetNumber: value };
      setFormData(newFormData);

      // Clear previous timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Trigger autocomplete if we have enough characters
      if (value.trim().length >= 3) {
        // Debounce the API call by 300ms
        debounceTimerRef.current = setTimeout(() => {
          fetchSuggestions(value);
        }, 300);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }

      // Address will only be updated when Check Address button is clicked
    };

    // Handler for street name change (allow spaces, no stripping/collapsing)
    const handleStreetNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value; // allow spaces as typed
      const newFormData = { ...formData, streetName: value };
      setFormData(newFormData);
      // Address will only be updated when Check Address button is clicked
    };

    // Handler for street name blur (just validation, no abbreviation expansion)
    const handleStreetNameBlur = () => {
      setShowErrors(true);
      const value = formData.streetName;
      const isValid = value.trim().length > 0;

      setValidation((prev) => ({
        ...prev,
        streetName: isValid,
      }));

      setErrorMessages((prev) => ({
        ...prev,
        streetName: isValid ? "" : "Please enter a street name",
      }));
    };

    // Handler for postal code formatting (allow spaces, only auto-insert after 3 chars)
    const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, ""); // allow spaces

      // Clean postal code using utility function
      value = cleanPostalCode(value);

      // Only auto-insert a space after 3 characters if not already present
      if (value.length === 4 && value[3] !== " ") {
        value = value.slice(0, 3) + " " + value.slice(3);
      }
      if (value.length > 6 && value[3] !== " ") {
        value = value.slice(0, 3) + " " + value.slice(3);
      }
      const newFormData = { ...formData, postalCode: value };
      setFormData(newFormData);
      // Address will only be updated when Check Address button is clicked
    };

    // Parse initial value if provided
    useEffect(() => {
      if (value) {
        try {
          const parts = value.split(",").map((part) => part.trim());
          if (parts.length >= 2) {
            const streetParts = parts[0].split(" ");
            const streetNumber = streetParts[0] || "";
            // Assume direction is always the last part of streetParts
            const direction = DIRECTION_OPTIONS.includes(
              streetParts[streetParts.length - 1]
            )
              ? streetParts[streetParts.length - 1]
              : "None";
            const streetName =
              streetParts
                .slice(1, direction === "None" ? undefined : -1)
                .join(" ") || "";

            const newData = {
              streetNumber,
              streetName,
              direction,
              city: parts[1] || "Calgary",
              postalCode: parts[2] || "",
            };

            setFormData(newData);
          }
        } catch (error) {
          console.error("Error parsing address:", error);
        }
      }
    }, [value]);

    // Debounce timer ref
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Autocomplete functions with debouncing
    const fetchSuggestions = async (query: string) => {
      if (!query || query.trim().length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const response = await fetch(
          `/api/geocode/autocomplete?text=${encodeURIComponent(query)}&limit=5`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSuggestions(data.suggestions);
            setShowSuggestions(data.suggestions.length > 0);
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } else {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const handleSuggestionSelect = (suggestion: AutocompleteSuggestion) => {
      // Clean postal code using utility function
      const cleanPostalCodeValue = cleanPostalCode(suggestion.postalCode || "");

      setFormData({
        streetNumber: suggestion.streetNumber,
        streetName: suggestion.streetName,
        direction: "None", // Will need to be parsed from the suggestion
        city: suggestion.city,
        postalCode: cleanPostalCodeValue,
      });
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);

      // Update the parent component with the selected address
      onChange(suggestion.fullAddress, suggestion.coordinates);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!showSuggestions) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case "Enter":
          e.preventDefault();
          if (
            selectedSuggestionIndex >= 0 &&
            suggestions[selectedSuggestionIndex]
          ) {
            handleSuggestionSelect(suggestions[selectedSuggestionIndex]);
          }
          break;
        case "Escape":
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
          break;
      }
    };

    // Close suggestions when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          autocompleteRef.current &&
          !autocompleteRef.current.contains(event.target as Node)
        ) {
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, []);

    // Geocode address using Nominatim
    const geocodeAddress = async () => {
      // Validate required fields first
      const isValid =
        validateStreetNumber(formData.streetNumber) &&
        validateStreetName(formData.streetName);
      if (!isValid) {
        setShowErrors(true);
        setValidation((prev) => ({
          ...prev,
          streetNumber: validateStreetNumber(formData.streetNumber),
          streetName: validateStreetName(formData.streetName),
        }));
        setCheckStatus("error");
        setCheckMessage("Please enter a valid street number and street name.");
        // Clear any previous success status
        setCheckStatus("error");
        if (typeof onCheckAddress === "function") onCheckAddress();
        if (typeof onAddressError === "function") {
          const errors: ValidationError[] = [];
          if (!validateStreetNumber(formData.streetNumber)) {
            errors.push({
              field: "streetNumber",
              message: "Please enter a valid street number (e.g., 123 or 123A)",
              element: streetNumberRef.current,
            });
          }
          if (!validateStreetName(formData.streetName)) {
            errors.push({
              field: "streetName",
              message: "Please enter a valid street name",
              element: streetNameRef.current,
            });
          }
          onAddressError(errors);
        }
        return;
      }
      setIsChecking(true);
      setCheckStatus(null);
      setCheckMessage("");
      // Clear any previous success/error status
      setCheckStatus(null);
      // Expand abbreviations ONLY when checking address
      const expandedStreetName = expandAbbreviations(formData.streetName);
      const geocodeData = { ...formData, streetName: expandedStreetName };
      const fullAddress = getFullAddress(geocodeData);
      setFormData(geocodeData); // update the form with expanded name for consistency
      try {
        const apiUrl = `/api/geocode?address=${encodeURIComponent(fullAddress)}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000); // 12 second timeout

        const response = await fetch(apiUrl, {
          method: "GET",
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.coordinates) {
          const coords = {
            latitude: data.coordinates.latitude,
            longitude: data.coordinates.longitude,
          };
          setCheckStatus("success");

          // Determine the appropriate message based on whether it's a fallback or actual coordinates
          let message;
          if (data.fallback) {
            if (data.fallbackType === "city_center") {
              // Extract city name from the address for the fallback message
              const cityMatch = fullAddress.match(/, ([^,]+)(?:,|$)/);
              const city = cityMatch ? cityMatch[1].trim() : "the city";
              message = `Address not found using fallback coordinates for ${city}`;
            } else {
              message =
                "Address not found using fallback coordinates for the city center";
            }
          } else {
            message = "Address found and validated!";
          }

          setCheckMessage(message);
          onChange(fullAddress, coords); // Pass up to parent
          // console.log("Geocoding successful:", { address: fullAddress, coords, fallback: data.fallback });
        } else {
          setCheckStatus("error");
          setCheckMessage(
            data.error || "Address not found. Please check your input."
          );
          if (typeof onAddressError === "function") {
            onAddressError([
              {
                field: "address",
                message:
                  data.error || "Address not found. Please check your input.",
                element: streetNameRef.current,
              },
            ]);
          }
        }
      } catch (error) {
        console.error("Geocoding error:", error);
        setCheckStatus("error");

        let errorMessage = "Error validating address. Please try again.";

        if (error instanceof Error) {
          if (
            error.name === "AbortError" ||
            error.message.includes("timeout")
          ) {
            errorMessage =
              "Request timed out. Please check your internet connection and try again.";
          } else if (error.message.includes("fetch failed")) {
            errorMessage =
              "Network error. Please check your internet connection and try again.";
          } else {
            errorMessage = error.message;
          }
        }

        setCheckMessage(errorMessage);
        if (typeof onAddressError === "function") {
          onAddressError([
            {
              field: "address",
              message: errorMessage,
              element: streetNameRef.current,
            },
          ]);
        }
      } finally {
        setIsChecking(false);
        if (typeof onCheckAddress === "function") onCheckAddress();
      }
    };

    return (
      <div className="address-form space-y-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="relative" ref={autocompleteRef}>
            <input
              ref={streetNumberRef}
              type="text"
              name="streetNumber"
              value={formData.streetNumber}
              onChange={handleStreetNumberChange}
              onKeyDown={handleKeyDown}
              onBlur={() => setShowErrors(true)}
              placeholder="Street Number *"
              required={required}
              inputMode="numeric"
              autoComplete="off"
              className={`w-full px-3 py-2 border ${
                showErrors && !validation.streetNumber
                  ? "border-red-500"
                  : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            />
            {isLoadingSuggestions && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
            {formData.streetNumber.trim().length >= 3 &&
              !isLoadingSuggestions &&
              !showSuggestions && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs">
                  No results
                </div>
              )}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                      index === selectedSuggestionIndex ? "bg-blue-50" : ""
                    }`}
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <div className="text-sm text-gray-900">
                      {suggestion.display}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showErrors && !validation.streetNumber && (
              <p className="text-red-500 text-sm mt-1">
                {errorMessages.streetNumber}
              </p>
            )}
          </div>
          <div>
            <input
              ref={streetNameRef}
              type="text"
              name="streetName"
              value={formData.streetName}
              onChange={handleStreetNameChange}
              onBlur={handleStreetNameBlur}
              placeholder="Street Name *"
              required={required}
              autoComplete="off"
              className={`w-full px-3 py-2 border ${
                showErrors && !validation.streetName
                  ? "border-red-500"
                  : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            />
            {showErrors && !validation.streetName && (
              <p className="text-red-500 text-sm mt-1">
                {errorMessages.streetName}
              </p>
            )}
          </div>
          <div>
            <select
              name="direction"
              value={formData.direction}
              onChange={(e) => {
                const value = e.target.value;
                const newFormData = { ...formData, direction: value };
                setFormData(newFormData);
                // Address will only be updated when Check Address button is clicked
              }}
              onBlur={() => setShowErrors(true)}
              required={required}
              className={`w-full px-3 py-2 border ${showErrors && !validation.direction ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            >
              {DIRECTION_OPTIONS.map((dir) => (
                <option key={dir} value={dir}>
                  {dir === "None" ? "None" : dir}
                </option>
              ))}
            </select>
          </div>
        </div>

        <select
          name="city"
          value={formData.city}
          onChange={(e) => {
            const value = e.target.value;
            const newFormData = { ...formData, city: value };
            setFormData(newFormData);
            // Address will only be updated when Check Address button is clicked
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {ALBERTA_CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <div>
          <input
            ref={postalCodeRef}
            type="text"
            name="postalCode"
            value={formData.postalCode}
            onChange={handlePostalCodeChange}
            onBlur={() => setShowErrors(true)}
            placeholder="Postal Code (e.g., T3G 4Y9)"
            required={false}
            maxLength={7}
            autoComplete="postal-code"
            className={`w-full px-3 py-2 border ${
              showErrors && !validation.postalCode
                ? "border-red-500"
                : "border-gray-300"
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          />
          {showErrors && !validation.postalCode && (
            <p className="text-red-500 text-sm mt-1">
              {errorMessages.postalCode}
            </p>
          )}
        </div>
        <button
          type="button"
          className="button mt-2 w-full md:w-auto min-h-[44px] touch-manipulation"
          onClick={geocodeAddress}
          disabled={isChecking}
        >
          {isChecking ? (
            <span
              className="inline-block h-5 w-5 mr-2 align-middle border-2 border-white border-t-transparent rounded-full"
              style={{
                animation: "spin 1s linear infinite",
              }}
            ></span>
          ) : (
            "Check Address"
          )}
        </button>
        {checkStatus === "success" && (
          <p className="text-green-600 text-sm mt-1">{checkMessage}</p>
        )}
        {checkStatus === "error" && (
          <p className="text-red-500 text-sm mt-1">{checkMessage}</p>
        )}
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }
);

AddressForm.displayName = "AddressForm";

export default AddressForm;
