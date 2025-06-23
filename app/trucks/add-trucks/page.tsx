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
  validateNumber,
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
    packingList: [],
  });

  const [coordinates, setCoordinates] = useState<Coordinates | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );

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
        (value: unknown) =>
          (typeof value === "string" || typeof value === "number") &&
          validateNumber(value, 1),
        "Capacity is required and must be at least 1.",
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
