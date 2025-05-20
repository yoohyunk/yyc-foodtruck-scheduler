'use client';
import { useState, useEffect, ReactElement } from 'react';
import { useRouter } from 'next/navigation';

interface Employee {
  id: number;
  name: string;
  role: string;
  address: string;
  email: string;
  phone: string;
  wage: string;
  isAvailable: boolean;
  availability: string[];
}

export default function Employees(): ReactElement {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const router = useRouter();

  // Fetch employees from employee.json
  useEffect(() => {
    fetch('/employee.json')
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data: Employee[]) => {
        setEmployees(data);
        setFilteredEmployees(data);
      })
      .catch((error) => console.error('Error fetching employees:', error));
  }, []);

  // Filter employees based on the active filter
  useEffect(() => {
    if (activeFilter === 'All') {
      setFilteredEmployees(employees);
    } else {
      setFilteredEmployees(employees.filter((employee) => employee.role === activeFilter));
    }
  }, [activeFilter, employees]);

  return (
    <div className="employees-page">
      <h2 className="text-2xl mb-4">Employee Management</h2>

      {/* Filter Buttons */}
      <div className="filter-buttons grid">
        <button
          className={`button ${activeFilter === 'All' ? 'bg-primary-dark text-white' : 'bg-gray-200 text-primary-dark'}`}
          onClick={() => setActiveFilter('All')}
        >
          All
        </button>
        <button
          className={`button ${activeFilter === 'Driver' ? 'bg-primary-dark text-white' : 'bg-gray-200 text-primary-dark'}`}
          onClick={() => setActiveFilter('Driver')}
        >
          Drivers
        </button>
        <button
          className={`button ${activeFilter === 'Server' ? 'bg-primary-dark text-white' : 'bg-gray-200 text-primary-dark'}`}
          onClick={() => setActiveFilter('Server')}
        >
          Servers
        </button>
        <button
          className={`button ${activeFilter === 'Admin' ? 'bg-primary-dark text-white' : 'bg-gray-200 text-primary-dark'}`}
          onClick={() => setActiveFilter('Admin')}
        >
          Admins
        </button>
      </div>

      {/* Employee List */}
      <div className="employee-list grid gap-4">
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map((employee) => (
            <div key={employee.id} className="employee-card bg-white p-4 rounded shadow relative">
              {/* Edit Button */}
              <button
                className="edit-button"
                onClick={() => router.push(`/employees/${employee.id}`)}
                title="Edit Employee"
              >
                ✏️
              </button>

              <h3 className="text-lg font-semibold">{employee.name}</h3>
              <p><strong>Role:</strong> {employee.role}</p>
              <p><strong>Address:</strong> {employee.address}</p>
              <p><strong>Email:</strong> <a href={`mailto:${employee.email}`} className="text-blue-500">{employee.email}</a></p>
              <p><strong>Phone:</strong> {employee.phone}</p>
              <p><strong>Wage:</strong> ${employee.wage}/hr</p>
              <p>
                <strong>Status:</strong>{' '}
                <span className={employee.isAvailable ? 'text-green-500' : 'text-red-500'}>
                  {employee.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </p>
              <p>
                <strong>Availability:</strong>{' '}
                {employee.availability && employee.availability.length > 0 ? (
                  <span className="text-primary-medium">
                    {employee.availability.join(', ')}
                  </span>
                ) : (
                  <span className="text-gray-500">Not available</span>
                )}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No employees found.</p>
        )}
      </div>
    </div>
  );
}