"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/database.types";
import { useTutorial } from "../tutorial/TutorialContext";
import { TutorialHighlight } from "../components/TutorialHighlight";
import { getTruckBorderColor } from "../types";
import { useAuth } from "@/contexts/AuthContext";
import { employeesApi } from "@/lib/supabase/employees";

type Truck = Tables<"trucks"> & {
  addresses?: Tables<"addresses">;
  packingList?: string[];
};

export default function TruckManagementPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [expandedTrucks, setExpandedTrucks] = useState<Set<string>>(new Set());
  const [newItem, setNewItem] = useState<{ [truckId: string]: string }>({});
  const [showAddInput, setShowAddInput] = useState<{
    [truckId: string]: boolean;
  }>({});
  const [checkedItems, setCheckedItems] = useState<{
    [truckId: string]: Set<number>;
  }>({});
  const [deleteConfirm, setDeleteConfirm] = useState<{
    truckId: string;
    idx: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const { shouldHighlight } = useTutorial();
  const { user, loading: authLoading, isAdmin } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    const fetchAssignedTrucks = async () => {
      setLoading(true);
      try {
        if (authLoading || !user) {
          setTrucks([]);
          setLoading(false);
          return;
        }
        // Get employee_id from user_id
        const employee = await employeesApi.getEmployeeByUserId(user.id);
        if (!employee) {
          setTrucks([]);
          setLoading(false);
          return;
        }
        const employeeId = employee.employee_id;
        // Get date range: today to 2 weeks from now
        const now = new Date();
        const startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const endDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + 14
        );
        // Get all truck assignments for this employee
        const { data: truckAssignments, error } = await supabase
          .from("truck_assignment")
          .select(`*, trucks(*), events:event_id(*)`)
          .eq("driver_id", employeeId)
          .gte("start_time", startDate.toISOString())
          .lte("start_time", endDate.toISOString());
        if (error) {
          console.error("Error fetching truck assignments:", error);
          setTrucks([]);
          setLoading(false);
          return;
        }
        // Get unique trucks from assignments
        const uniqueTrucks: { [id: string]: Truck } = {};
        (truckAssignments || []).forEach((assignment: { trucks?: Truck }) => {
          if (assignment.trucks && assignment.trucks.id) {
            uniqueTrucks[assignment.trucks.id] = {
              ...assignment.trucks,
              packingList: Array.isArray(assignment.trucks.packing_list)
                ? assignment.trucks.packing_list
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
            };
          }
        });
        setTrucks(Object.values(uniqueTrucks));
      } catch (error) {
        console.error("Error loading assigned trucks:", error);
        setTrucks([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignedTrucks();
  }, [user, authLoading, supabase]);

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

  const toggleTruckExpansion = (truckId: string) => {
    const newExpandedTrucks = new Set(expandedTrucks);
    if (newExpandedTrucks.has(truckId)) {
      newExpandedTrucks.delete(truckId);
    } else {
      newExpandedTrucks.add(truckId);
    }
    setExpandedTrucks(newExpandedTrucks);
  };

  // Add item handler
  const handleAddItem = async (truckId: string) => {
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

    // Update database
    try {
      const truck = updatedTrucks.find((t) => t.id === truckId);
      if (truck) {
        const { error } = await supabase
          .from("trucks")
          .update({ packing_list: truck.packingList })
          .eq("id", truckId);

        if (error) {
          console.error("Failed to update truck packing list:", error);
        }
      }
    } catch (err) {
      console.error("Failed to save updated trucks:", err);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen py-8"
        style={{ background: "var(--background)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-lg shadow-md p-8"
            style={{ background: "var(--white)" }}
          >
            <div className="text-center">
              <p className="text-lg" style={{ color: "var(--text-muted)" }}>
                Loading trucks...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!trucks.length) {
    return (
      <div
        className="min-h-screen py-8"
        style={{ background: "var(--background)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="rounded-lg shadow-md p-8"
            style={{ background: "var(--white)" }}
          >
            <div className="text-center">
              <h1
                className="text-3xl font-bold mb-4"
                style={{ color: "var(--text-primary)" }}
              >
                Truck Management
              </h1>
              <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
                No events scheduled to load truck in the next 2 weeks.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-8"
      style={{ background: "var(--background)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="rounded-lg shadow-md p-8"
          style={{ background: "var(--white)" }}
        >
          <div className="text-center mb-8">
            <h1
              className="text-3xl font-bold mb-4"
              style={{ color: "var(--text-primary)" }}
            >
              Truck Management
            </h1>
            <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
              Manage your food trucks
            </p>
          </div>

          <TutorialHighlight
            isHighlighted={shouldHighlight(".truck-management")}
            className="grid gap-6 truck-management"
          >
            {trucks.map((truck, index) => {
              const leftBorderColor = getTruckBorderColor(truck.type);
              return (
                <div
                  key={truck.id}
                  className="truck-card"
                  style={{
                    border: "1px solid var(--border)",
                    borderLeft: `10px solid ${leftBorderColor}`,
                    borderRadius: "1.5rem",
                    transition: "border-color 0.2s",
                  }}
                >
                  <TutorialHighlight
                    isHighlighted={shouldHighlight(
                      `.truck-card:nth-child(${index + 1})`
                    )}
                    className="h-full flex flex-col"
                  >
                    {/* Truck Header */}
                    <div
                      className="px-6 py-4"
                      style={{ background: "var(--background)" }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3
                            className="text-lg font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {truck.name}
                          </h3>
                          <div className="flex items-center mt-1">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(truck.type)}`}
                            >
                              {truck.type}
                            </span>
                            <span
                              className="text-sm ml-2"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Capacity: {truck.capacity}
                            </span>
                            <div className="w-8"></div>
                            <span
                              className="text-sm"
                              style={{ color: "var(--text-muted)" }}
                            >
                              Location:{" "}
                              {truck.addresses?.street || "No address"}
                            </span>
                          </div>
                          <p
                            className="text-sm mt-1"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            Status:{" "}
                            {truck.is_available ? "Available" : "Unavailable"}
                          </p>
                        </div>
                        {/* Arrow Button */}
                        <TutorialHighlight
                          isHighlighted={shouldHighlight(
                            `.truck-card:nth-child(${index + 1}) button[class*='bg-green-800']`
                          )}
                        >
                          <button
                            onClick={() => toggleTruckExpansion(truck.id)}
                            className="ml-4 p-3 rounded-full transition-colors duration-200 shadow-md"
                            style={{
                              background: "var(--success-dark)",
                              color: "var(--white)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background =
                                "var(--success-medium)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background =
                                "var(--success-dark)";
                            }}
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
                      <div
                        className="px-6 py-4 border-t"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <h4
                          className="font-medium mb-3"
                          style={{ color: "var(--text-primary)" }}
                        >
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
                                checked={
                                  checkedItems[truck.id]?.has(idx) || false
                                }
                                onChange={() => {
                                  setCheckedItems((prev) => {
                                    const prevSet = prev[truck.id]
                                      ? new Set<number>(
                                          Array.from(prev[truck.id])
                                        )
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
                                className="ml-2 text-sm cursor-pointer select-none w-full text-left"
                                style={{ color: "var(--text-primary)" }}
                              >
                                {item}
                              </label>
                              {isAdmin && (
                                <TutorialHighlight
                                  isHighlighted={shouldHighlight(
                                    `.truck-card:nth-child(${index + 1}) button[title='Delete item']`
                                  )}
                                >
                                  <button
                                    className="ml-2 text-red-600 hover:text-red-800 text-lg font-bold focus:outline-none"
                                    title="Delete item"
                                    onClick={() =>
                                      setDeleteConfirm({
                                        truckId: truck.id,
                                        idx,
                                      })
                                    }
                                    type="button"
                                  >
                                    ×
                                  </button>
                                </TutorialHighlight>
                              )}
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
                              className="px-3 py-1 text-sm rounded transition-colors"
                              style={{
                                background: "var(--success-medium)",
                                color: "var(--white)",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                  "var(--success-dark)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  "var(--success-medium)";
                              }}
                              onClick={() => {
                                const packingList = Array.isArray(
                                  truck.packingList
                                )
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
                                className="px-2 py-1 border rounded text-sm focus:outline-none"
                                style={{
                                  borderColor: "var(--border)",
                                  minWidth: 0,
                                  flex: 1,
                                }}
                                onFocus={(e) => {
                                  e.currentTarget.style.borderColor =
                                    "var(--success-medium)";
                                  e.currentTarget.style.boxShadow =
                                    "0 0 0 2px var(--success-light)";
                                }}
                                onBlur={(e) => {
                                  e.currentTarget.style.borderColor =
                                    "var(--border)";
                                  e.currentTarget.style.boxShadow = "";
                                }}
                              />
                              <button
                                className="px-3 py-1 text-sm rounded transition-colors"
                                style={{
                                  background: "var(--text-muted)",
                                  color: "var(--white)",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background =
                                    "var(--text-secondary)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    "var(--text-muted)";
                                }}
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
                                style={{
                                  backgroundColor: "var(--primary-dark)",
                                }}
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
                </div>
              );
            })}
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
                <div
                  className="text-4xl mb-4"
                  style={{ color: "var(--error-medium)" }}
                >
                  &#10060;
                </div>
                <h2 className="text-lg font-bold mb-2 text-gray-900">
                  Delete Item
                </h2>
                <p className="mb-6 text-gray-700">
                  Are you sure you want to delete this item? This action cannot
                  be undone.
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    className="px-4 py-2 rounded"
                    style={{
                      background: "var(--border)",
                      color: "var(--text-primary)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--text-muted)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--border)";
                    }}
                    onClick={() => setDeleteConfirm(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded"
                    style={{
                      background: "var(--error-medium)",
                      color: "var(--white)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "var(--error-dark)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--error-medium)";
                    }}
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
                        // Update database
                        const truck = updated.find((t) => t.id === truckId);
                        if (truck) {
                          supabase
                            .from("trucks")
                            .update({ packing_list: truck.packingList })
                            .eq("id", truckId)
                            .then(({ error }) => {
                              if (error) {
                                console.error("Failed to update truck:", error);
                              }
                            });
                        }
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
