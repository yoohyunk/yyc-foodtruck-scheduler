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
import ErrorModal from "../../components/ErrorModal";
import { validateForm, ValidationRule, ValidationError, scrollToFirstError, validateRequired, validateNumber, createValidationRule, sanitizeFormData } from "../../lib/formValidation";

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
        console.error("Error creating address:", addressError);
        setFormErrors(["Failed to create address."]);
        setShowErrorModal(true);
        setIsSubmitting(false);
        return;
      }

      // 2. 트럭 생성
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
      <div className="add-trucks-page">
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
              <option value="">Select Truck Type</option>
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
              <option value="">Select Capacity</option>
              {capacityOptions.map((capacity) => (
                <option key={capacity} value={capacity}>
                  {capacity}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">
              Address <span className="text-red-500">*</span>
            </label>
            <AddressForm
              ref={addressFormRef}
              value={formData.address}
              onChange={handleAddressChange}
            />
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
            {isSubmitting ? "Adding Truck..." : "Add Truck"}
          </button>
        </form>

        {success && (
          <div className="success-message">
            <p>{success}</p>
          </div>
        )}
      </div>

      <ErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errors={validationErrors}
      />
    </>
  );
}
