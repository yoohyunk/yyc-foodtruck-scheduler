"use client";

import React, {
  useState,
  useEffect,
  ReactElement,
  ChangeEvent,
  FormEvent,
  useRef,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTutorial } from "../../tutorial/TutorialContext";
import { TutorialHighlight } from "../../components/TutorialHighlight";
import ErrorModal from "../../components/ErrorModal";
import {
  validateForm,
  ValidationRule,
  ValidationError,
  createValidationRule,
} from "../../../lib/formValidation";
import { trucksApi } from "@/lib/supabase/trucks";
import ShopLocationDropdown from "../../components/ShopLocationDropdown";

interface TruckFormData {
  name: string;
  type: string;
  capacity: string;
  isAvailable: boolean;
  address: string;
  packingList: string[];
  [key: string]: unknown;
}

export default function EditTruckPage(): ReactElement {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [newPackingItem, setNewPackingItem] = useState<string>("");
  const [coordinates, setCoordinates] = useState<
    { latitude: number; longitude: number } | undefined
  >();
  const { shouldHighlight } = useTutorial();

  // Add missing refs
  const nameRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  const capacityRef = useRef<HTMLSelectElement>(null);

  // Add missing arrays
  const truckTypes = ["Food Truck", "Beverage Truck", "Dessert Truck"];
  const capacityOptions = [
    "Small (1-50 people)",
    "Medium (51-100 people)",
    "Large (101-200 people)",
    "Extra Large (200+ people)",
  ];
  const packingListOptions = [
    "Bleach Spray",
    "Cash Float",
    "Cloths",
    "Cups",
    "Diesel",
    "Engine Oil",
    "Fire Extinguisher",
    "First Aid Kit",
    "Fryer Oil",
    "Gas",
    "Garbage Bags",
    "Garbage Can",
    "Generator",
    "Generator Gas",
    "Menu Board",
    "Plates & Cups",
    "POS",
    "Propane Tank",
    "Signs",
    "Utensils",
    "Water Tank",
    "WiFi",
  ];

  const [formData, setFormData] = useState<TruckFormData>({
    name: "",
    type: "",
    capacity: "",
    isAvailable: false,
    address: "",
    packingList: [],
  });

  // Fetch truck details
  useEffect(() => {
    const fetchTruck = async () => {
      try {
        const { data: truckData, error: truckError } = await supabase
          .from("trucks")
          .select(
            `
            *,
            addresses (*)
          `
          )
          .eq("id", id)
          .single();

        if (truckError) {
          console.error("Error fetching truck:", truckError);
          setValidationErrors([
            {
              field: "general",
              message: "Failed to load truck details. Please try again.",
              element: null,
            },
          ]);
          setShowErrorModal(true);
          setIsLoading(false);
          return;
        }

        if (!truckData) {
          console.error("Truck not found");
          setValidationErrors([
            {
              field: "general",
              message: "Truck not found.",
              element: null,
            },
          ]);
          setShowErrorModal(true);
          setIsLoading(false);
          return;
        }

        // Debug log to confirm loaded truck data
        console.log("Loaded truck data for edit:", truckData);

        setFormData({
          name: truckData.name || "",
          type: truckData.type || "",
          capacity: truckData.capacity ? String(truckData.capacity) : "",
          isAvailable: truckData.is_available || false,
          address: truckData.addresses?.street
            ? `${truckData.addresses.street}, ${truckData.addresses.city}, ${truckData.addresses.postal_code}`
            : "",
          packingList: (truckData.packing_list as string[]) || [],
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching truck:", error);
        setValidationErrors([
          {
            field: "general",
            message: "An error occurred while loading truck details.",
            element: null,
          },
        ]);
        setShowErrorModal(true);
        setIsLoading(false);
      }
    };

    if (id) {
      fetchTruck();
    }
  }, [id, supabase]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleShopLocationChange = (
    address: string,
    coords?: { latitude: number; longitude: number }
  ) => {
    setFormData((prev) => ({
      ...prev,
      address: address,
    }));
    setCoordinates(coords);
  };

  const handlePackingListChange = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      packingList: prev.packingList.includes(item)
        ? prev.packingList.filter((i) => i !== item)
        : [...prev.packingList, item],
    }));
  };

  const handleAddPackingItem = () => {
    if (
      newPackingItem.trim() &&
      !formData.packingList.includes(newPackingItem.trim())
    ) {
      setFormData((prev) => ({
        ...prev,
        packingList: [...prev.packingList, newPackingItem.trim()],
      }));
      setNewPackingItem("");
    }
  };

  const handleRemovePackingItem = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      packingList: prev.packingList.filter((i) => i !== item),
    }));
  };

  const handleAutoSelectDefaults = () => {
    const defaultItems = [
      "Bleach Spray",
      "Cash Float",
      "Cloths",
      "Cups",
      "Engine Oil",
      "Fire Extinguisher",
      "First Aid Kit",
      "Garbage Bags",
      "Garbage Can",
      "Menu Board",
      "Plates & Cups",
      "POS",
      "Signs",
      "Utensils",
      "Water Tank",
      "WiFi",
    ];

    setFormData((prev) => ({
      ...prev,
      packingList: defaultItems,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const validationRules: ValidationRule[] = [
      createValidationRule(
        "name",
        true,
        undefined,
        "Truck name is required.",
        nameRef.current
      ),
      createValidationRule(
        "type",
        true,
        undefined,
        "Truck type is required.",
        typeRef.current
      ),
      createValidationRule(
        "capacity",
        true,
        undefined,
        "Capacity is required.",
        capacityRef.current
      ),
    ];

    const validationErrors = validateForm(
      formData as Record<string, unknown>,
      validationRules
    );
    setValidationErrors(validationErrors);

    if (validationErrors.length > 0) {
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // First, get the current truck to get the address_id and current availability status
      const { data: currentTruck, error: fetchError } = await supabase
        .from("trucks")
        .select("address_id, is_available")
        .eq("id", id)
        .single();

      if (fetchError) {
        throw new Error("Failed to fetch current truck data");
      }

      // Update address if location changed
      if (formData.address && coordinates && currentTruck?.address_id) {
        const addressParts = formData.address.split(", ");
        const streetPart = addressParts[0] || "";
        const city = addressParts[1] || "Calgary";
        const postalCode = addressParts[2] || "";

        const { error: addressError } = await supabase
          .from("addresses")
          .update({
            street: streetPart,
            city: city,
            province: "Alberta",
            postal_code: postalCode,
            country: "Canada",
            latitude: coordinates.latitude.toString(),
            longitude: coordinates.longitude.toString(),
          })
          .eq("id", currentTruck.address_id);

        if (addressError) {
          console.error("Error updating address:", addressError);
          throw new Error("Failed to update address");
        }
      }

      // Prepare update payload to match DB structure
      const updateData = {
        name: formData.name,
        type: formData.type,
        capacity: formData.capacity,
        is_available: formData.isAvailable,
        packing_list:
          formData.packingList.length > 0 ? formData.packingList : null,
      };

      // Debug log
      console.log("Updating truck with id:", id, "payload:", updateData);

      const updatedTruck = await trucksApi.updateTruck(
        id as string,
        updateData
      );

      if (!updatedTruck) {
        throw new Error("Failed to update truck");
      }

      // If truck availability was changed from true to false, remove ALL truck assignments for this truck
      if (
        currentTruck?.is_available === true &&
        updateData.is_available === false
      ) {
        console.log(
          "Truck availability changed to false, removing ALL truck assignments..."
        );

        // First, get ALL truck assignments for this truck to see what we're working with
        const { data: allAssignments, error: allAssignmentsError } =
          await supabase
            .from("truck_assignment")
            .select("id, start_time, end_time, event_id, driver_id")
            .eq("truck_id", id);

        if (allAssignmentsError) {
          console.error("Error fetching all assignments:", allAssignmentsError);
          throw new Error(
            `Failed to fetch truck assignments: ${allAssignmentsError.message}`
          );
        }

        console.log(
          `Found ${allAssignments?.length || 0} total assignments for truck:`,
          allAssignments
        );

        if (allAssignments && allAssignments.length > 0) {
          // Delete ALL truck assignments for this truck (not just future ones)
          // When a truck becomes unavailable, it should not have ANY assignments
          console.log(
            `Removing ALL ${allAssignments.length} assignments for truck ${id}`
          );

          const { error: deleteError } = await supabase
            .from("truck_assignment")
            .delete()
            .eq("truck_id", id);

          if (deleteError) {
            console.error("Error deleting truck assignments:", deleteError);
            throw new Error(
              `Failed to remove truck assignments: ${deleteError.message}`
            );
          }

          // Verify deletion worked by checking ALL remaining assignments
          const { data: remainingAssignments, error: verifyError } =
            await supabase
              .from("truck_assignment")
              .select("id, start_time, event_id")
              .eq("truck_id", id);

          if (verifyError) {
            console.error("Error verifying assignment deletion:", verifyError);
            throw new Error(
              `Failed to verify assignment removal: ${verifyError.message}`
            );
          }

          if (remainingAssignments && remainingAssignments.length > 0) {
            console.error(
              `Assignment deletion failed - ${remainingAssignments.length} assignments still exist:`,
              remainingAssignments
            );
            throw new Error(
              `Failed to remove all truck assignments. ${remainingAssignments.length} assignments remain.`
            );
          }

          console.log(
            `Successfully removed ALL ${allAssignments.length} truck assignments`
          );
        } else {
          console.log("No truck assignments found to remove");
        }
      }

      // Determine success message based on what happened
      let successMessage = "Truck updated successfully!";
      if (
        currentTruck?.is_available === true &&
        updateData.is_available === false
      ) {
        successMessage += " All truck assignments have been removed.";
      }

      setValidationErrors([
        {
          field: "success",
          message: successMessage,
          element: null,
        },
      ]);
      setShowErrorModal(true);
      setTimeout(() => {
        router.push("/trucks");
      }, 1500);
    } catch (error) {
      console.error("Error updating truck:", error);
      setValidationErrors([
        {
          field: "submit",
          message:
            error instanceof Error
              ? error.message
              : "Failed to update truck. Please try again.",
          element: null,
        },
      ]);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-500">Loading truck details...</p>
      </div>
    );
  }

  return (
    <TutorialHighlight
      isHighlighted={shouldHighlight(".edit-truck-page")}
      className="edit-truck-page"
    >
      <div className="flex justify-between items-center mb-4">
        <button className="button" onClick={() => router.back()}>
          &larr; Back
        </button>
      </div>

      <h1 className="form-header">Edit Truck</h1>
      <TutorialHighlight isHighlighted={shouldHighlight("form")}>
        <form onSubmit={handleSubmit} className="truck-form">
          <div className="input-group">
            <label htmlFor="name" className="input-label">
              Truck Name <span className="text-red-500">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-field"
              placeholder="Enter truck name"
            />
          </div>

          <div className="input-group">
            <label htmlFor="type" className="input-label">
              Truck Type <span className="text-red-500">*</span>
            </label>
            <select
              ref={typeRef}
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Select truck type</option>
              {truckTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="capacity" className="input-label">
              Capacity <span className="text-red-500">*</span>
            </label>
            <select
              ref={capacityRef}
              id="capacity"
              name="capacity"
              value={formData.capacity}
              onChange={handleChange}
              className="input-field"
            >
              <option value="">Select capacity</option>
              {capacityOptions.map((capacity) => (
                <option key={capacity} value={capacity}>
                  {capacity}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label htmlFor="location" className="input-label">
              Shop Location <span className="text-red-500">*</span>
            </label>
            <ShopLocationDropdown
              value={formData.address}
              onChange={handleShopLocationChange}
              placeholder="Select shop location"
              required={false}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Availability</label>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isAvailable"
                name="isAvailable"
                checked={formData.isAvailable}
                onChange={handleChange}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Available for assignments
              </span>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Packing List</label>

            {/* Predefined items */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="input-label">Predefined Items</h4>
                <button
                  type="button"
                  onClick={handleAutoSelectDefaults}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Auto-select Defaults
                </button>
              </div>
              <div className="packing-list-grid">
                {packingListOptions.map((item) => (
                  <label key={item} className="packing-list-item">
                    <input
                      type="checkbox"
                      checked={formData.packingList.includes(item)}
                      onChange={() => handlePackingListChange(item)}
                      className="packing-list-checkbox"
                    />
                    <span className="packing-list-text">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Add new item section */}
            <div
              className="section-card mb-4"
              style={{
                border: "none",
              }}
              data-no-before="true"
            >
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newPackingItem}
                  onChange={(e) => setNewPackingItem(e.target.value)}
                  placeholder="Enter custom item..."
                  className="input-field flex-1"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddPackingItem();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddPackingItem}
                  disabled={
                    !newPackingItem.trim() ||
                    formData.packingList.includes(newPackingItem.trim())
                  }
                  className="button btn-primary"
                  style={{ minHeight: "auto", padding: "0.75rem 1.5rem" }}
                >
                  Add
                </button>
              </div>
              <p className="text-sm text-gray-500">
                Press Enter or click Add to include custom items in the packing
                list
              </p>
            </div>

            {/* Custom items */}
            {formData.packingList.filter(
              (item) => !packingListOptions.includes(item)
            ).length > 0 && (
              <div className="mb-4">
                <h4 className="input-label mb-2">Custom Items</h4>
                <div className="space-y-2">
                  {formData.packingList
                    .filter((item) => !packingListOptions.includes(item))
                    .map((item) => (
                      <div
                        key={item}
                        className="section-card flex items-center justify-between"
                      >
                        <span className="packing-list-text font-medium">
                          {item}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePackingItem(item)}
                          className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Selected items summary */}
            {formData.packingList.length > 0 && (
              <div className="success-message">
                <p>
                  <strong>{formData.packingList.length}</strong> item
                  {formData.packingList.length !== 1 ? "s" : ""} selected for
                  packing list
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-4">
            <TutorialHighlight
              isHighlighted={shouldHighlight("form button[type='submit']")}
            >
              <button type="submit" className="button" disabled={isSubmitting}>
                {isSubmitting ? "Updating..." : "Update Truck"}
              </button>
            </TutorialHighlight>
            <button
              type="button"
              onClick={() => router.push("/trucks")}
              className="button bg-gray-500 hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </TutorialHighlight>

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errors={validationErrors}
        type={
          validationErrors.length === 1 &&
          validationErrors[0].field === "success"
            ? "success"
            : "error"
        }
        title={
          validationErrors.length === 1 &&
          validationErrors[0].field === "success"
            ? "Success!"
            : undefined
        }
      />
    </TutorialHighlight>
  );
}
