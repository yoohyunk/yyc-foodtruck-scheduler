import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";

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
}) =>
  `${data.streetNumber} ${data.streetName}${data.direction && data.direction !== "None" ? " " + data.direction : ""}, ${data.city}, ${data.postalCode}`;

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
      streetNumber: true,
      streetName: true,
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

    const streetNumberRef = useRef<HTMLInputElement>(null);
    const streetNameRef = useRef<HTMLInputElement>(null);
    const postalCodeRef = useRef<HTMLInputElement>(null);

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

    // Handler for street number change (allow spaces, no stripping/collapsing)
    const handleStreetNumberChange = (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      const value = e.target.value; // allow spaces as typed
      setFormData((prev) => ({ ...prev, streetNumber: value }));
    };

    // Handler for street name change (allow spaces, no stripping/collapsing)
    const handleStreetNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value; // allow spaces as typed
      setFormData((prev) => ({ ...prev, streetName: value }));
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
      // Only auto-insert a space after 3 characters if not already present
      if (value.length === 4 && value[3] !== " ") {
        value = value.slice(0, 3) + " " + value.slice(3);
      }
      if (value.length > 6 && value[3] !== " ") {
        value = value.slice(0, 3) + " " + value.slice(3);
      }
      setFormData((prev) => ({ ...prev, postalCode: value }));
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
      // Expand abbreviations ONLY when checking address
      const expandedStreetName = expandAbbreviations(formData.streetName);
      const geocodeData = { ...formData, streetName: expandedStreetName };
      const fullAddress = getFullAddress(geocodeData);
      setFormData(geocodeData); // update the form with expanded name for consistency
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`;
        const response = await fetch(url, {
          headers: {
            "Accept-Language": "en",
          },
        });
        const data = await response.json();
        if (data && data.length > 0) {
          const coords = {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
          };
          setCheckStatus("success");
          setCheckMessage("Address found and validated!");
          onChange(fullAddress, coords); // Pass up to parent
        } else {
          setCheckStatus("error");
          setCheckMessage("Address not found. Please check your input.");
          if (typeof onAddressError === "function") {
            onAddressError([
              {
                field: "address",
                message: "Address not found. Please check your input.",
                element: streetNameRef.current,
              },
            ]);
          }
        }
      } catch {
        setCheckStatus("error");
        setCheckMessage("Error validating address. Please try again.");
        if (typeof onAddressError === "function") {
          onAddressError([
            {
              field: "address",
              message: "Error validating address. Please try again.",
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
        <div className="grid grid-cols-3 gap-2">
          <div>
            <input
              ref={streetNumberRef}
              type="text"
              name="streetNumber"
              value={formData.streetNumber}
              onChange={handleStreetNumberChange}
              onBlur={() => setShowErrors(true)}
              placeholder="Street Number *"
              required={required}
              className={`w-full px-3 py-2 border ${
                showErrors && !validation.streetNumber
                  ? "border-red-500"
                  : "border-gray-300"
              } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
            />
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
                setFormData((prev) => ({ ...prev, direction: value }));
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
            setFormData((prev) => ({ ...prev, city: value }));
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
            placeholder="Postal Code (Optional)"
            required={false}
            maxLength={7}
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
          className="button mt-2"
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
