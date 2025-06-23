import React, { useState, useEffect } from "react";

interface ShopLocationDropdownProps {
  value: string;
  onChange: (
    address: string,
    coordinates?: { latitude: number; longitude: number }
  ) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

interface ShopLocation {
  name: string;
  address: string;
  coordinates: { latitude: number; longitude: number };
}

const SHOP_LOCATIONS: ShopLocation[] = [
  {
    name: "North Shop",
    address: "132-2730 3 Ave NE, Calgary, T2A 2L5",
    coordinates: { latitude: 51.0845, longitude: -114.0721 }, // Approximate coordinates for NE Calgary
  },
  {
    name: "South Shop", 
    address: "8734-3919 Brandon Street SE, Calgary, T2G 4A7",
    coordinates: { latitude: 50.9781, longitude: -114.0721 }, // Approximate coordinates for SE Calgary
  },
];

export default function ShopLocationDropdown({
  value,
  onChange,
  placeholder = "Select shop location",
  required = false,
  className = "",
}: ShopLocationDropdownProps) {
  const [selectedShop, setSelectedShop] = useState<string>("");

  // Parse the current value to determine which shop is selected
  useEffect(() => {
    if (value) {
      const shop = SHOP_LOCATIONS.find(location => location.address === value);
      setSelectedShop(shop?.name || "");
    } else {
      setSelectedShop("");
    }
  }, [value]);

  const handleShopChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const shopName = e.target.value;
    setSelectedShop(shopName);
    
    if (shopName) {
      const shop = SHOP_LOCATIONS.find(location => location.name === shopName);
      if (shop) {
        onChange(shop.address, shop.coordinates);
      }
    } else {
      onChange("", undefined);
    }
  };

  return (
    <div className="shop-location-dropdown">
      <select
        value={selectedShop}
        onChange={handleShopChange}
        required={required}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      >
        <option value="">{placeholder}</option>
        {SHOP_LOCATIONS.map((shop) => (
          <option key={shop.name} value={shop.name}>
            {shop.name}
          </option>
        ))}
      </select>
      
      {selectedShop && (
        <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
          <strong>Address:</strong> {SHOP_LOCATIONS.find(s => s.name === selectedShop)?.address}
        </div>
      )}
    </div>
  );
} 