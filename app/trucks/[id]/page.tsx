"use client";

import {
  useState,
  useEffect,
  FormEvent,
  ChangeEvent,
  ReactElement,
  useRef,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { TablesInsert } from "../../../database.types";
import ShopLocationDropdown from "@/app/components/ShopLocationDropdown";
import { Coordinates } from "@/app/types";
import ErrorModal from "@/app/components/ErrorModal";
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
  address_id?: string;
  [key: string]: unknown;
}

export default function EditTruckPage(): ReactElement {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [coordinates, setCoordinates] = useState<Coordinates | undefined>();

  const [formData, setFormData] = useState<TruckFormData>({
    name: "",
    type: "",
    capacity: "",
    isAvailable: true,
    address: "",
    packingList: [],
  });

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

  // Fetch truck details from Supabase
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

        // Format address
        const address = truckData.addresses
          ? `${truckData.addresses.street}, ${truckData.addresses.city}, ${truckData.addresses.province}`
          : "";

        setFormData({
          name: truckData.name || "",
          type: truckData.truck_type || "",
          capacity: truckData.capacity ? String(truckData.capacity) : "",
          isAvailable: truckData.is_available || false,
          address: address,
          packingList: (truckData.packing_list as string[]) || [],
          address_id: truckData.address_id,
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
      // Parse the address to extract components
      const addressParts = formData.address.split(", ");
      const streetPart = addressParts[0] || "";
      const city = addressParts[1] || "Calgary";
      const postalCode = addressParts[2] || "";

      // Update address if truck has one, otherwise create new
      let addressId = formData.address_id;

      if (formData.address_id) {
        // Update existing address
        const { error: addressError } = await supabase
          .from("addresses")
          .update({
            street: streetPart,
            city: city,
            province: "Alberta",
            postal_code: postalCode,
            country: "Canada",
            latitude: coordinates?.latitude?.toString() ?? null,
            longitude: coordinates?.longitude?.toString() ?? null,
          })
          .eq("id", formData.address_id);

        if (addressError) {
          console.error("Error updating address:", addressError);
          setValidationErrors([
            {
              field: "address",
              message: "Failed to update address. Please try again.",
              element: null,
            },
          ]);
          setShowErrorModal(true);
          setIsSubmitting(false);
          return;
        }
      } else {
        // Create new address
        const addressInsert: TablesInsert<"addresses"> = {
          street: streetPart,
          city: city,
          province: "Alberta",
          postal_code: postalCode,
          country: "Canada",
          latitude: coordinates?.latitude?.toString() ?? null,
          longitude: coordinates?.longitude?.toString() ?? null,
        };

        const { data: newAddress, error: addressError } = await supabase
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

        addressId = newAddress.id;
      }

      // Update truck
      const { error: truckError } = await supabase
        .from("trucks")
        .update({
          name: formData.name,
          type: formData.type,
          capacity: formData.capacity,
          address_id: addressId,
          packing_list: formData.packingList,
          is_available: formData.isAvailable,
        })
        .eq("id", id);

      if (truckError) {
        console.error("Error updating truck:", truckError);
        setValidationErrors([
          {
            field: "truck",
            message: "Failed to update truck. Please try again.",
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
      console.error("Error updating truck:", error);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-500">Loading truck details...</p>
      </div>
    );
  }

  return (
    <>
      <div className="edit-truck-page">
        <div className="flex justify-between items-center mb-4">
          <button className="button" onClick={() => router.back()}>
            &larr; Back
          </button>
        </div>

        <h1 className="form-header">Edit Truck</h1>
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

          <div className="flex justify-center space-x-4">
            <button type="submit" className="button" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Truck"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/trucks")}
              className="button bg-gray-500 hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
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
