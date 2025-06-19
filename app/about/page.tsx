"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTutorial } from "../tutorial/TutorialContext";
import { TutorialHighlight } from "../components/TutorialHighlight";

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
  packingList?: string[];
}

export default function TruckManagementPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [expandedTrucks, setExpandedTrucks] = useState<Set<number>>(new Set());
  const [newItem, setNewItem] = useState<{ [truckId: number]: string }>({});
  const [showAddInput, setShowAddInput] = useState<{
    [truckId: number]: boolean;
  }>({});
  const [checkedItems, setCheckedItems] = useState<{
    [truckId: number]: Set<number>;
  }>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{
    truckId: number;
    idx: number;
  } | null>(null);
  const { shouldHighlight } = useTutorial();

  useEffect(() => {
    // Load trucks data
    fetch("/trucks.json")
      .then((res) => res.json())
      .then((data) => {
        // Ensure each truck has a packingList array
        setTrucks(
          data.map((truck: Truck) => ({
            ...truck,
            packingList: Array.isArray(truck.packingList)
              ? truck.packingList
              : [
                  "Food preparation equipment",
                  "Cooking utensils and tools",
                  "Food storage containers",
                  "Cleaning supplies",
                  "Safety equipment",
                  "Cash register and payment system",
                  "Menu boards and signage",
                  "First aid kit",
                  "Fire extinguisher",
                  "Generator and fuel",
                ],
          }))
        );
      })
      .catch((error) => {
        console.error("Error loading trucks:", error);
      });
  }, []);

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

  const toggleTruckExpansion = (truckId: number) => {
    const newExpandedTrucks = new Set(expandedTrucks);
    if (newExpandedTrucks.has(truckId)) {
      newExpandedTrucks.delete(truckId);
    } else {
      newExpandedTrucks.add(truckId);
    }
    setExpandedTrucks(newExpandedTrucks);
  };

  // Add item handler
  const handleAddItem = async (truckId: number) => {
    const item = (newItem[truckId] || "").trim();
    if (!item) return;
    const updatedTrucks = trucks.map((truck) => {
      if (truck.id === truckId) {
        // Avoid duplicates
        const packingList = Array.isArray(truck.packingList)
          ? truck.packingList
          : [];
        if (packingList.includes(item)) return truck;
        return {
          ...truck,
          packingList: [...packingList, item],
        };
      }
      return truck;
    });
    setTrucks(updatedTrucks);
    setNewItem((prev) => ({ ...prev, [truckId]: "" }));
    // Persist to API
    try {
      await fetch("/api/trucks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTrucks),
      });
    } catch (err) {
      console.error("Failed to save updated trucks:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Truck Management
            </h1>
            <p className="text-lg text-gray-600">Manage your food trucks</p>
          </div>

          <TutorialHighlight
            isHighlighted={shouldHighlight(".truck-management")}
            className="grid gap-6 truck-management"
          >
            {trucks.map((truck, index) => (
              <TutorialHighlight
                key={truck.id}
                isHighlighted={shouldHighlight(
                  `.truck-card:nth-child(${index + 1})`
                )}
                className="border border-gray-200 rounded-lg overflow-hidden truck-card"
              >
                {/* Truck Header */}
                <div className="bg-gray-50 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {truck.name}
                      </h3>
                      <div className="flex items-center mt-1">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(truck.type)}`}
                        >
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
                    {/* Arrow Button */}
                    <TutorialHighlight
                      isHighlighted={shouldHighlight(
                        `.truck-card:nth-child(${index + 1}) button[class*='bg-green-800']`
                      )}
                    >
                      <button
                        onClick={() => toggleTruckExpansion(truck.id)}
                        className="ml-4 bg-green-800 hover:bg-green-900 text-white p-3 rounded-full transition-colors duration-200 shadow-md"
                      >
                        <svg
                          className={`w-5 h-5 transition-transform duration-200 ${expandedTrucks.has(truck.id) ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 5v14m0 0l-7-7m7 7l7-7"
                          />
                        </svg>
                      </button>
                    </TutorialHighlight>
                  </div>
                </div>

                {/* Dropdown Content */}
                {expandedTrucks.has(truck.id) && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Items to Pack
                    </h4>
                    <TutorialHighlight
                      isHighlighted={shouldHighlight(
                        `.truck-card:nth-child(${index + 1}) .flex.flex-col.gap-2`
                      )}
                      className="flex flex-col gap-2 w-full"
                    >
                      {(Array.isArray(truck.packingList)
                        ? truck.packingList
                        : []
                      ).map((item: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex flex-row items-center w-full"
                        >
                          <input
                            type="checkbox"
                            id={`item-${truck.id}-${idx}`}
                            className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                            checked={checkedItems[truck.id]?.has(idx) || false}
                            onChange={() => {
                              setCheckedItems((prev) => {
                                const prevSet = prev[truck.id]
                                  ? new Set<number>(Array.from(prev[truck.id]))
                                  : new Set<number>();
                                if (prevSet.has(idx)) {
                                  prevSet.delete(idx);
                                } else {
                                  prevSet.add(idx);
                                }
                                return { ...prev, [truck.id]: prevSet };
                              });
                            }}
                          />
                          <label
                            htmlFor={`item-${truck.id}-${idx}`}
                            className="ml-2 text-sm text-gray-800 cursor-pointer select-none w-full text-left"
                          >
                            {item}
                          </label>
                          <TutorialHighlight
                            isHighlighted={shouldHighlight(
                              `.truck-card:nth-child(${index + 1}) button[title='Delete item']`
                            )}
                          >
                            <button
                              className="ml-2 text-red-600 hover:text-red-800 text-lg font-bold focus:outline-none"
                              title="Delete item"
                              onClick={() =>
                                setDeleteConfirm({ truckId: truck.id, idx })
                              }
                              type="button"
                            >
                              ×
                            </button>
                          </TutorialHighlight>
                        </div>
                      ))}
                    </TutorialHighlight>
                    <div className="pt-4 flex gap-2 items-center">
                      <TutorialHighlight
                        isHighlighted={shouldHighlight(
                          `.truck-card:nth-child(${index + 1}) .pt-4.flex.gap-2 button:first-child`
                        )}
                      >
                        <button
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                          onClick={() => {
                            const packingList = Array.isArray(truck.packingList)
                              ? truck.packingList
                              : [];
                            setCheckedItems((prev) => ({
                              ...prev,
                              [truck.id]: new Set(
                                packingList.map((_, idx) => idx)
                              ),
                            }));
                          }}
                          type="button"
                        >
                          Mark All Packed
                        </button>
                      </TutorialHighlight>
                      {showAddInput[truck.id] ? (
                        <>
                          <input
                            type="text"
                            value={newItem[truck.id] || ""}
                            onChange={(e) =>
                              setNewItem((prev) => ({
                                ...prev,
                                [truck.id]: e.target.value,
                              }))
                            }
                            placeholder="Add item..."
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            style={{ minWidth: 0, flex: 1 }}
                          />
                          <button
                            className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                            onClick={async () => {
                              await handleAddItem(truck.id);
                              setShowAddInput((prev) => ({
                                ...prev,
                                [truck.id]: false,
                              }));
                            }}
                            type="button"
                          >
                            Save
                          </button>
                        </>
                      ) : (
                        <TutorialHighlight
                          isHighlighted={shouldHighlight(
                            `.truck-card:nth-child(${index + 1}) .pt-4.flex.gap-2 button:last-child`
                          )}
                        >
                          <button
                            style={{ backgroundColor: "var(--primary-dark)" }}
                            className="px-3 py-1 text-white text-sm rounded hover:bg-primary-medium transition-colors"
                            onClick={() =>
                              setShowAddInput((prev) => ({
                                ...prev,
                                [truck.id]: true,
                              }))
                            }
                            type="button"
                          >
                            Add Item
                          </button>
                        </TutorialHighlight>
                      )}
                    </div>
                  </div>
                )}
              </TutorialHighlight>
            ))}
          </TutorialHighlight>

          {/* Back to Dashboard Button */}
          <TutorialHighlight
            isHighlighted={shouldHighlight('.mt-8 a[href="/"]')}
            className="mt-8 text-center"
          >
            <Link
              href="/"
              className="inline-block bg-primary-dark text-white px-6 py-3 rounded-lg hover:bg-primary-medium transition-colors"
            >
              Back to Dashboard
            </Link>
          </TutorialHighlight>

          {/* Delete Confirmation Modal */}
          {deleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-sm w-full text-center">
                <div className="text-4xl mb-4 text-red-600">&#10060;</div>
                <h2 className="text-lg font-bold mb-2 text-gray-900">
                  Delete Item
                </h2>
                <p className="mb-6 text-gray-700">
                  Are you sure you want to delete this item? This action cannot
                  be undone.
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
                    onClick={() => setDeleteConfirm(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    onClick={async () => {
                      const { truckId, idx } = deleteConfirm;
                      setDeleteConfirm(null);
                      setTrucks((prevTrucks) => {
                        const updated = prevTrucks.map((truck) => {
                          if (truck.id === truckId) {
                            const packingList = Array.isArray(truck.packingList)
                              ? truck.packingList
                              : [];
                            return {
                              ...truck,
                              packingList: packingList.filter(
                                (_, i) => i !== idx
                              ),
                            };
                          }
                          return truck;
                        });
                        // Persist to API
                        fetch("/api/trucks", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(updated),
                        });
                        return updated;
                      });
                      setCheckedItems((prev) => {
                        const prevSet = prev[truckId]
                          ? new Set<number>(Array.from(prev[truckId]))
                          : new Set<number>();
                        prevSet.delete(idx);
                        // Shift checked indices after the deleted one
                        const newSet = new Set<number>();
                        Array.from(prevSet).forEach((i) => {
                          newSet.add(i > idx ? i - 1 : i);
                        });
                        return { ...prev, [truckId]: newSet };
                      });
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
