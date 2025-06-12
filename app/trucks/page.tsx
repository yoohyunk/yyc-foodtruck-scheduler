"use client";

import { useState, useEffect, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Truck } from "../types";

export default function Trucks(): ReactElement {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [filteredTrucks, setFilteredTrucks] = useState<Truck[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const router = useRouter();

  // Fetch trucks from trucks.json
  useEffect(() => {
    fetch("/trucks.json")
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data: Truck[]) => {
        console.log("Fetched trucks:", data); // Debug log
        setTrucks(data);
        setFilteredTrucks(data);
      })
      .catch((error) => {
        console.error("Error fetching trucks:", error);
        alert("Error loading trucks. Please try again.");
      });
  }, []);

  // Filter trucks based on the active filter
  useEffect(() => {
    if (activeFilter === "All") {
      setFilteredTrucks(trucks);
    } else {
      setFilteredTrucks(trucks.filter((truck) => truck.type === activeFilter));
    }
  }, [activeFilter, trucks]);

  return (
    <div className="trucks-page p-4">
      <h2 className="text-2xl font-bold mb-6">Truck Management</h2>

      {/* Filter Buttons */}
      <div className="filter-buttons grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button
          className={`button ${activeFilter === "All" ? "bg-primary-dark text-white" : "bg-gray-200 text-primary-dark"}`}
          onClick={() => setActiveFilter("All")}
        >
          All Trucks
        </button>
        <button
          className={`button ${activeFilter === "Food Truck" ? "bg-primary-dark text-white" : "bg-gray-200 text-primary-dark"}`}
          onClick={() => setActiveFilter("Food Truck")}
        >
          Food Trucks
        </button>
        <button
          className={`button ${activeFilter === "Beverage Truck" ? "bg-primary-dark text-white" : "bg-gray-200 text-primary-dark"}`}
          onClick={() => setActiveFilter("Beverage Truck")}
        >
          Beverage Trucks
        </button>
        <button
          className={`button ${activeFilter === "Dessert Truck" ? "bg-primary-dark text-white" : "bg-gray-200 text-primary-dark"}`}
          onClick={() => setActiveFilter("Dessert Truck")}
        >
          Dessert Trucks
        </button>
      </div>

      {/* Truck List */}
      <div className="truck-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTrucks.length > 0 ? (
          filteredTrucks.map((truck) => (
            <div
              key={truck.id}
              className="truck-card bg-white p-4 rounded-lg shadow-md relative hover:shadow-lg transition-shadow"
            >
              {/* Edit Button */}
              <button
                className="edit-button"
                onClick={() => router.push(`/trucks/${truck.id}`)}
                title="Edit Truck"
              >
                ✏️
              </button>

              <h3 className="text-lg font-semibold mb-2">{truck.name}</h3>
              <div className="space-y-2">
                <p>
                  <strong>Type:</strong> {truck.type}
                </p>
                <p>
                  <strong>Capacity:</strong> {truck.capacity}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <span
                    className={
                      truck.status === "Available"
                        ? "text-green-500"
                        : "text-red-500"
                    }
                  >
                    {truck.status}
                  </span>
                </p>
                <p>
                  <strong>Driver:</strong>{" "}
                  {truck.driver ? truck.driver.name : "No driver assigned"}
                </p>
                <p>
                  <strong>Default Driver:</strong>{" "}
                  {truck.defaultDriver ? truck.defaultDriver.name : "Not set"}
                </p>
                <p>
                  <strong>Location:</strong> {truck.location}
                </p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 col-span-full text-center py-4">
            No trucks found.
          </p>
        )}
      </div>
    </div>
  );
}
