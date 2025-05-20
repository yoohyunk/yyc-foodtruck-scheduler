'use client';

import { useState, useEffect, FormEvent, ChangeEvent, ReactElement } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Truck {
  id: number;
  name: string;
  type: string;
  capacity: string;
  status: string;
  driver?: {
    name: string;
  };
  location: string;
}

interface Event {
  id: number;
  name: string;
  date: string;
  location: string;
  time: string;
  trucks?: number[];
}

interface FormData {
  name: string;
  type: string;
  capacity: string;
  status: string;
  driver: string;
  location: string;
}

export default function EditTruckPage(): ReactElement {
  const { id } = useParams();
  const router = useRouter();
  const [truck, setTruck] = useState<Truck | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: '',
    capacity: '',
    status: '',
    driver: '',
    location: '',
  });

  // Fetch truck details
  useEffect(() => {
    fetch('/trucks.json')
      .then((response) => response.json())
      .then((data: Truck[]) => {
        const truckData = data.find((t) => t.id === parseInt(id as string));
        if (truckData) {
          setTruck(truckData);
          setFormData({
            name: truckData.name || '',
            type: truckData.type || '',
            capacity: truckData.capacity || '',
            status: truckData.status || '',
            driver: truckData.driver ? truckData.driver.name : '',
            location: truckData.location || '',
          });
        } else {
          console.error('Truck not found');
        }
      })
      .catch((error) => console.error('Error fetching truck:', error));
  }, [id]);

  // Fetch events associated with the truck
  useEffect(() => {
    fetch('/events.json')
      .then((response) => response.json())
      .then((data: Event[]) => {
        const truckEvents = data.filter((event) => event.trucks && event.trucks.includes(parseInt(id as string)));
        setEvents(truckEvents);
      })
      .catch((error) => console.error('Error fetching events:', error));
  }, [id]);

  // Handle form input changes
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Simulate saving the updated truck data
    console.log('Updated Truck Data:', formData);
    alert('Truck information updated successfully!');
    router.push('/trucks');
  };

  if (!truck) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-gray-500">Loading truck details...</p>
      </div>
    );
  }

  return (
    <div className="edit-truck-page">
      <button
        className="button mb-4"
        onClick={() => router.back()}
      >
        &larr; Back
      </button>

      <h1 className="text-2xl font-bold mb-4">Edit Truck</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label htmlFor="name" className="block font-medium">
            Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="input-field"
            required
          />
        </div>

        {/* Type */}
        <div>
          <label htmlFor="type" className="block font-medium">
            Type
          </label>
          <select
            id="type"
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className="input-field"
            required
          >
            <option value="">Select Type</option>
            <option value="Food Truck">Food Truck</option>
            <option value="Beverage Truck">Beverage Truck</option>
            <option value="Dessert Truck">Dessert Truck</option>
            <option value="Holiday Truck">Holiday Truck</option>
          </select>
        </div>

        {/* Capacity */}
        <div>
          <label htmlFor="capacity" className="block font-medium">
            Capacity
          </label>
          <input
            type="number"
            id="capacity"
            name="capacity"
            value={formData.capacity}
            onChange={handleInputChange}
            className="input-field"
            required
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="input-field"
            required
          >
            <option value="">Select Status</option>
            <option value="Available">Available</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </div>

        {/* Driver */}
        <div>
          <label htmlFor="driver" className="block font-medium">
            Driver
          </label>
          <input
            type="text"
            id="driver"
            name="driver"
            value={formData.driver}
            onChange={handleInputChange}
            className="input-field"
            placeholder="Enter driver name"
          />
        </div>

        {/* Location */}
        <div>
          <label htmlFor="location" className="block font-medium">
            Location
          </label>
          <select
            id="location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            className="input-field"
            required
          >
            <option value="">Select Location</option>
            <option value="NE">NE</option>
            <option value="SE">SE</option>
          </select>
        </div>

        <button
          type="submit"
          className="button bg-primary-medium text-white py-2 px-4 rounded-lg hover:bg-primary-dark"
        >
          Save Changes
        </button>
      </form>

      {/* Upcoming Events */}
      <section className="mt-8">
        <h2 className="text-xl font-bold mb-4">Upcoming Events</h2>
        {events.length > 0 ? (
          <div className="grid gap-4">
            {events.map((event) => (
              <div key={event.id} className="event-card bg-white p-4 rounded shadow">
                <h3 className="text-lg font-semibold">{event.name}</h3>
                <p><strong>Date:</strong> {event.date}</p>
                <p><strong>Location:</strong> {event.location}</p>
                <p><strong>Time:</strong> {event.time}</p>
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