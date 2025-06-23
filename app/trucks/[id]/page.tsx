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
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");
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
          .eq("truck_id", id)
          .single();

        if (truckError) {
          console.error("Error fetching truck:", truckError);
          setIsLoading(false);
          return;
        }

        if (!truckData) {
          console.error("Truck not found");
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
        });

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching truck:", error);
        setIsLoading(false);
      }
    };

    if (id) {
      fetchTruck();
    }
  }, [id, supabase]);

  // Fetch events associated with the truck
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { error } = await supabase
          .from("events")
          .select(
            `
            *,
            addresses (*)
          `
          )
          .order("start_date", { ascending: true });

        if (error) {
          console.error("Error fetching events:", error);
          return;
        }

        // Filter events that include this truck (would need truck_assignment table)
        // For now, show all events
        // setEvents(data || []);
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    if (id) {
      fetchEvents();
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
      if (!formData) {
        setError("Truck not found.");
        setShowErrorModal(true);
        setIsSubmitting(false);
        return;
      }

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
          setError("Failed to update address.");
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
          setError("Failed to create address.");
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
        // setFormErrors(["Failed to update truck."]);
        setShowErrorModal(true);
        setIsSubmitting(false);
        return;
      }

      setSuccess("Truck updated successfully!");
      setTimeout(() => {
        router.push("/trucks");
      }, 2000);
    } catch (error) {
      console.error("Error updating truck:", error);
      // setFormErrors(["An error occurred while updating the truck."]);
      setShowErrorModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (success) return <p className="text-green-600">{success}</p>;

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Edit Truck
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
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
                  <label
                    htmlFor="type"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
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
                  <label
                    htmlFor="capacity"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
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
                  <label
                    htmlFor="location"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
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
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isAvailable"
                      name="isAvailable"
                      checked={formData.isAvailable}
                      onChange={handleChange}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Available for assignments
                    </span>
                  </label>
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

            <div className="flex justify-center space-x-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {isSubmitting ? "Updating..." : "Update Truck"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/trucks")}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                Cancel
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
