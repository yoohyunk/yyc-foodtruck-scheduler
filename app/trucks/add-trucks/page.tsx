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
import { validateForm, ValidationRule, ValidationError, scrollToFirstError, validateRequired, validateNumber, createValidationRule, sanitizeFormData } from "../../../lib/formValidation";

interface TruckFormData {
  name: string;
  type: string;
  capacity: string;
  address: string;
  packingList: string[];
}

export default function AddTrucks(): ReactElement {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState<TruckFormData>({
    name: "",
    type: "",
    capacity: "",
    address: "",
    packingList: [],
  });

  const [coordinates, setCoordinates] = useState<Coordinates | undefined>();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<string[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [success, setSuccess] = useState("");

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

  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleShopLocationChange = (
    address: string,
    coords?: Coordinates
  ) => {
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
    setFormErrors([]);
    setSuccess("");

    const validationRules: ValidationRule[] = [
      createValidationRule("name", true, undefined, "Truck name is required.", nameRef.current),
      createValidationRule("type", true, undefined, "Truck type is required.", typeRef.current),
      createValidationRule("capacity", true, (value: any) => validateNumber(value, 1), "Capacity is required and must be at least 1.", capacityRef.current),
    ];

    const validationErrors = validateForm(formData, validationRules);
    setValidationErrors(validationErrors);

    if (validationErrors.length > 0) {
      const errorMessages = validationErrors.map(error => error.message);
      setFormErrors(errorMessages);
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
        setFormErrors(["Failed to create address."]);
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
        is_available: true,
      };

      const { data: truck, error: truckError } = await supabase
        .from("trucks")
        .insert(truckInsert)
        .select()
        .single();

      if (truckError) {
        console.error("Error creating truck:", truckError);
        setFormErrors(["Failed to create truck."]);
        setShowErrorModal(true);
        setIsSubmitting(false);
        return;
      }

      setSuccess("Truck added successfully!");
      setTimeout(() => {
        router.push("/trucks");
      }, 2000);
    } catch (error) {
      console.error("Error adding truck:", error);
      setFormErrors(["An error occurred while adding the truck."]);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Add New Truck
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Truck Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={nameRef}
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter truck name"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                    Truck Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    ref={typeRef}
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select truck type</option>
                    {truckTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                    Capacity <span className="text-red-500">*</span>
                  </label>
                  <select
                    ref={capacityRef}
                    id="capacity"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select capacity</option>
                    {capacityOptions.map((capacity) => (
                      <option key={capacity} value={capacity}>
                        {capacity}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                    Shop Location <span className="text-red-500">*</span>
                  </label>
                  <ShopLocationDropdown
                    value={formData.address}
                    onChange={handleShopLocationChange}
                    placeholder="Select shop location"
                    required={true}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Packing List
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {packingListOptions.map((item) => (
                      <label key={item} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.packingList.includes(item)}
                          onChange={() => handlePackingListChange(item)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {isSubmitting ? "Adding..." : "Add Truck"}
              </button>
            </div>

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}
          </form>
        </div>
      </div>

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errors={validationErrors}
      />
    </>
  );
}
