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
import { Tables, TablesInsert } from "@/database.types";
import AddressForm, { AddressFormRef } from "@/app/components/AddressForm";
import { Coordinates } from "@/app/types";

type Truck = Tables<"trucks"> & {
  addresses?: Tables<"addresses">;
};

type Event = Tables<"events"> & {
  addresses?: Tables<"addresses">;
};

interface TruckFormData {
  name: string;
  type: string;
  capacity: string;
  isAvailable: boolean;
  address: string;
  packingList: string[];
}

export default function EditTruckPage(): ReactElement {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const addressFormRef = useRef<AddressFormRef>(null);

  const [truck, setTruck] = useState<Truck | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [coordinates, setCoordinates] = useState<Coordinates | undefined>();
  const [addressFormData, setAddressFormData] = useState<{
    streetNumber: string;
    streetName: string;
    direction: string;
    city: string;
    postalCode: string;
  } | null>(null);

  const [formData, setFormData] = useState<TruckFormData>({
    name: "",
    type: "",
    capacity: "",
    isAvailable: true,
    address: "",
    packingList: [],
  });

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
        const { data, error } = await supabase
          .from("trucks")
          .select(
            `
            *,
            addresses (*)
          `
          )
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching truck:", error);
          setError("Failed to load truck details");
          return;
        }

        if (data) {
          setTruck(data);
          setFormData({
            name: data.name || "",
            type: data.type || "",
            capacity: data.capacity || "",
            isAvailable: data.is_available ?? true,
            address: data.addresses?.street || "",
            packingList: data.packing_list || [],
          });

          // Set address form data if available
          if (data.addresses) {
            setAddressFormData({
              streetNumber: "",
              streetName: "",
              direction: "None",
              city: data.addresses.city || "Calgary",
              postalCode: data.addresses.postal_code || "",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching truck:", error);
        setError("Failed to load truck details");
      } finally {
        setLoading(false);
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
        const { data, error } = await supabase
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
        setEvents(data || []);
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
    setError("");
    setSuccess("");

    if (!truck) return;

    // Validate address
    const isAddressValid = addressFormRef.current?.validate() ?? false;
    if (!isAddressValid) {
      setError("Please enter a valid address.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Update or create address
      let addressId = truck.address_id;

      if (truck.address_id) {
        // Update existing address
        const { error: addressError } = await supabase
          .from("addresses")
          .update({
            street: formData.address,
            city: addressFormData?.city || "Calgary",
            province: "Alberta",
            postal_code: addressFormData?.postalCode || "",
            country: "Canada",
            latitude: coordinates?.latitude?.toString() ?? null,
            longitude: coordinates?.longitude?.toString() ?? null,
          })
          .eq("id", truck.address_id);

        if (addressError) {
          setError(`Failed to update address: ${addressError.message}`);
          setIsSubmitting(false);
          return;
        }
      } else {
        // Create new address
        const addressInsert: TablesInsert<"addresses"> = {
          street: formData.address,
          city: addressFormData?.city || "Calgary",
          province: "Alberta",
          postal_code: addressFormData?.postalCode || "",
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
          setError(`Failed to create address: ${addressError.message}`);
          setIsSubmitting(false);
          return;
        }

        addressId = newAddress.id;
      }

      // Update truck
      const truckUpdate: TablesInsert<"trucks"> = {
        name: formData.name,
        type: formData.type,
        capacity: formData.capacity,
        address_id: addressId,
        is_available: formData.isAvailable,
        packing_list:
          formData.packingList.length > 0 ? formData.packingList : null,
      };

      const { error: truckError } = await supabase
        .from("trucks")
        .update(truckUpdate)
        .eq("id", id);

      if (truckError) {
        setError(`Failed to update truck: ${truckError.message}`);
        setIsSubmitting(false);
        return;
      }

      setSuccess("Truck updated successfully!");
      setTimeout(() => {
        router.push("/trucks");
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-500">Loading truck details...</p>
      </div>
    );
  }

  if (!truck) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-500">Truck not found</p>
      </div>
    );
  }

  return (
    <div className="edit-truck-page">
      <div className="flex justify-between items-center mb-6">
        <button className="button" onClick={() => router.back()}>
          &larr; Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
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
            required
          />
        </div>

        {/* Type */}
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

        {/* Availability */}
        <div className="input-group">
          <label className="flex items-center space-x-2">
            <span className="input-label">Available</span>
            <input
              type="checkbox"
              name="isAvailable"
              checked={formData.isAvailable}
              onChange={handleChange}
              className="rounded"
            />
          </label>
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

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? "Updating..." : "Save Changes"}
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

      {/* Upcoming Events */}
      <section className="mt-8">
        <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
        {events.length > 0 ? (
          <div className="grid gap-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="event-card bg-white p-4 rounded-lg shadow border"
              >
                <h3 className="text-lg font-semibold">{event.title}</h3>
                <p className="mb-1">
                  <strong>Date:</strong>{" "}
                  {new Date(event.start_date).toLocaleDateString()}
                </p>
                <p className="mb-1">
                  <strong>Time:</strong>{" "}
                  {new Date(event.start_date).toLocaleTimeString()} -{" "}
                  {new Date(event.end_date).toLocaleTimeString()}
                </p>
                <p className="mb-1">
                  <strong>Location:</strong>{" "}
                  {event.addresses?.street || "No address"}
                </p>
                {event.description && (
                  <p className="text-sm text-gray-600">{event.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No upcoming events for this truck.</p>
        )}
      </section>
    </div>
  );
}
