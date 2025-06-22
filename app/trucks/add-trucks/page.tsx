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
import AddressForm, { AddressFormRef } from "@/app/components/AddressForm";
import { Coordinates } from "@/app/types";

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
  const addressFormRef = useRef<AddressFormRef>(null);

  const [formData, setFormData] = useState<TruckFormData>({
    name: "",
    type: "",
    capacity: "",
    address: "",
    packingList: [],
  });

  const [coordinates, setCoordinates] = useState<Coordinates | undefined>();
  const [addressFormData, setAddressFormData] = useState<{
    streetNumber: string;
    streetName: string;
    direction: string;
    city: string;
    postalCode: string;
  } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleAddressChange = (
    address: string,
    coords?: Coordinates,
    addrData?: {
      streetNumber: string;
      streetName: string;
      direction: string;
      city: string;
      postalCode: string;
    }
  ) => {
    setFormData({
      ...formData,
      address: address,
    });
    setCoordinates(coords);
    setAddressFormData(addrData || null);
  };

  const handlePackingListChange = (item: string) => {
    setFormData((prev) => ({
      ...prev,
      packingList: prev.packingList.includes(item)
        ? prev.packingList.filter((i) => i !== item)
        : [...prev.packingList, item],
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("Truck name is required.");
      return false;
    }
    if (!formData.type) {
      setError("Truck type is required.");
      return false;
    }
    if (!formData.capacity) {
      setError("Capacity is required.");
      return false;
    }
    if (!formData.address.trim()) {
      setError("Address is required.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    // Validate address
    const isAddressValid = addressFormRef.current?.validate() ?? false;
    if (!isAddressValid) {
      setError("Please enter a valid address.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. 주소 먼저 생성
      const addressInsert: TablesInsert<"addresses"> = {
        street: formData.address,
        city: addressFormData?.city || "Calgary",
        province: "Alberta",
        postal_code: addressFormData?.postalCode || "",
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
        setError(`Failed to create address: ${addressError.message}`);
        setIsSubmitting(false);
        return;
      }

      // 2. 트럭 생성 (address_id 사용)
      const truckInsert: TablesInsert<"trucks"> = {
        name: formData.name,
        type: formData.type,
        capacity: formData.capacity,
        address_id: address.id,
        is_available: true,
        packing_list:
          formData.packingList.length > 0 ? formData.packingList : null,
      };

      const { error: truckError } = await supabase
        .from("trucks")
        .insert(truckInsert)
        .select()
        .single();

      if (truckError) {
        setError(`Failed to create truck: ${truckError.message}`);
        setIsSubmitting(false);
        return;
      }

      setSuccess("Truck added successfully!");
      setTimeout(() => {
        router.push("/trucks");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-truck-page">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Add New Truck</h1>
        <button onClick={() => router.back()} className="button">
          &larr; Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Truck Name */}
        <div className="input-group">
          <label htmlFor="name" className="input-label">
            Truck Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="input-field"
            placeholder="Enter truck name"
            required
          />
        </div>

        {/* Truck Type */}
        <div className="input-group">
          <label htmlFor="type" className="input-label">
            Truck Type *
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="">Select truck type</option>
            {truckTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Capacity */}
        <div className="input-group">
          <label htmlFor="capacity" className="input-label">
            Capacity *
          </label>
          <select
            id="capacity"
            name="capacity"
            value={formData.capacity}
            onChange={handleChange}
            className="input-field"
            required
          >
            <option value="">Select capacity</option>
            {capacityOptions.map((capacity) => (
              <option key={capacity} value={capacity}>
                {capacity}
              </option>
            ))}
          </select>
        </div>

        {/* Address */}
        <div className="input-group">
          <label htmlFor="address" className="input-label">
            Address *
          </label>
          <AddressForm
            value={formData.address}
            onChange={handleAddressChange}
            placeholder="Enter truck address"
            required
            ref={addressFormRef}
          />
        </div>

        {/* Packing List */}
        <div className="input-group">
          <label className="input-label">Packing List (Optional)</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {packingListOptions.map((item) => (
              <label key={item} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.packingList.includes(item)}
                  onChange={() => handlePackingListChange(item)}
                  className="rounded"
                />
                <span className="text-sm">{item}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? "Adding Truck..." : "Add Truck"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="button bg-gray-500 hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}
      </form>
    </div>
  );
}
