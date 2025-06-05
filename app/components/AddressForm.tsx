import React, { useState, useEffect } from 'react';
import { Coordinates } from '../types';

interface AddressFormProps {
  value: string;
  onChange: (address: string, coordinates?: Coordinates) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

interface AddressFormData {
  streetAddress: string;
  city: string;
  postalCode: string;
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

export default function AddressForm({
  value,
  onChange,
  placeholder = 'Enter address',
  className = '',
  required = false,
}: AddressFormProps) {
  const [formData, setFormData] = useState<AddressFormData>({
    streetAddress: '',
    city: 'Calgary',
    postalCode: '',
  });

  // Update form when value changes
  useEffect(() => {
    if (value) {
      const parts = value.split(',');
      if (parts.length >= 3) {
        setFormData({
          streetAddress: parts[0].trim(),
          city: parts[1].trim(),
          postalCode: parts[2].trim(),
        });
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Format and update the full address whenever any field changes
    const newFormData = {
      ...formData,
      [name]: value
    };
    const formattedAddress = `${newFormData.streetAddress}, ${newFormData.city}, ${newFormData.postalCode}`;
    onChange(formattedAddress);
  };

  return (
    <div className="space-y-2">
      <div>
        <input
          type="text"
          name="streetAddress"
          value={formData.streetAddress}
          onChange={handleChange}
          placeholder="Street Address"
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          required={required}
        />
      </div>

      <div>
        <select
          name="city"
          value={formData.city}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {ALBERTA_CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </div>

      <div>
        <input
          type="text"
          name="postalCode"
          value={formData.postalCode}
          onChange={handleChange}
          placeholder="Postal Code (e.g., T2N 1N4)"
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
          required={required}
        />
      </div>
    </div>
  );
} 