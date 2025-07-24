"use client";

import { useState, useEffect, ReactElement, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/database.types";
import { useTutorial } from "../tutorial/TutorialContext";
import { TutorialHighlight } from "../components/TutorialHighlight";
import { getTruckTypeClass } from "../types";
import ErrorModal from "../components/ErrorModal";
import { trucksApi } from "@/lib/supabase/trucks";
import { useAuth } from "@/contexts/AuthContext";
import SearchInput from "../components/SearchInput";

type Truck = Tables<"trucks"> & {
  addresses?: Tables<"addresses">;
};

export default function Trucks(): ReactElement {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [filteredTrucks, setFilteredTrucks] = useState<Truck[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const [activeStatus, setActiveStatus] = useState<"active" | "inactive">(
    "active"
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();
  const { shouldHighlight } = useTutorial();
  const supabase = createClient();
  const { isAdmin } = useAuth();

  // State for delete modal and error handling
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [truckToDelete, setTruckToDelete] = useState<Truck | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

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

  // Filter trucks based on the active filter, activeStatus, and search term
  useEffect(() => {
    let filtered = trucks;

    // Filter by truck type
    if (activeFilter !== "All") {
      filtered = filtered.filter((truck) => truck.type === activeFilter);
    }

    // Filter by status
    filtered = filtered.filter((truck) =>
      activeStatus === "active" ? truck.is_available : !truck.is_available
    );

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((truck) => {
        const name = (truck.name || "").toLowerCase();
        const type = (truck.type || "").toLowerCase();
        const capacity = (truck.capacity || "").toLowerCase();
        const address = (truck.addresses?.street || "").toLowerCase();
        const packingList = (truck.packing_list || []).join(" ").toLowerCase();

        return (
          name.includes(searchLower) ||
          type.includes(searchLower) ||
          capacity.includes(searchLower) ||
          address.includes(searchLower) ||
          packingList.includes(searchLower)
        );
      });
    }

    // Sort alphabetically by name
    filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
    setFilteredTrucks(filtered);
  }, [activeFilter, trucks, activeStatus, searchTerm]);

  // Handler to open the delete confirmation modal
  const handleDeleteClick = (truck: Truck) => {
    setTruckToDelete(truck);
    setShowDeleteModal(true);
    setDeleteError(null);
    setDeleteSuccess(false);
  };

  // Handler to actually delete the truck
  const handleDeleteConfirm = async () => {
    if (!truckToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);
    // Optimistically remove the truck from the UI before deleting from the database
    const updatedTrucks = trucks.filter((t) => t.id !== truckToDelete.id);
    setTrucks(updatedTrucks);
    setFilteredTrucks(updatedTrucks);
    const restoreTruck = truckToDelete; // Save for possible rollback
    setShowDeleteModal(false);
    setTruckToDelete(null);
    try {
      // Delete from the database
      await trucksApi.deleteTruck(restoreTruck.id);
      setDeleteSuccess(true);
    } catch (error: unknown) {
      // If deletion fails, restore the truck to the UI
      setTrucks((prev) => [...prev, restoreTruck]);
      setFilteredTrucks((prev) => [...prev, restoreTruck]);
      if (error && typeof error === "object" && "message" in error) {
        setDeleteError(
          (error as { message?: string }).message ||
            "Failed to delete truck. Please try again."
        );
      } else {
        setDeleteError("Failed to delete truck. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

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

      {/* Search Input */}
      <div className="search-input-container">
        <SearchInput
          placeholder="Search trucks by name, type, capacity, location, or equipment..."
          onSearch={setSearchTerm}
          className="max-w-md"
        />
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

      {/* Active/Inactive Toggle */}
      <div className="mb-4 flex justify-end">
        <div className="flex items-center gap-2 md:gap-4">
          <span className="font-medium text-primary-dark">Show:</span>
          <button
            className={`px-4 py-2 rounded-full shadow transition-all duration-200 border-2 focus:outline-none focus:ring-2 focus:ring-primary-dark text-sm font-semibold ${activeStatus === "active" ? "text-white scale-105" : "bg-gray-100 text-primary-dark border-gray-200 hover:bg-primary-light hover:text-primary-dark"}`}
            style={{
              backgroundColor:
                activeStatus === "active" ? "var(--primary-dark)" : undefined,
              borderColor:
                activeStatus === "active" ? "var(--primary-dark)" : undefined,
              minWidth: 90,
            }}
            onClick={() => setActiveStatus("active")}
          >
            Active
          </button>
          <button
            className={`px-4 py-2 rounded-full shadow transition-all duration-200 border-2 focus:outline-none focus:ring-2 focus:ring-primary-dark text-sm font-semibold ${activeStatus === "inactive" ? "text-white scale-105" : "bg-gray-100 text-primary-dark border-gray-200 hover:bg-primary-light hover:text-primary-dark"}`}
            style={{
              backgroundColor:
                activeStatus === "inactive" ? "var(--primary-dark)" : undefined,
              borderColor:
                activeStatus === "inactive" ? "var(--primary-dark)" : undefined,
              minWidth: 90,
            }}
            onClick={() => setActiveStatus("inactive")}
          >
            Inactive
          </button>
        </div>
      </div>
      <div className="h-5"></div>

      {/* Truck List */}
      <TutorialHighlight
        isHighlighted={shouldHighlight(".truck-list")}
        className="truck-list grid gap-4"
      >
        {filteredTrucks.length > 0 ? (
          filteredTrucks.map((truck, index) => {
            return (
              <TutorialHighlight
                key={truck.id}
                isHighlighted={shouldHighlight(
                  `.truck-card:nth-child(${index + 1})`
                )}
              >
                <div
                  className={`truck-card p-6 rounded-lg shadow-md relative ${getTruckTypeClass(truck.type)}`}
                  style={{
                    backgroundColor: "var(--white)",
                    borderRadius: "1.5rem",
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
                  {/* Delete Button - only for unavailable trucks */}
                  {truck.is_available === false && (
                    <button
                      className="absolute top-4 right-16 text-red-500 hover:text-red-700 delete-button"
                      onClick={() => handleDeleteClick(truck)}
                      title="Delete Truck"
                      style={{ fontSize: "1.25rem" }}
                    >
                      🗑️
                    </button>
                  )}

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
              onClick={() => isAdmin && router.push("/trucks/add-trucks")}
              className="button"
              style={{
                backgroundColor: "var(--success-medium)",
                color: "var(--white)",
                opacity: isAdmin ? 1 : 0.5,
                cursor: isAdmin ? "pointer" : "not-allowed",
              }}
              disabled={!isAdmin}
              onMouseEnter={(e) => {
                if (isAdmin)
                  e.currentTarget.style.background = "var(--success-dark)";
              }}
              onMouseLeave={(e) => {
                if (isAdmin)
                  e.currentTarget.style.background = "var(--success-medium)";
              }}
            >
              Add Your First Truck
            </button>
          </div>
        )}
      </TutorialHighlight>
      {/* Delete Confirmation Modal */}
      <ErrorModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        errors={
          truckToDelete
            ? [
                {
                  field: "delete",
                  message: `Are you sure you want to delete ${truckToDelete.name}? This action cannot be undone.`,
                },
              ]
            : []
        }
        title="Confirm Delete"
        type="confirmation"
        onConfirm={handleDeleteConfirm}
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        cancelText="Cancel"
      />
      {/* Error Modal for delete errors */}
      <ErrorModal
        isOpen={!!deleteError}
        onClose={() => setDeleteError(null)}
        errors={deleteError ? [{ field: "delete", message: deleteError }] : []}
        title="Delete Error"
        type="error"
      />
      {/* Success Modal for delete success */}
      <ErrorModal
        isOpen={deleteSuccess}
        onClose={() => setDeleteSuccess(false)}
        errors={[{ field: "success", message: "Truck deleted successfully!" }]}
        title="Success!"
        type="success"
      />
    </div>
  );
}
