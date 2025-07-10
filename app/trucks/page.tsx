"use client";

import { useState, useEffect, ReactElement, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/database.types";
import { useTutorial } from "../tutorial/TutorialContext";
import { TutorialHighlight } from "../components/TutorialHighlight";
import { getTruckBorderColor } from "../types";

type Truck = Tables<"trucks"> & {
  addresses?: Tables<"addresses">;
};

export default function Trucks(): ReactElement {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [filteredTrucks, setFilteredTrucks] = useState<Truck[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const { shouldHighlight } = useTutorial();
  const supabase = createClient();

  // Function to fetch trucks - memoized with useCallback
  const fetchTrucks = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("trucks")
        .select(
          `
          *,
          addresses (*)
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching trucks:", error);
        return;
      }

      // Sort trucks alphabetically by name
      const sortedTrucks = (data || []).sort((a, b) =>
        a.name.localeCompare(b.name)
      );

      setTrucks(sortedTrucks);
      setFilteredTrucks(sortedTrucks);
    } catch (error) {
      console.error("Error fetching trucks:", error);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Fetch trucks on mount
  useEffect(() => {
    fetchTrucks();
  }, [fetchTrucks]);

  // Refresh data when user navigates back to this page
  useEffect(() => {
    const handleFocus = () => {
      // Refresh data when the window regains focus (user navigates back)
      fetchTrucks();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchTrucks]);

  // Filter trucks based on the active filter
  useEffect(() => {
    if (activeFilter === "All") {
      setFilteredTrucks(trucks);
    } else {
      setFilteredTrucks(trucks.filter((truck) => truck.type === activeFilter));
    }
  }, [activeFilter, trucks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-lg text-gray-500">Loading trucks...</p>
      </div>
    );
  }

  return (
    <div className="trucks-page">
      <div className="mb-6">
        <h2 className="text-2xl font-bold">Truck Management</h2>
      </div>

      {/* Filter Buttons */}
      <TutorialHighlight
        isHighlighted={shouldHighlight(".filter-buttons")}
        className="filter-buttons grid grid-cols-2 md:grid-cols-4 gap-2 mb-6"
      >
        <button
          className="button"
          style={{
            backgroundColor:
              activeFilter === "All" ? "var(--primary-dark)" : "var(--border)",
            color:
              activeFilter === "All" ? "var(--white)" : "var(--text-primary)",
            border: "2px solid var(--border)",
          }}
          onMouseEnter={(e) => {
            if (activeFilter !== "All") {
              e.currentTarget.style.background = "var(--text-muted)";
            }
          }}
          onMouseLeave={(e) => {
            if (activeFilter !== "All") {
              e.currentTarget.style.background = "var(--border)";
            }
          }}
          onClick={() => setActiveFilter("All")}
        >
          All
        </button>
        <button
          className="button"
          style={{
            backgroundColor:
              activeFilter === "Food Truck"
                ? "var(--primary-dark)"
                : "var(--secondary-dark)",
            color:
              activeFilter === "Food Truck"
                ? "var(--white)"
                : "var(--text-primary)",
            border: "2px solid var(--secondary-dark)",
          }}
          onMouseEnter={(e) => {
            if (activeFilter !== "Food Truck") {
              e.currentTarget.style.background = "var(--primary-dark)";
            }
          }}
          onMouseLeave={(e) => {
            if (activeFilter !== "Food Truck") {
              e.currentTarget.style.background = "var(--secondary-dark)";
            }
          }}
          onClick={() => setActiveFilter("Food Truck")}
        >
          Food Trucks
        </button>
        <button
          className="button"
          style={{
            backgroundColor:
              activeFilter === "Beverage Truck"
                ? "var(--primary-dark)"
                : "var(--primary-light)",
            color:
              activeFilter === "Beverage Truck"
                ? "var(--white)"
                : "var(--text-primary)",
            border: "2px solid var(--primary-light)",
          }}
          onMouseEnter={(e) => {
            if (activeFilter !== "Beverage Truck") {
              e.currentTarget.style.background = "var(--primary-dark)";
            }
          }}
          onMouseLeave={(e) => {
            if (activeFilter !== "Beverage Truck") {
              e.currentTarget.style.background = "var(--primary-light)";
            }
          }}
          onClick={() => setActiveFilter("Beverage Truck")}
        >
          Beverage Trucks
        </button>
        <button
          className="button"
          style={{
            backgroundColor:
              activeFilter === "Dessert Truck"
                ? "var(--primary-dark)"
                : "var(--secondary-light)",
            color:
              activeFilter === "Dessert Truck"
                ? "var(--white)"
                : "var(--text-primary)",
            border: "2px solid var(--secondary-light)",
          }}
          onMouseEnter={(e) => {
            if (activeFilter !== "Dessert Truck") {
              e.currentTarget.style.background = "var(--primary-dark)";
            }
          }}
          onMouseLeave={(e) => {
            if (activeFilter !== "Dessert Truck") {
              e.currentTarget.style.background = "var(--secondary-light)";
            }
          }}
          onClick={() => setActiveFilter("Dessert Truck")}
        >
          Dessert Trucks
        </button>
      </TutorialHighlight>

      {/* Truck List */}
      <TutorialHighlight
        isHighlighted={shouldHighlight(".truck-list")}
        className="truck-list grid gap-4"
      >
        {filteredTrucks.length > 0 ? (
          filteredTrucks.map((truck, index) => {
            const leftBorderColor = getTruckBorderColor(truck.type);
            return (
              <TutorialHighlight
                key={truck.id}
                isHighlighted={shouldHighlight(
                  `.truck-card:nth-child(${index + 1})`
                )}
              >
                <div
                  className="truck-card p-6 rounded-lg shadow-md relative"
                  style={{
                    backgroundColor: "var(--white)",
                    border: "1px solid var(--border)",
                    borderLeft: `10px solid ${leftBorderColor}`,
                    borderRadius: "1.5rem",
                    transition: "border-color 0.2s",
                  }}
                >
                  {/* Edit Button */}
                  <TutorialHighlight
                    isHighlighted={shouldHighlight(
                      `.truck-card:nth-child(${index + 1}) button[title='Edit Truck']`
                    )}
                  >
                    <button
                      className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                      onClick={() => router.push(`/trucks/${truck.id}`)}
                      title="Edit Truck"
                    >
                      ✏️
                    </button>
                  </TutorialHighlight>

                  <h3 className="text-xl font-semibold mb-3">{truck.name}</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="mb-2">
                        <strong>Type:</strong> {truck.type}
                      </p>
                      <p className="mb-2">
                        <strong>Capacity:</strong> {truck.capacity}
                      </p>
                      <p className="mb-2">
                        <strong>Status:</strong>{" "}
                        <span
                          className={
                            truck.is_available
                              ? "text-green-600 font-semibold"
                              : "text-red-600 font-semibold"
                          }
                        >
                          {truck.is_available ? "Available" : "Unavailable"}
                        </span>
                      </p>
                    </div>

                    <div>
                      <p className="mb-2">
                        <strong>Location:</strong>{" "}
                        {truck.addresses?.street || "No address"}
                      </p>
                      {truck.packing_list && truck.packing_list.length > 0 && (
                        <p className="mb-2">
                          <strong>Equipment:</strong>{" "}
                          <span className="text-sm text-gray-600">
                            {truck.packing_list.slice(0, 3).join(", ")}
                            {truck.packing_list.length > 3 && "..."}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </TutorialHighlight>
            );
          })
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No trucks found.</p>
            <button
              onClick={() => router.push("/trucks/add-trucks")}
              className="button"
              style={{
                backgroundColor: "var(--success-medium)",
                color: "var(--white)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--success-dark)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--success-medium)";
              }}
            >
              Add Your First Truck
            </button>
          </div>
        )}
      </TutorialHighlight>
    </div>
  );
}
