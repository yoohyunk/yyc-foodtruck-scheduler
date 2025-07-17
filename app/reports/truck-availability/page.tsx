"use client";

import React, { useState, useEffect, ReactElement } from "react";
import { FiTruck, FiCalendar, FiArrowLeft } from "react-icons/fi";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { trucksApi } from "@/lib/supabase/trucks";
import { eventsApi } from "@/lib/supabase/events";
import { Truck, Event } from "../../types";
import { useTutorial } from "../../tutorial/TutorialContext";
import { TutorialHighlight } from "../../components/TutorialHighlight";

interface TruckAvailabilityData {
  truck: Truck;
  events: Event[];
  isAvailable: boolean;
  availabilityReason: string;
}

export default function TruckAvailabilityReport(): ReactElement {
  const { isAdmin } = useAuth();
  const { shouldHighlight } = useTutorial();
  const [selectedWeek, setSelectedWeek] = useState<string>("");
  const [trucks, setTrucks] = useState<TruckAvailabilityData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get current week's Monday as default
  useEffect(() => {
    const today = new Date();
    const monday = new Date(today);
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    monday.setDate(diff);
    setSelectedWeek(monday.toISOString().split('T')[0]);
  }, []);

  const fetchTruckAvailability = async () => {
    if (!selectedWeek) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch trucks with addresses relation
      const allTrucks = await trucksApi.getAllTrucks(); // Ensure this returns addresses as well
      
      // Calculate week start and end dates
      const weekStart = new Date(selectedWeek);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      const truckData: TruckAvailabilityData[] = [];

      for (const truck of allTrucks) {
        // Check truck availability for this week
        const availability = await trucksApi.checkTruckAvailability(
          truck.id,
          weekStart.toISOString().split('T')[0],
          weekEnd.toISOString().split('T')[0]
        );

        // Get events for this week (we'll need to get all events and filter)
        const allEvents = await eventsApi.getAllEvents();
        const weekEvents = allEvents.filter(event => {
          const eventStart = new Date(event.start_date);
          const eventEnd = new Date(event.end_date);
          return eventStart <= weekEnd && eventEnd >= weekStart;
        });

        // For now, we'll assume events are assigned to trucks based on truck assignments
        // In a real implementation, you'd have a truck_event_assignment table
        const truckEvents: Event[] = []; // This would be populated based on actual truck assignments

        truckData.push({
          truck,
          events: truckEvents,
          isAvailable: availability.isAvailable,
          availabilityReason: availability.reason,
        });
      }

      setTrucks(truckData);
    } catch (err) {
      console.error("Error fetching truck availability:", err);
      setError("Failed to load truck availability data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedWeek) {
      fetchTruckAvailability();
    }
  }, [selectedWeek]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getWeekRange = () => {
    if (!selectedWeek) return "";
    const start = new Date(selectedWeek);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${formatDate(start.toISOString())} - ${formatDate(end.toISOString())}`;
  };

  const getTruckTypeColor = (type: string) => {
    switch (type) {
      case "Food Truck":
        return "bg-orange-100 text-orange-800";
      case "Beverage Truck":
        return "bg-blue-100 text-blue-800";
      case "Dessert Truck":
        return "bg-pink-100 text-pink-800";
      case "Holiday Truck":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isAdmin) {
    return (
      <div className="truck-availability-report">
        <h2 className="text-2xl text-primary-dark mb-4">Truck Availability Report</h2>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">
            Access denied. Only administrators can view reports.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="truck-availability-report">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Link href="/reports" className="mr-4 text-primary-dark hover:text-primary-medium">
            <FiArrowLeft className="w-5 h-5" />
          </Link>
          <h2 className="text-2xl text-primary-dark">Truck Availability Report</h2>
        </div>
        <p className="text-gray-600">
          View truck assignments and availability status for the selected week.
        </p>
      </div>

      {/* Week Selection */}
      <TutorialHighlight isHighlighted={shouldHighlight(".week-selector")}>
        <div className="mb-6 p-4 bg-white rounded-lg shadow">
          <label htmlFor="week-selector" className="block text-sm font-medium text-gray-700 mb-2">
            Select Week (Monday)
          </label>
          <input
            type="date"
            id="week-selector"
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="input-field"
          />
          {selectedWeek && (
            <p className="mt-2 text-sm text-gray-600">
              Week of: {getWeekRange()}
            </p>
          )}
        </div>
      </TutorialHighlight>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dark"></div>
          <span className="ml-2 text-gray-600">Loading truck data...</span>
        </div>
      ) : (
        <div className="grid gap-4">
          {trucks.map((truckData) => (
            <div key={truckData.truck.id} className="employee-card bg-white p-6 rounded shadow">
              {/* Truck Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <FiTruck className="text-gray-400 mr-3 text-lg" />
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">
                      {truckData.truck.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTruckTypeColor(truckData.truck.type)}`}>
                        {truckData.truck.type}
                      </span>
                      <span className="text-sm text-gray-600">
                        Capacity: {truckData.truck.capacity}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                      truckData.isAvailable
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {truckData.isAvailable ? "Available" : "Unavailable"}
                  </span>
                </div>
              </div>

              {/* Availability Status */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Status:</strong> {truckData.availabilityReason}
                </p>
              </div>

              {/* Events */}
              {truckData.events.length > 0 ? (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                    <FiCalendar className="mr-2" />
                    Scheduled Events
                  </h4>
                  <div className="space-y-2">
                    {truckData.events.map((event) => (
                      <div key={event.id} className="p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="font-medium text-blue-800">
                          {event.title || "Untitled Event"}
                        </p>
                        <p className="text-sm text-blue-600">
                          {formatDate(event.start_date)} - {formatDate(event.end_date)}
                        </p>
                        <p className="text-xs text-blue-500">
                          Status: {event.status || "Scheduled"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-green-50 rounded border border-green-200">
                  <p className="text-sm text-green-700">
                    No events scheduled for this truck during this week.
                  </p>
                </div>
              )}

              {/* Truck Details */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Location:</span>
                    <span className="ml-2">
                      {(truckData.truck as any).addresses?.street || "No address"}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">General Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      truckData.truck.is_available 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {truckData.truck.is_available ? "Available" : "Unavailable"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {!isLoading && trucks.length > 0 && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-2">Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-blue-600">Total Trucks:</span>
              <span className="ml-2 font-medium">{trucks.length}</span>
            </div>
            <div>
              <span className="text-green-600">Available:</span>
              <span className="ml-2 font-medium">
                {trucks.filter(t => t.isAvailable).length}
              </span>
            </div>
            <div>
              <span className="text-red-600">Unavailable:</span>
              <span className="ml-2 font-medium">
                {trucks.filter(t => !t.isAvailable).length}
              </span>
            </div>
            <div>
              <span className="text-blue-600">With Events:</span>
              <span className="ml-2 font-medium">
                {trucks.filter(t => t.events.length > 0).length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 