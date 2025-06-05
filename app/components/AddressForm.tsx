import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import { Coordinates } from "@/app/types";

interface AddressFormProps {
  value: string;
  onChange: (address: string, coordinates?: Coordinates) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
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

export interface AddressFormRef {
  validate: () => boolean;
}

const ALBERTA_CITIES = [
  'Calgary',
  'Edmonton',
  'Red Deer',
  'Lethbridge',
  'St. Albert',
  'Medicine Hat',
  'Grande Prairie',
  'Airdrie',
  'Spruce Grove',
  'Leduc',
  'Fort McMurray',
  'Cochrane',
  'Okotoks',
  'Canmore',
  'Banff'
];

const DIRECTION_OPTIONS = ["NW", "NE", "SW", "SE"];

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

const AddressForm = forwardRef<AddressFormRef, AddressFormProps>(({
  value,
  onChange,
  placeholder = "Enter address",
  required = false,
  className = "",
}, ref) => {
  const [formData, setFormData] = useState<AddressFormData>({
    streetNumber: '',
    streetName: '',
    direction: 'NW',
    city: 'Calgary',
    postalCode: '',
  });

  const [validation, setValidation] = useState<AddressValidation>({
    streetNumber: true,
    streetName: true,
    postalCode: true,
    direction: true,
  });

  const [errorMessages, setErrorMessages] = useState<AddressErrorMessages>({
    streetNumber: '',
    streetName: '',
    postalCode: '',
    direction: '',
  });

  const [showErrors, setShowErrors] = useState(false);

  const [checkStatus, setCheckStatus] = useState<null | 'success' | 'error'>(null);
  const [checkMessage, setCheckMessage] = useState<string>("");
  const [isChecking, setIsChecking] = useState(false);
  const [lastCoords, setLastCoords] = useState<Coordinates | undefined>();

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
        direction: validateDirection(formData.direction),
      };

      const newErrorMessages = {
        streetNumber: newValidation.streetNumber ? "" : "Please enter a valid street number (e.g., 123 or 123A)",
        streetName: newValidation.streetName ? "" : "Please enter a valid street name",
        postalCode: newValidation.postalCode ? "" : "Please enter a valid postal code (e.g., T2N 1N4)",
        direction: newValidation.direction ? "" : "Please select a direction",
      };

      setValidation(newValidation);
      setErrorMessages(newErrorMessages);
      setShowErrors(true);

      // Find first error and scroll to it
      if (!newValidation.streetNumber) {
        streetNumberRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        streetNumberRef.current?.focus();
      } else if (!newValidation.streetName) {
        streetNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        streetNameRef.current?.focus();
      } else if (!newValidation.postalCode) {
        postalCodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        postalCodeRef.current?.focus();
      } else if (!newValidation.direction) {
        // Assuming the direction input is the last in the grid
        // This is a simplification, as the direction input is not the last in the grid
        // You might want to adjust this logic based on your actual layout
        postalCodeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        postalCodeRef.current?.focus();
      }

      return Object.values(newValidation).every(Boolean);
    }
  }));

  // Format postal code as user types
  const formatPostalCode = (input: string): string => {
    // Remove all non-alphanumeric characters
    const cleaned = input.replace(/[^A-Za-z0-9]/g, "");
    
    // Convert to uppercase
    const upper = cleaned.toUpperCase();
    
    // Format as A1A 1A1
    if (upper.length > 3) {
      return `${upper.slice(0, 3)} ${upper.slice(3, 6)}`;
    }
    return upper;
  };

  // Validate postal code format
  const validatePostalCode = (code: string): boolean => {
    // Remove spaces for validation
    const cleanCode = code.replace(/\s/g, "");
    // Canadian postal code format: A1A1A1
    const postalCodeRegex = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;
    return postalCodeRegex.test(cleanCode);
  };

  // Validate street number
  const validateStreetNumber = (number: string): boolean => {
    // Allow numbers and common street number formats
    return /^[0-9]+[A-Za-z]?$/.test(number);
  };

  // Validate street name
  const validateStreetName = (name: string): boolean => {
    // Allow letters, numbers, spaces, and common street name characters
    return /^[A-Za-z0-9\s\-\.]+$/.test(name) && name.trim().length > 0;
  };

  // Validate direction
  const validateDirection = (dir: string): boolean => DIRECTION_OPTIONS.includes(dir);

  // Update parent component with full address
  const updateParentAddress = (newData: typeof formData) => {
    const fullAddress = `${newData.streetNumber} ${newData.streetName} ${newData.direction}, ${newData.city}, ${newData.postalCode}`;
    onChange(fullAddress);
  };

  // Handle individual field changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let newValue = value;
    let isValid = true;
    let errorMessage = "";

    if (name === "postalCode") {
      newValue = formatPostalCode(value);
      isValid = validatePostalCode(newValue);
      errorMessage = isValid ? "" : "Please enter a valid postal code (e.g., T2N 1N4)";
    } else if (name === "streetNumber") {
      isValid = validateStreetNumber(value);
      errorMessage = isValid ? "" : "Please enter a valid street number (e.g., 123 or 123A)";
    } else if (name === "streetName") {
      isValid = validateStreetName(value);
      errorMessage = isValid ? "" : "Please enter a valid street name";
    } else if (name === "direction") {
      isValid = validateDirection(value);
      errorMessage = isValid ? "" : "Please select a direction";
    }

    const newFormData = {
      ...formData,
      [name]: newValue,
    };

    setFormData(newFormData);
    
    // Only update parent if we have both street number and name
    if (newFormData.streetNumber && newFormData.streetName && newFormData.direction) {
      updateParentAddress(newFormData);
    }

    setValidation((prev) => ({
      ...prev,
      [name]: isValid,
    }));

    setErrorMessages((prev) => ({
      ...prev,
      [name]: errorMessage,
    }));
  };

  // Parse initial value if provided
  useEffect(() => {
    if (value) {
      try {
        const parts = value.split(',').map(part => part.trim());
        if (parts.length >= 2) {
          const streetParts = parts[0].split(' ');
          const streetNumber = streetParts[0] || '';
          // Assume direction is always the last part of streetParts
          const direction = DIRECTION_OPTIONS.includes(streetParts[streetParts.length - 1]) ? streetParts[streetParts.length - 1] : 'NW';
          const streetName = streetParts.slice(1, direction === 'NW' || direction === 'NE' || direction === 'SW' || direction === 'SE' ? -1 : undefined).join(' ') || '';
          
          const newData = {
            streetNumber,
            streetName,
            direction,
            city: parts[1] || 'Calgary',
            postalCode: parts[2] || '',
          };
          
          setFormData(newData);
        }
      } catch (error) {
        console.error('Error parsing address:', error);
      }
    }
  }, [value]);

  // Geocode address using Nominatim
  const geocodeAddress = async () => {
    setIsChecking(true);
    setCheckStatus(null);
    setCheckMessage("");
    const fullAddress = `${formData.streetNumber} ${expandAbbreviations(formData.streetName)} ${formData.direction}, ${formData.city}, ${formData.postalCode}`;
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}`;
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
        }
      });
      const data = await response.json();
      if (data && data.length > 0) {
        const coords = {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
        };
        if (!coords || coords.latitude === undefined || coords.longitude === undefined) {
          setCheckStatus('error');
          setCheckMessage('Please check address.');
          setLastCoords(undefined);
          onChange(fullAddress, undefined);
        } else {
          setCheckStatus('success');
          setCheckMessage('Address found and validated!');
          setLastCoords(coords);
          onChange(fullAddress, coords);
        }
      } else {
        setCheckStatus('error');
        setCheckMessage('Address not found. Please check your input.');
        setLastCoords(undefined);
        onChange(fullAddress, undefined);
      }
    } catch (error) {
      setCheckStatus('error');
      setCheckMessage('Please check address.');
      setLastCoords(undefined);
      onChange(fullAddress, undefined);
    } finally {
      setIsChecking(false);
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
            onChange={handleChange}
            onBlur={() => setShowErrors(true)}
            placeholder="Street Number"
            required={required}
            className={`w-full px-3 py-2 border ${
              showErrors && !validation.streetNumber ? "border-red-500" : "border-gray-300"
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          />
          {showErrors && !validation.streetNumber && (
            <p className="text-red-500 text-sm mt-1">{errorMessages.streetNumber}</p>
          )}
        </div>
        <div>
          <input
            ref={streetNameRef}
            type="text"
            name="streetName"
            value={formData.streetName}
            onChange={handleChange}
            onBlur={() => setShowErrors(true)}
            placeholder="Street Name"
            required={required}
            className={`w-full px-3 py-2 border ${
              showErrors && !validation.streetName ? "border-red-500" : "border-gray-300"
            } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          />
          {showErrors && !validation.streetName && (
            <p className="text-red-500 text-sm mt-1">{errorMessages.streetName}</p>
          )}
        </div>
        <div>
          <select
            name="direction"
            value={formData.direction}
            onChange={handleChange}
            onBlur={() => setShowErrors(true)}
            required={required}
            className={`w-full px-3 py-2 border ${showErrors && !validation.direction ? "border-red-500" : "border-gray-300"} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          >
            {DIRECTION_OPTIONS.map((dir) => (
              <option key={dir} value={dir}>{dir}</option>
            ))}
          </select>
          {showErrors && !validation.direction && (
            <p className="text-red-500 text-sm mt-1">{errorMessages.direction}</p>
          )}
        </div>
      </div>

      <input
        type="text"
        name="city"
        value={formData.city}
        readOnly
        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100"
      />

      <div>
        <input
          ref={postalCodeRef}
          type="text"
          name="postalCode"
          value={formData.postalCode}
          onChange={handleChange}
          onBlur={() => setShowErrors(true)}
          placeholder="Postal Code (e.g., T2N 1N4)"
          required={required}
          maxLength={7}
          className={`w-full px-3 py-2 border ${
            showErrors && !validation.postalCode ? "border-red-500" : "border-gray-300"
          } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        />
        {showErrors && !validation.postalCode && (
          <p className="text-red-500 text-sm mt-1">{errorMessages.postalCode}</p>
        )}
      </div>
      <button
        type="button"
        className="button mt-2"
        onClick={geocodeAddress}
        disabled={isChecking}
      >
        {isChecking ? (
          <span className="inline-block h-5 w-5 mr-2 align-middle border-2 border-white border-t-transparent rounded-full" style={{
            animation: 'spin 1s linear infinite'
          }}></span>
        ) : 'Check Address'}
      </button>
      {checkStatus === 'success' && (
        <p className="text-green-600 text-sm mt-1">{checkMessage}</p>
      )}
      {checkStatus === 'error' && (
        <p className="text-red-500 text-sm mt-1">{checkMessage}</p>
      )}
      <style jsx>{`
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      `}</style>
    </div>
  );
});

AddressForm.displayName = 'AddressForm';

export default AddressForm; 