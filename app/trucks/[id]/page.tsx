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

interface TruckFormData {
  name: string;
  type: string;
  capacity: string;
  isAvailable: boolean;
  packingList: string[];
  address_id?: string | null;
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
    "Grill",
    "Fryer",
    "Refrigerator",
    "Freezer",
    "Sink",
    "Prep Station",
    "Storage Cabinets",
    "Generator",
    "Water Tank",
    "Propane Tank",
    "Utensils",
    "Plates & Cups",
    "Cleaning Supplies",
    "First Aid Kit",
    "Fire Extinguisher",
  ];

  const [formData, setFormData] = useState<TruckFormData>({
    name: "",
    type: "",
    capacity: "",
    isAvailable: false,
    packingList: [],
    address_id: null,
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
          packingList: (truckData.packing_list as string[]) || [],
          address_id: truckData.address_id || null,
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

  const handlePackingListChange = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      packingList: prev.packingList.includes(item)
        ? prev.packingList.filter((i) => i !== item)
        : [...prev.packingList, item],
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

    let updatedTruck = null;
    try {
      // Defensive: Ensure id is a string
      if (!id || typeof id !== "string") {
        setValidationErrors([
          {
            field: "id",
            message: "Invalid truck ID. Cannot update.",
            element: null,
          },
        ]);
        setShowErrorModal(true);
        setIsSubmitting(false);
        return;
      }

      // Prepare update payload to match DB structure
      const updateData = {
        name: formData.name,
        type: formData.type,
        capacity: formData.capacity,
        is_available: formData.isAvailable,
        packing_list:
          formData.packingList.length > 0 ? formData.packingList : null,
        address_id:
          formData.address_id === undefined ? null : formData.address_id,
      };

      // Debug log
      console.log(
        "Updating truck with id (via trucksApi):",
        id,
        "payload:",
        updateData
      );

      // Use trucksApi for update, handle errors robustly
      try {
        updatedTruck = await trucksApi.updateTruck(id, updateData);
      } catch (error) {
        // Log technical error details for debugging
        console.error("Error updating truck (via trucksApi):", error);
        setValidationErrors([
          {
            field: "submit",
            message:
              "Update failed. Please contact an administrator if this persists.",
            element: null,
          },
        ]);
        setShowErrorModal(true);
        setIsSubmitting(false);
        return;
      }

      if (!updatedTruck) {
        // Defensive: should not happen, but just in case
        console.error("trucksApi.updateTruck returned no truck.", { id, updateData });
        setValidationErrors([
          {
            field: "submit",
            message: "Update failed. Please contact an administrator if this persists.",
            element: null,
          },
        ]);
        setShowErrorModal(true);
        setIsSubmitting(false);
        return;
      }

      setValidationErrors([
        {
          field: "success",
          message: "Truck updated successfully!",
          element: null,
        },
      ]);
      setShowErrorModal(true);
      setTimeout(() => {
        router.push("/trucks");
      }, 1500);
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
