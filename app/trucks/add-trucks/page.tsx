"use client";

import React, {
  useState,
  FormEvent,
  ReactElement,
  ChangeEvent,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TablesInsert } from "@/database.types";
import ShopLocationDropdown from "@/app/components/ShopLocationDropdown";
import { Coordinates } from "@/app/types";
import ErrorModal from "../../components/ErrorModal";
import {
  validateForm,
  ValidationRule,
  ValidationError,
  createValidationRule,
} from "../../../lib/formValidation";

interface TruckFormData {
  name: string;
  type: string;
  capacity: string;
  isAvailable: boolean;
  address: string;
  packingList: string[];
  [key: string]: unknown;
}

export default function AddTrucks(): ReactElement {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState<TruckFormData>({
    name: "",
    type: "",
    capacity: "",
    isAvailable: true,
    address: "",
    packingList: [
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
    ],
  });

  const [coordinates, setCoordinates] = useState<Coordinates | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [newPackingItem, setNewPackingItem] = useState<string>("");

  // Refs for form fields
  const nameRef = useRef<HTMLInputElement>(null);
  const typeRef = useRef<HTMLSelectElement>(null);
  const capacityRef = useRef<HTMLSelectElement>(null);

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

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleShopLocationChange = (address: string, coords?: Coordinates) => {
    setFormData({
      ...formData,
      address: address,
    });
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
        (value: unknown) => typeof value === "string" && value.trim() !== "",
        "Please select a capacity.",
        capacityRef.current
      ),
    ];

    const validationErrors = validateForm(formData, validationRules);
    setValidationErrors(validationErrors);

    if (validationErrors.length > 0) {
      setShowErrorModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse the address to extract components
      const addressParts = formData.address.split(", ");
      const streetPart = addressParts[0] || "";
      const city = addressParts[1] || "Calgary";
      const postalCode = addressParts[2] || "";

      // 1. Create address first
      const addressInsert: TablesInsert<"addresses"> = {
        street: streetPart,
        city: city,
        province: "Alberta",
        postal_code: postalCode,
        country: "Canada",
        latitude: coordinates?.latitude?.toString() ?? null,
        longitude: coordinates?.longitude?.toString() ?? null,
      };

      const { data: address, error: addressError } = await supabase
        .from("addresses")
        .insert(addressInsert)
        .select()
        .single();

      if (addressError) {
        console.error("Error creating address:", addressError);
        setValidationErrors([
          {
            field: "address",
            message: "Failed to create address. Please try again.",
            element: null,
          },
        ]);
        setShowErrorModal(true);
        setIsSubmitting(false);
        return;
      }

      // 2. Create truck
      const truckInsert: TablesInsert<"trucks"> = {
        name: formData.name,
        type: formData.type,
        capacity: formData.capacity,
        address_id: address.id,
        packing_list: formData.packingList,
        is_available: formData.isAvailable,
      };

      const { error: truckError } = await supabase
        .from("trucks")
        .insert(truckInsert)
        .select()
        .single();

      if (truckError) {
        console.error("Error creating truck:", truckError);
        setValidationErrors([
          {
            field: "truck",
            message: "Failed to create truck. Please try again.",
            element: null,
          },
        ]);
        setShowErrorModal(true);
        setIsSubmitting(false);
        return;
      }

      // Success - redirect to trucks page
      router.push("/trucks");
    } catch (error) {
      console.error("Error creating truck:", error);
      setValidationErrors([
        {
          field: "general",
          message: "An unexpected error occurred. Please try again.",
          element: null,
        },
      ]);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="create-truck-page">
        <div className="flex justify-between items-center mb-4">
          <button className="button" onClick={() => router.back()}>
            &larr; Back
          </button>
        </div>

        <h1 className="form-header">Add New Truck</h1>
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
                borderLeft: "6px solid var(--primary-light)",
                borderTop: "4px solid var(--secondary-light)",
                borderRight: "none",
                borderBottom: "none",
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

          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Truck"}
          </button>
        </form>
      </div>

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errors={validationErrors}
      />
    </>
  );
}
