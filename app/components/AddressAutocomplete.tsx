import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Coordinates } from '../types';
import debounce from 'lodash/debounce';

// Security constants
const MAX_REQUESTS_PER_MINUTE = 30;
const MIN_SEARCH_LENGTH = 3;
const MAX_SEARCH_LENGTH = 100;
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds

interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, coordinates?: Coordinates) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
}

// Rate limiting class
class RateLimiter {
  private timestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.timestamps = this.timestamps.filter(time => now - time < this.windowMs);
    if (this.timestamps.length >= this.maxRequests) {
      return false;
    }
    this.timestamps.push(now);
    return true;
  }
}

// Input sanitization function
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[^\w\s,.-]/g, '') // Only allow letters, numbers, spaces, and basic punctuation
    .slice(0, MAX_SEARCH_LENGTH); // Limit length
};

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Enter address',
  className = '',
  required = false,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const rateLimiterRef = useRef(new RateLimiter(MAX_REQUESTS_PER_MINUTE, RATE_LIMIT_WINDOW));

  // Update input value when prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchAddress = useCallback(
    debounce(async (query: string) => {
      const sanitizedQuery = sanitizeInput(query);
      
      if (!sanitizedQuery || sanitizedQuery.length < MIN_SEARCH_LENGTH) {
        setSuggestions([]);
        setIsValid(false);
        setIsLoading(false);
        return;
      }

      // Check rate limit
      if (!rateLimiterRef.current.canMakeRequest()) {
        setError('Too many requests. Please wait a moment before trying again.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
          `q=${encodeURIComponent(sanitizedQuery)}&` +
          `format=json&` +
          `addressdetails=1&` +
          `limit=10&` +
          `countrycodes=ca&` +
          `state=Alberta&` +
          `city=Calgary&` +
          `viewbox=-114.3,51.2,-113.8,50.8&` +
          `bounded=1&` +
          `dedupe=1`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'YYCFoodTruckScheduler/1.0',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch suggestions: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Validate response data
        if (!Array.isArray(data)) {
          throw new Error('Invalid response format');
        }

        // Filter and validate results
        const calgaryResults = data
          .filter((result: NominatimResult) => 
            result.address?.city?.toLowerCase() === 'calgary' ||
            result.display_name?.toLowerCase().includes('calgary')
          )
          .filter((result: NominatimResult) => 
            result.lat && result.lon && 
            !isNaN(parseFloat(result.lat)) && 
            !isNaN(parseFloat(result.lon))
          );

        if (calgaryResults.length === 0) {
          setError('No Calgary addresses found. Please try a different address.');
          setSuggestions([]);
        } else {
          setSuggestions(calgaryResults);
          setShowSuggestions(true);
        }
        setIsValid(false);
      } catch (error) {
        console.error('Error fetching address suggestions:', error);
        // Safe error message that doesn't expose internal details
        setError('Unable to fetch address suggestions. Please try again.');
        setSuggestions([]);
        setIsValid(false);
      } finally {
        setIsLoading(false);
      }
    }, 500, { leading: false, trailing: true }),
    []
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = sanitizeInput(e.target.value);
    setInputValue(newValue);
    setError(null);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (newValue.length >= MIN_SEARCH_LENGTH) {
      searchTimeoutRef.current = setTimeout(() => {
        searchAddress(newValue);
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }

    if (isValid) {
      onChange(newValue);
    }
  };

  const formatAddress = (result: NominatimResult): string => {
    const { address } = result;
    const parts = [
      address.house_number,
      address.road,
      address.suburb,
      address.city,
      address.state,
      address.postcode,
      address.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  const handleSuggestionClick = (suggestion: NominatimResult) => {
    const coordinates: Coordinates = {
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
    };
    const formattedAddress = formatAddress(suggestion);
    setInputValue(formattedAddress);
    onChange(formattedAddress, coordinates);
    setSuggestions([]);
    setShowSuggestions(false);
    setIsValid(true);
    setError(null);
  };

  const handleBlur = () => {
    if (!isValid && required) {
      setInputValue('');
      onChange('', undefined);
      setError('Please select an address from the dropdown');
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          maxLength={MAX_SEARCH_LENGTH}
          className={`w-full px-3 py-2 border ${
            required && !isValid ? 'border-red-500' : 'border-gray-300'
          } rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              {formatAddress(suggestion)}
            </div>
          ))}
        </div>
      )}
      
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
      
      {required && !isValid && inputValue && !error && (
        <p className="text-red-500 text-sm mt-1">Please select an address from the dropdown</p>
      )}
    </div>
  );
} 