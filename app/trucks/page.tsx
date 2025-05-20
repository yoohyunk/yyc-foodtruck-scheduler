'use client';

import { useState, useEffect, ReactElement } from 'react';
import { useRouter } from 'next/navigation';

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

export default function Trucks(): ReactElement {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [filteredTrucks, setFilteredTrucks] = useState<Truck[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const router = useRouter();

  // Fetch trucks from trucks.json
  useEffect(() => {
    fetch('/trucks.json')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data: Truck[]) => {
        setTrucks(data);
        setFilteredTrucks(data);
      })
      .catch((error) => console.error('Error fetching trucks:', error));
  }, []);

  // Filter trucks based on the active filter
  useEffect(() => {
    if (activeFilter === 'All') {
      setFilteredTrucks(trucks);
    } else {
      setFilteredTrucks(trucks.filter((truck) => truck.type === activeFilter));
    }
  }, [activeFilter, trucks]);

  return (
    <div className="trucks-page">
      <h2 className="text-2xl mb-4">Truck Management</h2>

      {/* Filter Buttons */}
      <div className="filter-buttons grid">
        <button
          className={`button ${activeFilter === 'All' ? 'bg-primary-dark text-white' : 'bg-gray-200 text-primary-dark'}`}
          onClick={() => setActiveFilter('All')}
        >
          All
        </button>
        <button
          className={`button ${activeFilter === 'Food Truck' ? 'bg-primary-dark text-white' : 'bg-gray-200 text-primary-dark'}`}
          onClick={() => setActiveFilter('Food Truck')}
        >
          Food Trucks
        </button>
        <button
          className={`button ${activeFilter === 'Beverage Truck' ? 'bg-primary-dark text-white' : 'bg-gray-200 text-primary-dark'}`}
          onClick={() => setActiveFilter('Beverage Truck')}
        >
          Beverage Trucks
        </button>
        <button
          className={`button ${activeFilter === 'Dessert Truck' ? 'bg-primary-dark text-white' : 'bg-gray-200 text-primary-dark'}`}
          onClick={() => setActiveFilter('Dessert Truck')}
        >
          Dessert Trucks
        </button>
      </div>

      {/* Truck List */}
      <div className="truck-list grid gap-4">
        {filteredTrucks.length > 0 ? (
          filteredTrucks.map((truck) => (
            <div key={truck.id} className="truck-card bg-white p-4 rounded shadow relative">
              {/* Edit Button */}
              <button
                className="edit-button"
                onClick={() => router.push(`/trucks/${truck.id}`)}
                title="Edit Truck"
              >
                ✏️
              </button>

              <h3 className="text-lg font-semibold">{truck.name}</h3>
              <p><strong>Type:</strong> {truck.type}</p>
              <p><strong>Capacity:</strong> {truck.capacity}</p>
              <p><strong>Status:</strong>{' '}
                <span className={truck.status === 'Available' ? 'text-green-500' : 'text-red-500'}>
                  {truck.status}
                </span>
              </p>
              <p><strong>Driver:</strong> {truck.driver ? truck.driver.name : 'No driver assigned'}</p>
              <p><strong>Location:</strong> {truck.location}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No trucks found.</p>
        )}
      </div>
    </div>
  );
}