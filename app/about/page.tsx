"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Truck {
  id: number;
  name: string;
  type: string;
  capacity: number;
  status: string;
  driver: {
    id: number;
    name: string;
    email: string;
    phone: string;
  } | null;
  location: string;
}

interface PackingItem {
  id: string;
  name: string;
  category: string;
  checked: boolean;
}

const defaultPackingLists: Record<string, PackingItem[]> = {
  "Food Truck": [
    { id: "1", name: "Cooking utensils", category: "Kitchen", checked: false },
    { id: "2", name: "Food containers", category: "Storage", checked: false },
    { id: "3", name: "Napkins", category: "Service", checked: false },
    { id: "4", name: "Plates", category: "Service", checked: false },
    { id: "5", name: "Cooking oil", category: "Ingredients", checked: false },
    { id: "6", name: "Spices", category: "Ingredients", checked: false },
    { id: "7", name: "Cleaning supplies", category: "Maintenance", checked: false },
    { id: "8", name: "First aid kit", category: "Safety", checked: false },
  ],
  "Beverage Truck": [
    { id: "1", name: "Cups", category: "Service", checked: false },
    { id: "2", name: "Straws", category: "Service", checked: false },
    { id: "3", name: "Ice", category: "Ingredients", checked: false },
    { id: "4", name: "Syrups", category: "Ingredients", checked: false },
    { id: "5", name: "Beverage dispensers", category: "Equipment", checked: false },
    { id: "6", name: "Cleaning supplies", category: "Maintenance", checked: false },
    { id: "7", name: "First aid kit", category: "Safety", checked: false },
  ],
  "Dessert Truck": [
    { id: "1", name: "Dessert containers", category: "Storage", checked: false },
    { id: "2", name: "Spoons", category: "Service", checked: false },
    { id: "3", name: "Napkins", category: "Service", checked: false },
    { id: "4", name: "Toppings", category: "Ingredients", checked: false },
    { id: "5", name: "Freezer packs", category: "Storage", checked: false },
    { id: "6", name: "Cleaning supplies", category: "Maintenance", checked: false },
    { id: "7", name: "First aid kit", category: "Safety", checked: false },
  ],
  "Holiday Truck": [
    { id: "1", name: "Holiday decorations", category: "Display", checked: false },
    { id: "2", name: "Specialty containers", category: "Storage", checked: false },
    { id: "3", name: "Themed napkins", category: "Service", checked: false },
    { id: "4", name: "Holiday ingredients", category: "Ingredients", checked: false },
    { id: "5", name: "Cleaning supplies", category: "Maintenance", checked: false },
    { id: "6", name: "First aid kit", category: "Safety", checked: false },
  ],
};

export default function TruckManagementPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [packingLists, setPackingLists] = useState<Record<number, PackingItem[]>>({});
  const [editMode, setEditMode] = useState<Record<number, boolean>>({});

  useEffect(() => {
    // Load trucks data
    fetch("/trucks.json")
      .then((res) => res.json())
      .then((data) => {
        setTrucks(data);
        // Initialize packing lists for each truck
        const initialPackingLists: Record<number, PackingItem[]> = {};
        data.forEach((truck: Truck) => {
          const defaultList = defaultPackingLists[truck.type] || defaultPackingLists["Food Truck"];
          initialPackingLists[truck.id] = JSON.parse(JSON.stringify(defaultList));
        });
        setPackingLists(initialPackingLists);
      })
      .catch((error) => {
        console.error("Error loading trucks:", error);
      });
  }, []);

  const toggleEditMode = (truckId: number) => {
    setEditMode(prev => ({
      ...prev,
      [truckId]: !prev[truckId]
    }));
  };

  const toggleItemCheck = (truckId: number, itemId: string) => {
    setPackingLists((prev) => ({
      ...prev,
      [truckId]: prev[truckId].map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      ),
    }));
  };

  const addPackingItem = (truckId: number) => {
    const newItem: PackingItem = {
      id: Date.now().toString(),
      name: "",
      category: "Other",
      checked: false,
    };
    setPackingLists((prev) => ({
      ...prev,
      [truckId]: [...prev[truckId], newItem],
    }));
  };

  const updatePackingItem = (truckId: number, itemId: string, field: keyof PackingItem, value: any) => {
    setPackingLists((prev) => ({
      ...prev,
      [truckId]: prev[truckId].map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }));
  };

  const removePackingItem = (truckId: number, itemId: string) => {
    setPackingLists((prev) => ({
      ...prev,
      [truckId]: prev[truckId].filter((item) => item.id !== itemId),
    }));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Food Truck":
        return "bg-orange-100 text-orange-800";
      case "Beverage Truck":
        return "bg-blue-100 text-blue-800";
      case "Dessert Truck":
        return "bg-pink-100 text-pink-800";
      case "Holiday Truck":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Kitchen":
        return "bg-orange-100 text-orange-700";
      case "Storage":
        return "bg-blue-100 text-blue-700";
      case "Service":
        return "bg-green-100 text-green-700";
      case "Ingredients":
        return "bg-yellow-100 text-yellow-700";
      case "Equipment":
        return "bg-purple-100 text-purple-700";
      case "Maintenance":
        return "bg-gray-100 text-gray-700";
      case "Safety":
        return "bg-red-100 text-red-700";
      case "Display":
        return "bg-pink-100 text-pink-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Truck Management & Packing Lists
            </h1>
            <p className="text-lg text-gray-600">
              Manage your food trucks and their packing requirements
            </p>
          </div>

          <div className="grid gap-6 truck-management">
            {trucks.map((truck) => (
              <div key={truck.id} className="border border-gray-200 rounded-lg overflow-hidden truck-card">
                {/* Truck Header */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{truck.name}</h3>
                      <div className="flex items-center mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(truck.type)}`}>
                          {truck.type}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          Capacity: {truck.capacity}
                        </span>
                        <div className="w-8"></div>
                        <span className="text-sm text-gray-500">
                          Location: {truck.location}
                        </span>
                      </div>
                      {truck.driver && (
                        <p className="text-sm text-gray-600 mt-1">
                          Driver: {truck.driver.name} ({truck.driver.phone})
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Back to Dashboard */}
          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-primary-dark text-white rounded-md hover:bg-primary-medium transition-colors"
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
          </div>
        </div>
      </div>
    </div>
  );
} 