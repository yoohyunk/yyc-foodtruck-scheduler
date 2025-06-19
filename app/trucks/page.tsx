"use client";

import { useState, useEffect, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { Truck } from "../types";
import { useTutorial } from "../tutorial/TutorialContext";
import { TutorialHighlight } from "../components/TutorialHighlight";

export default function Trucks(): ReactElement {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [filteredTrucks, setFilteredTrucks] = useState<Truck[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>("All");
  const router = useRouter();
  const { shouldHighlight } = useTutorial();

  // Fetch trucks from trucks.json
  useEffect(() => {
    fetch("/trucks.json")
      .then((response) => {
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data: Truck[]) => {
        setTrucks(data);
        setFilteredTrucks(data);
      })
      .catch((error) => console.error("Error fetching trucks:", error));
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
    <div className="trucks-page">
      <h2 className="text-2xl mb-4">Truck Management</h2>

      {/* Filter Buttons */}
      <TutorialHighlight
        isHighlighted={shouldHighlight(".filter-buttons")}
        className="filter-buttons grid"
      >
        <button
          className={`button ${activeFilter === "All" ? "bg-primary-dark text-white" : "bg-gray-200 text-primary-dark"}`}
          onClick={() => setActiveFilter("All")}
        >
          All
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
      </TutorialHighlight>

      {/* Truck List */}
      <TutorialHighlight
        isHighlighted={shouldHighlight(".truck-list")}
        className="truck-list grid gap-4"
      >
        {filteredTrucks.length > 0 ? (
          filteredTrucks.map((truck, index) => (
            <TutorialHighlight
              key={truck.id}
              isHighlighted={shouldHighlight(`.truck-card:nth-child(${index + 1})`)}
              className="truck-card bg-white p-4 rounded shadow relative"
            >
              {/* Edit Button */}
              <TutorialHighlight
                isHighlighted={shouldHighlight(`.truck-card:nth-child(${index + 1}) button[title='Edit Truck']`)}
              >
                <button
                  className="edit-button"
                  onClick={() => router.push(`/trucks/${truck.id}`)}
                  title="Edit Truck"
                >
                  ✏️
                </button>
              </TutorialHighlight>

              <h3 className="text-lg font-semibold">{truck.name}</h3>
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
                <strong>Location:</strong> {truck.location}
              </p>
            </TutorialHighlight>
          ))
        ) : (
          <p className="text-gray-500">No trucks found.</p>
        )}
      </TutorialHighlight>
    </div>
  );
}
