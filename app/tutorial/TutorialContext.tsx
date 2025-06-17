"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target: string;
  position: "top" | "bottom" | "left" | "right";
}

interface TutorialContextType {
  isActive: boolean;
  currentStep: number;
  steps: TutorialStep[];
  startTutorial: () => void;
  endTutorial: () => void;
  nextStep: () => void;
  previousStep: () => void;
  skipTutorial: () => void;
}

const TutorialContext = createContext<TutorialContextType | undefined>(
  undefined
);

// Common tutorial steps for all pages
const commonSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to YYC Food Trucks! 👋",
    content:
      'This guide will help you learn how to use our scheduling system. Click "Next" to continue, or "Skip" if you want to explore on your own. You can always restart the tutorial by clicking the help button in the footer.',
    target: "body",
    position: "bottom",
  },
  {
    id: "back-to-dashboard",
    title: "Back to Dashboard 🏠",
    content:
      "To return to the main dashboard from any page, click the 'YYC Food Trucks' logo in the top-left corner of the page. This will take you back to your main control center where you can access all features.",
    target: ".header-logo, .logo, header a[href='/']",
    position: "bottom",
  },
];

// Page-specific tutorial steps
export const pageTutorials: Record<string, TutorialStep[]> = {
  "/": [
    {
      id: "home-welcome",
      title: "Welcome to Your Dashboard 🏠",
      content:
        "This is your main control center. From here, you can access all the important features of the system. Let's take a tour of what you can do!",
      target: ".landing-main",
      position: "bottom",
    },
    {
      id: "main-navigation",
      title: "Main Navigation Buttons 🧭",
      content:
        "These are your main navigation buttons. Each one takes you to a different part of the system. Let's go through each one!",
      target: ".landing-links",
      position: "bottom",
    },
    {
      id: "schedule-button",
      title: "Schedule Button 📅",
      content:
        "Click this button to view and manage your team's work schedule. Here you can see who's working when and create new shifts.",
      target: '.landing-link[href="/schedule"]',
      position: "right",
    },
    {
      id: "employees-button",
      title: "Employees Button 👥",
      content:
        "This button takes you to your employee management page. Here you can add new staff, view employee details, and manage their information.",
      target: '.landing-link[href="/employees"]',
      position: "right",
    },
    {
      id: "events-button",
      title: "Events Button 🎉",
      content:
        "Click here to manage your food truck events. You can create new events, view upcoming events, and assign staff to events.",
      target: '.landing-link[href="/events"]',
      position: "right",
    },
    {
      id: "trucks-button",
      title: "Trucks Button 🚚",
      content:
        "This button takes you to your truck management page. Here you can add new trucks, view your fleet, and manage truck details.",
      target: '.landing-link[href="/trucks"]',
      position: "right",
    },
    {
      id: "timeoff-button",
      title: "Time-Off Button 🌴",
      content:
        "Click here to manage time-off requests from your staff. You can approve or deny requests and view upcoming time off.",
      target: '.landing-link[href="/requests"]',
      position: "right",
    },
    {
      id: "upcoming-events",
      title: "Upcoming Events Section 📅",
      content:
        "This section shows your next 5 upcoming events. Each card shows the event name, date, and location. Click on an event to see more details.",
      target: '[data-section="upcoming-events"]',
      position: "bottom",
    },
    {
      id: "timeoff-requests",
      title: "Time-Off Requests Section 🌴",
      content:
        "Here you can see the next 3 time-off requests from your staff. Each card shows the type of request, dates, and reason. Click to approve or deny requests.",
      target: '[data-section="timeoff-requests"]',
      position: "bottom",
    },
    {
      id: "navigation-tips",
      title: "Quick Tips 💡",
      content:
        "Hover over any button to see it highlight. The help button in the footer can restart this tutorial anytime you need it. Each section updates automatically with the latest information.",
      target: ".landing-container",
      position: "bottom",
    },
  ],
  "/employees": [
    {
      id: "employee-list",
      title: "Employee List 👥",
      content:
        "This is where you can see all your employees. Each card shows an employee's name, role, and contact information. You can click on a card to see more details.",
      target: ".employee-list",
      position: "bottom",
    },
    {
      id: "employee-filters",
      title: "Filter Employees 🔍",
      content:
        "Use these buttons to find employees by their role: Drivers (deliver food), Servers (serve customers), or Admins (manage the business). Click a role to see only those employees.",
      target: ".filter-buttons",
      position: "bottom",
    },
    {
      id: "add-employee",
      title: "Add New Employee ➕",
      content:
        'To add a new employee, click the "New Employee" button in the sidebar. Important tips for the form: 1) Don\'t add number suffixes to numbered streets, 2) Postal code is optional, 3) Make sure to include the street number, 4) Include "Calgary" if not automatically filled.',
      target: ".sidebar",
      position: "right",
    },
    {
      id: "employee-actions",
      title: "Employee Actions ✏️",
      content:
        "Each employee card has two buttons: Edit (pencil icon) to update their information, and Delete (trash icon) to remove them from the system. Be careful with the delete button - this action cannot be undone!",
      target: ".employee-card",
      position: "bottom",
    },
  ],
  "/events": [
    {
      id: "event-list",
      title: "Event List 📅",
      content:
        "Here you can see all your upcoming events. Each event card shows the event name, date, time, and location. Click on a card to see all the details and assigned staff.",
      target: ".event-list",
      position: "bottom",
    },
    {
      id: "create-event",
      title: "Create New Event ➕",
      content:
        'To create a new event, click the "New Event" button in the sidebar. Important tips: 1) Don\'t add number suffixes to streets (e.g., use "23rd Ave" not "23rd Ave rd"), 2) Postal code is optional, 3) Make sure to include the street number, 4) Include "Calgary" if not automatically filled.',
      target: ".sidebar",
      position: "right",
    },
    {
      id: "event-details",
      title: "Event Details 📝",
      content:
        "When creating an event, you'll need to fill in: Event name, date and time, location, number of servers needed, and contact information. The system will help you find the best staff for the event based on location.",
      target: ".event-form",
      position: "bottom",
    },
    {
      id: "truck-selection",
      title: "Select Trucks 🚚",
      content:
        "Choose which food trucks will be at the event. You can select multiple trucks. Each truck card shows the truck name and type. The system will help ensure you have enough staff for each truck.",
      target: ".truck-list",
      position: "bottom",
    },
  ],
  "/schedule": [
    {
      id: "calendar-view",
      title: "Calendar View 📅",
      content:
        "This calendar shows all your events and shifts. You can navigate between months using the arrows. Each day shows how many events are scheduled. Click on a day to see the detailed schedule.",
      target: ".monthly-schedule",
      position: "bottom",
    },
    {
      id: "navigation-buttons",
      title: "Navigation Buttons 🔄",
      content:
        "Use these buttons to navigate through your schedule. The arrows let you move forward or backward, and the Today button quickly takes you to the current date.",
      target: ".navigation-container",
      position: "bottom",
    },
    {
      id: "previous-button",
      title: "Previous Button ⬅️",
      content:
        "Click this button to go back to the previous day, week, or month depending on your current view.",
      target: ".navigation-container button:first-child",
      position: "bottom",
    },
    {
      id: "today-button",
      title: "Today Button 📍",
      content:
        "Click this button to quickly jump to today's date in your current view.",
      target: ".navigation-container button:nth-child(2)",
      position: "bottom",
    },
    {
      id: "next-button",
      title: "Next Button ➡️",
      content:
        "Click this button to advance to the next day, week, or month depending on your current view.",
      target: ".navigation-container button:last-child",
      position: "bottom",
    },
    {
      id: "view-options",
      title: "View Options 👁️",
      content:
        "You can switch between different views: Daily (shows detailed schedule for one day), Weekly (shows a week at a glance), and Monthly (shows the entire month). Use these buttons to switch between views.",
      target: ".view-toggle-container",
      position: "bottom",
    },
    {
      id: "daily-view-button",
      title: "Daily View Button 📆",
      content:
        "Click this button to see a detailed timeline of all events and shifts for a specific day.",
      target: ".view-toggle-button:nth-child(1)",
      position: "bottom",
    },
    {
      id: "weekly-view-button",
      title: "Weekly View Button 📅",
      content:
        "Click this button to see all events and shifts for the entire week.",
      target: ".view-toggle-button:nth-child(2)",
      position: "bottom",
    },
    {
      id: "monthly-view-button",
      title: "Monthly View Button 📊",
      content:
        "Click this button to see a high-level overview of your entire month.",
      target: ".view-toggle-button:nth-child(3)",
      position: "bottom",
    },
    {
      id: "create-shift",
      title: "Create Shift ➕",
      content:
        'To create a new shift, click the "New Shift" button. You\'ll need to select: the date, time, location, and which employees will work. The system will help you find available staff.',
      target: ".sidebar",
      position: "right",
    },
    {
      id: "shift-management",
      title: "Manage Shifts 👥",
      content:
        "You can view and edit shifts by clicking on them in any view. This lets you: change the time, add or remove staff, or cancel the shift if needed. The changes will be reflected across all views.",
      target: ".shift-list",
      position: "bottom",
    },
  ],
  "/trucks": [
    {
      id: "truck-list",
      title: "Truck List 🚚",
      content:
        "Here you can see all your food trucks. Each card shows the truck name, type, and current status. Click on a truck to see its full details and maintenance history.",
      target: ".truck-list",
      position: "bottom",
    },
    {
      id: "truck-filters",
      title: "Filter Trucks 🔍",
      content:
        "Use these buttons to find trucks by type: Food Trucks (main meals), Beverage Trucks (drinks), or Dessert Trucks (sweets). Click a type to see only those trucks.",
      target: ".filter-buttons",
      position: "bottom",
    },
    {
      id: "truck-details",
      title: "Truck Details 📝",
      content:
        "Each truck card shows: the truck name, type, capacity, and current status. You can click the edit button to update information or the delete button to remove a truck from the system.",
      target: ".truck-card",
      position: "bottom",
    },
  ],
};

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentPath, setCurrentPath] = useState("/");

  // Get the appropriate tutorial steps for the current page
  const getCurrentSteps = () => {
    const pageSteps = pageTutorials[currentPath] || [];
    return [...commonSteps, ...pageSteps];
  };

  const startTutorial = () => {
    setCurrentPath(window.location.pathname);
    setIsActive(true);
    setCurrentStep(0);
  };

  const endTutorial = () => {
    setIsActive(false);
    setCurrentStep(0);
  };

  const nextStep = () => {
    const steps = getCurrentSteps();
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      endTutorial();
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    endTutorial();
  };

  const value = {
    isActive,
    currentStep,
    steps: getCurrentSteps(),
    startTutorial,
    endTutorial,
    nextStep,
    previousStep,
    skipTutorial,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
}

export function useTutorial() {
  const context = useContext(TutorialContext);
  if (context === undefined) {
    throw new Error("useTutorial must be used within a TutorialProvider");
  }
  return context;
}
