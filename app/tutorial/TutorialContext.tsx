"use client";
import "../globals.css";
import { useState, useEffect } from "react";

import React, {
  createContext,
  useContext,
  useCallback,
  ReactNode,
} from "react";

interface TutorialAutoAction {
  type: string;
  delay: number;
  nextPath?: string;
  waitAfter?: number;
  extra?: Record<string, unknown>;
}

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target: string;
  position: "top" | "bottom" | "left" | "right";
  autoAction?: TutorialAutoAction;
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
  highlightTarget: string | null;
  shouldHighlight: (selector: string) => boolean;
  setPendingStepForNavigation: (stepIndex: number) => void;
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
    target: ".logo.TutorialHighlight",
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
      id: "sidebar-introduction",
      title: "Navigation Sidebar 🧭",
      content:
        "This sidebar contains all your navigation options. It's your main way to move between different sections of the system. Let's explore what each button does!",
      target: ".sidebar",
      position: "right",
    },
    {
      id: "dashboard-button",
      title: "Dashboard Button 🏠",
      content:
        "This button takes you back to the main dashboard. You're currently here! This is where you can see an overview of upcoming events and time-off requests.",
      target: ".sidebar-nav-dashboard",
      position: "right",
    },
    {
      id: "employees-button",
      title: "Employees Button 👥",
      content:
        "Click this button to manage your team. Here you can view all employees, add new staff, edit employee details, and manage their information.",
      target: ".sidebar-nav-employees",
      position: "right",
    },
    {
      id: "add-employee-button",
      title: "Add Employee Button ➕",
      content:
        "Click this button to quickly add a new employee to your team. This will take you to the employee invitation form where you can enter their details.",
      target: ".sidebar-nav-add-employee",
      position: "right",
    },
    {
      id: "events-button",
      title: "Events Button 🎉",
      content:
        "Click here to manage your food truck events. You can view all events, create new ones, and assign staff to events.",
      target: ".sidebar-nav-events",
      position: "right",
    },
    {
      id: "add-shift-button",
      title: "Add Shift Button 📅",
      content:
        "Click this button to quickly create a new work shift. This will take you to the schedule page where you can set up work shifts for your employees.",
      target: ".sidebar-nav-add-shift",
      position: "right",
    },
    {
      id: "add-event-button",
      title: "Add Event Button ➕",
      content:
        'To create a new event, click this button. Important tips: 1) Don\'t add number suffixes to streets (e.g., use "23rd Ave" not "23rd Ave rd"), 2) Postal code is optional, 3) Make sure to include the street number, 4) Include "Calgary" if not automatically filled.',
      target: ".sidebar-nav-add-event",
      position: "right",
    },
    {
      id: "schedule-button",
      title: "Schedule Button 📅",
      content:
        "Click this button to view and manage your team's work schedule. Here you can see who's working when and create new shifts.",
      target: ".sidebar-nav-schedule",
      position: "right",
    },
    {
      id: "trucks-button",
      title: "Trucks Button 🚚",
      content:
        "This button takes you to your truck management page. Here you can add new trucks, view your fleet, and manage truck details.",
      target: ".sidebar-nav-trucks",
      position: "right",
    },
    {
      id: "add-trucks-button",
      title: "Add Trucks Button ➕",
      content:
        "Click this button to add new trucks to your fleet. You can specify the truck type, capacity, and other details.",
      target: ".sidebar-nav-add-trucks",
      position: "right",
    },
    {
      id: "requests-button",
      title: "Requests Button 📋",
      content:
        "Click here to manage time-off requests from your staff. You can approve or deny requests and view upcoming time off.",
      target: ".sidebar-nav-requests",
      position: "right",
    },
    {
      id: "reports-button",
      title: "Reports Button 📊",
      content:
        "This button takes you to the reports section where you can view analytics and reports about your business operations.",
      target: ".sidebar-nav-reports",
      position: "right",
    },
    {
      id: "upcoming-events",
      title: "Upcoming Events Section 📅",
      content:
        "This section shows your next 6 upcoming events. Each card shows the event name, date, and location. Click on an event to see more details.",
      target: ".upcoming-events-highlight",
      position: "bottom",
    },
    {
      id: "timeoff-requests",
      title: "Time-Off Requests Section 🌴",
      content:
        "Here you can see the next 4 time-off requests from your staff. Each card shows the type of request, dates, and reason. Click to approve or deny requests.",
      target: ".timeoff-requests-highlight",
      position: "bottom",
    },
    {
      id: "navigation-tips",
      title: "Quick Tips 💡",
      content:
        "Hover over any sidebar button to see it highlight. The help button in the footer can restart this tutorial anytime you need it. Each section updates automatically with the latest information.",
      target: ".landing-main",
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
        'To add a new employee, click the "Add Employee" button in the sidebar. Important tips for the form: 1) Don\'t add number suffixes to numbered streets, 2) Postal code is optional, 3) Make sure to include the street number, 4) Include "Calgary" if not automatically filled.',
      target: ".sidebar-nav-add-employee",
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
    {
      id: "edit-employee-button",
      title: "Edit Employee Details 📝",
      content:
        "Click the 'Edit' button on any employee card to see all the information about that employee and make changes. This opens the employee details page where you can update their contact information, role, wage, and availability.",
      target: ".employee-card:first-child button[title='Edit Employee']",
      position: "bottom",
      autoAction: {
        type: "click",
        delay: 300,
        nextPath: "/employees/{employeeId}",
        waitAfter: 800,
      },
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
      id: "event-filters",
      title: "Filter Events 🔍",
      content:
        "Use these buttons to filter events by their status: All (shows all events), Pending (events that need staff or trucks assigned), or Scheduled (events that are fully prepared). Click a status to see only those events.",
      target: ".filter-buttons",
      position: "bottom",
    },
    {
      id: "date-filter",
      title: "Date Filter 📅",
      content:
        "Use this date picker to filter events by a specific date. Select any date to see only events scheduled for that day. This helps you focus on events for a particular date.",
      target: ".additional-filters",
      position: "bottom",
    },
    {
      id: "create-event",
      title: "Create New Event ➕",
      content:
        'To create a new event, click the "Add Event" button in the sidebar. Important tips: 1) Don\'t add number suffixes to streets (e.g., use "23rd Ave" not "23rd Ave rd"), 2) Postal code is optional, 3) Make sure to include the street number, 4) Include "Calgary" if not automatically filled.',
      target: ".sidebar-nav-add-event",
      position: "right",
    },
    {
      id: "view-details-button",
      title: "View Event Details 📋",
      content:
        "Click the 'View Details' button on any event card to see all the information about that event, including assigned staff, trucks, and contact details. This opens the event details page where you can make changes.",
      target: ".event-card:first-child .button",
      position: "bottom",
      autoAction: {
        type: "click",
        delay: 800,
        nextPath: "/events/{eventId}",
        waitAfter: 600,
      },
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
      target: ".navigation-container .TutorialHighlight:nth-child(1) button",
      position: "bottom",
      autoAction: { type: "click", delay: 800, waitAfter: 600 },
    },
    {
      id: "today-button",
      title: "Today Button 📍",
      content:
        "Click this button to quickly jump to today's date in your current view.",
      target: ".navigation-container .TutorialHighlight:nth-child(2) button",
      position: "bottom",
      autoAction: { type: "click", delay: 800, waitAfter: 600 },
    },
    {
      id: "next-button",
      title: "Next Button ➡️",
      content:
        "Click this button to advance to the next day, week, or month depending on your current view.",
      target: ".navigation-container .TutorialHighlight:nth-child(3) button",
      position: "bottom",
      autoAction: { type: "click", delay: 800, waitAfter: 600 },
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
      target: ".view-toggle-container .TutorialHighlight:nth-child(1) button",
      position: "bottom",
      autoAction: { type: "click", delay: 800, waitAfter: 600 },
    },
    {
      id: "weekly-view-button",
      title: "Weekly View Button 📅",
      content:
        "Click this button to see all events and shifts for the entire week.",
      target: ".view-toggle-container .TutorialHighlight:nth-child(2) button",
      position: "bottom",
      autoAction: { type: "click", delay: 800, waitAfter: 600 },
    },
    {
      id: "monthly-view-button",
      title: "Monthly View Button 📊",
      content:
        "Click this button to see a high-level overview of your entire month.",
      target: ".view-toggle-container .TutorialHighlight:nth-child(3) button",
      position: "bottom",
      autoAction: { type: "click", delay: 800, waitAfter: 600 },
    },
    {
      id: "create-shift",
      title: "Create Shift ➕",
      content:
        'To create a new shift, click the "Add Shift" button in the sidebar. You\'ll need to select: the date, time, location, and which employees will work. The system will help you find available staff.',
      target: ".sidebar-nav-add-shift",
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
      title: "Truck Information 📋",
      content:
        "Each truck card displays the truck name, type (Food, Beverage, Dessert, or Holiday), capacity, location, and driver information. This gives you a complete overview of your fleet.",
      target: ".truck-card",
      position: "bottom",
    },
    {
      id: "dropdown-button",
      title: "Dropdown Button 📋",
      content:
        "Click this green arrow button to expand the packing list for each truck. This shows all the items that need to be packed before the truck goes out for an event.",
      target: ".truck-card:first-child button[class*='bg-green-800']",
      position: "left",
    },
    {
      id: "packing-checklist-items",
      title: "Packing Checklist Items ✅",
      content:
        "Here are the individual items in the packing list. Each item has a checkbox that you can click to mark it as packed. The checkmarks help you track what's been loaded and what still needs to be done.",
      target: ".truck-card:first-child .flex.flex-col.gap-2",
      position: "bottom",
    },
  ],
  "/about": [
    {
      id: "about-welcome",
      title: "About Trucks Page 🚚",
      content:
        "This page shows information about your food trucks. You can see details like truck type, capacity, location, and assigned drivers. This helps you understand your fleet and manage truck assignments.",
      target: ".truck-management",
      position: "bottom",
    },
    {
      id: "truck-list",
      title: "Truck Information 📋",
      content:
        "Each truck card displays the truck name, type (Food, Beverage, Dessert, or Holiday), capacity, location, and driver information. This gives you a complete overview of your fleet.",
      target: ".truck-card",
      position: "bottom",
    },
    {
      id: "dropdown-button",
      title: "Dropdown Button 📋",
      content:
        "Click this green arrow button to expand the packing list for each truck. This shows all the items that need to be packed before the truck goes out for an event.",
      target: ".truck-card:first-child button[class*='bg-green-800']",
      position: "left",
    },
    {
      id: "packing-checklist-items",
      title: "Packing Checklist Items ✅",
      content:
        "Here are the individual items in the packing list. Each item has a checkbox that you can click to mark it as packed. The checkmarks help you track what's been loaded and what still needs to be done.",
      target: ".truck-card:first-child .flex.flex-col.gap-2",
      position: "bottom",
    },
    {
      id: "packing-list-overview",
      title: "Packing List Overview 📋",
      content:
        "The packing list includes essential items like food preparation equipment, cooking utensils, storage containers, cleaning supplies, safety equipment, payment systems, and signage. Each item can be checked off as it's packed to ensure nothing is forgotten.",
      target: ".truck-card:first-child .flex.flex-col.gap-2",
      position: "bottom",
    },
    {
      id: "delete-item-button",
      title: "Delete Item Button ❌",
      content:
        "Each item in the packing list has a red 'X' button. Click it to remove that item from the list. You'll get a confirmation popup to prevent accidental deletions.",
      target: ".truck-card:first-child button[title='Delete item']",
      position: "right",
    },
    {
      id: "mark-all-packed-button",
      title: "Mark All Packed Button ✅",
      content:
        "Click this 'Mark All Packed' button to quickly check off all items in the packing list at once. This is useful when you've completed the packing process.",
      target: ".truck-card:first-child .pt-4.flex.gap-2 button:first-child",
      position: "bottom",
    },
    {
      id: "add-item-button",
      title: "Add Item Button ➕",
      content:
        "Click this 'Add Item' button to add a custom item to the packing list. This allows you to add truck-specific items that aren't in the default checklist.",
      target: ".truck-card:first-child .pt-4.flex.gap-2 button:last-child",
      position: "bottom",
    },
    {
      id: "collapse-truck",
      title: "Collapse Truck Details 📋",
      content:
        "You can click the green arrow button again to collapse the packing list and return to the compact view. This helps keep the page organized when you don't need to see the details.",
      target: ".truck-card:first-child button[class*='bg-green-800']",
      position: "left",
    },
    {
      id: "back-to-dashboard-button",
      title: "Back to Dashboard Button 🏠",
      content:
        "Click this 'Back to Dashboard' button to return to your main control center. This button is available on most pages and will take you back to the home page where you can access all the main features.",
      target: '.mt-8 a[href="/"]',
      position: "top",
    },
  ],
  "/contact": [
    {
      id: "contact-welcome",
      title: "Contact Page 📞",
      content:
        "This page contains all the contact information for YYC Food Trucks. You can find emergency contacts, owner information, and office hours here.",
      target: ".min-h-screen",
      position: "bottom",
    },
    {
      id: "back-to-dashboard-button",
      title: "Back to Dashboard Button 🏠",
      content:
        "Click this 'Back to Dashboard' button to return to your main control center. This button is available on most pages and will take you back to the home page where you can access all the main features.",
      target: '.mt-8 a[href="/"]',
      position: "top",
    },
  ],
  "/events/[id]": [
    {
      id: "event-details-welcome",
      title: "Event Details Page 📋",
      content:
        "This page shows all the detailed information about your event. You can see the event name, date, time, location, and manage the assigned staff and trucks. Let's go through the management options.",
      target: ".event-details-page",
      position: "bottom",
    },
    {
      id: "event-info",
      title: "Event Information 📝",
      content:
        "Here you can see all the basic information about the event: the title, date and time, location, and how many servers are required. This information was set when the event was created.",
      target: ".event-detail-card",
      position: "bottom",
    },
    {
      id: "select-employees-button",
      title: "Select Employees Button 👥",
      content:
        "Click this button to open a modal where you can choose which employees will work at this event. The modal will show only available employees who can work during this event's time.",
      target: ".select-employees-button",
      position: "bottom",
      autoAction: { type: "click", delay: 800, waitAfter: 500 },
    },
    {
      id: "employee-availability-explanation",
      title: "Employee Availability 📅",
      content:
        "The employee selection modal shows all employees, but displays availability warnings for those who cannot work this event. Look for red warning messages (⚠️) that explain why an employee is unavailable - such as 'Not available on Friday' or 'Has approved time off during this period'. Unavailable employees will have disabled checkboxes.",
      target: ".modal-body",
      position: "bottom",
    },
    {
      id: "select-available-employee",
      title: "Select an Available Employee ✅",
      content:
        "Select an employee who doesn't have any warning messages. Available employees will have enabled checkboxes and no red warning text. The system automatically checks availability based on their schedule, time-off requests, and other event conflicts. Your selections will be saved when you click the Save button or the Next button.",
      target:
        ".employee-list-container .employee-label:not(:has(.text-xs.text-red-600)):first-child",
      position: "bottom",
      autoAction: {
        type: "check",
        delay: 800,
        waitAfter: 1500,
      },
    },
    {
      id: "assigned-staff-section",
      title: "Assigned Staff Section 👥",
      content:
        "This section shows all the employees currently assigned to this event. Each card displays the employee's name and role. You can manage assignments using the Select Employees button above.",
      target: ".assigned-employees-section",
      position: "bottom",
    },
    {
      id: "select-trucks-button",
      title: "Select Trucks Button 🚚",
      content:
        "Click this button to open a modal where you can choose which food trucks will be at this event. The modal will show only available trucks that can be assigned to this event.",
      target: ".select-trucks-button",
      position: "bottom",
      autoAction: { type: "click", delay: 800, waitAfter: 500 },
    },
    {
      id: "truck-availability-explanation",
      title: "Truck Availability 🚚",
      content:
        "The truck selection modal shows all trucks with their availability status displayed as badges. Green 'Available' badges indicate trucks that can be assigned, while red 'Unavailable' badges show trucks that are already assigned to other events or out of service. You can still select unavailable trucks, but it's recommended to choose available ones.",
      target: ".modal-body",
      position: "bottom",
    },
    {
      id: "select-available-truck",
      title: "Select an Available Truck & Driver ✅",
      content:
        "The tutorial will automatically select an available truck and assign a driver to it. Watch as it: 1) Selects a truck with a green 'Available' badge, 2) Chooses a driver from the dropdown menu, 3) Saves the assignment to add the truck and driver to your event.",
      target: ".modal-body .truck-checkbox:first-child",
      position: "bottom",
      autoAction: {
        type: "check",
        delay: 1200,
        waitAfter: 3000,
      },
    },
    {
      id: "assigned-trucks-section",
      title: "Assigned Trucks Section 🚚",
      content:
        "This section shows all the trucks currently assigned to this event. Each card displays the truck name, type, and capacity. You can manage truck assignments using the Select Trucks button above.",
      target: ".assigned-trucks-section",
      position: "bottom",
    },
    {
      id: "delete-event-button",
      title: "Delete Event Button ❌",
      content:
        "Click this button to permanently delete this event. You'll get a confirmation popup to prevent accidental deletions. Be careful - this action cannot be undone!",
      target: ".delete-event-button",
      position: "bottom",
      autoAction: { type: "click", delay: 800, waitAfter: 500 },
    },
    {
      id: "delete-event-cancel-modal",
      title: "Cancel Delete Event Modal",
      content:
        "This is the confirmation modal for deleting an event. We'll cancel it for safety.",
      target: ".modal-footer button.btn-secondary",
      position: "bottom",
      autoAction: { type: "click", delay: 1500, waitAfter: 500 },
    },
  ],
  "/employees/[id]": [
    {
      id: "employee-details-welcome",
      title: "Employee Details Page 👤",
      content:
        "This page shows all the detailed information about the employee. You can see their personal information, contact details, role, wage, and availability. Let's go through the editing options.",
      target: ".edit-employee-page",
      position: "bottom",
    },
    {
      id: "employee-info",
      title: "Employee Information 📝",
      content:
        "Here you can see and edit all the basic information about the employee: their name, address, role, email, phone, and wage. This information is used for scheduling and contact purposes.",
      target: "form",
      position: "bottom",
    },
    {
      id: "availability-section",
      title: "Availability Settings 📅",
      content:
        "This section lets you set which days of the week the employee is available to work. You can select individual days or use 'Select All' to choose every day. This helps with automatic scheduling.",
      target: ".availability-options",
      position: "bottom",
    },
    {
      id: "save-changes-button",
      title: "Save Changes Button 💾",
      content:
        "Click this button to save any changes you've made to the employee's information. The changes will be applied immediately and reflected throughout the system.",
      target: "form button[type='submit']",
      position: "bottom",
    },
    {
      id: "delete-employee-button",
      title: "Delete Employee Button ❌",
      content:
        "Click this button to permanently delete this employee from the system. You'll get a confirmation popup to prevent accidental deletions. Be careful - this action cannot be undone!",
      target: "button[onClick*='setShowDeleteModal']",
      position: "bottom",
    },
  ],
  "/employees/newEmployee": [
    {
      id: "create-employee-welcome",
      title: "Invite a New Employee 👋",
      content:
        "Welcome to the employee invitation form! This tutorial will walk you through the invitation process. When you invite someone, they'll receive an email and be marked as 'pending' until they activate their account.",
      target: ".create-employee-page",
      position: "bottom",
    },
    {
      id: "first-name-field",
      title: "First Name (Required) 📝",
      content:
        "Enter the employee's first name. This is required and will be used throughout the system for identification and communication. Examples: 'John', 'Sarah', 'Michael'.",
      target: "input[id='firstName']",
      position: "bottom",
      autoAction: { type: "focus", delay: 400, waitAfter: 600 },
    },
    {
      id: "last-name-field",
      title: "Last Name (Required) 📝",
      content:
        "Enter the employee's last name. This is required and will be used along with the first name for complete identification. Examples: 'Smith', 'Johnson', 'Williams'.",
      target: "input[id='lastName']",
      position: "bottom",
      autoAction: { type: "focus", delay: 400, waitAfter: 600 },
    },
    {
      id: "email-field",
      title: "Email Address (Required) 📧",
      content:
        "Enter a valid email address for the employee. This is required and must be in a valid email format (e.g., john.smith@example.com). The system will send an invitation email to this address.",
      target: "input[id='email']",
      position: "bottom",
      autoAction: { type: "focus", delay: 400, waitAfter: 600 },
    },
    {
      id: "invitation-process-explanation",
      title: "How the Invitation Process Works 📨",
      content:
        "When you submit this form: 1) An invitation email is sent to the employee, 2) The employee is marked as 'pending' in the system, 3) They receive a secure link to activate their account, 4) Once activated, they can set their password and complete their profile with address, role, and availability information.",
      target: ".create-employee-page",
      position: "bottom",
    },
    {
      id: "pending-status-explanation",
      title: "Pending Status ⏳",
      content:
        "After sending the invite, the employee will appear in your employee list with a 'pending' status. They cannot be scheduled for shifts until they activate their account and complete their profile. You'll see them listed but they won't be available for assignments.",
      target: ".create-employee-page",
      position: "bottom",
    },
    {
      id: "activation-process",
      title: "Employee Activation Process 🔗",
      content:
        "The employee will receive an email with an activation link. When they click it, they'll be taken to a page where they can: 1) Set their password, 2) Enter their address details, 3) Choose their role (Driver, Server, or Admin), 4) Set their hourly wage, 5) Specify their availability. Only after completing this process will they become active employees.",
      target: ".create-employee-page",
      position: "bottom",
    },
    {
      id: "email-validation-explanation",
      title: "Email Validation ✅",
      content:
        "The system will validate the email format to ensure it's correct. The email must contain an @ symbol and a valid domain. Invalid emails will show an error message and prevent form submission.",
      target: ".create-employee-page",
      position: "bottom",
    },
    {
      id: "form-validation-explanation",
      title: "Form Validation ✅",
      content:
        "Before sending the invitation, the system will check: All required fields are filled, email format is valid, and the email address is properly formatted. Any errors will be shown and must be fixed before the invitation can be sent.",
      target: ".create-employee-page",
      position: "bottom",
    },
    {
      id: "send-invite-button",
      title: "Send Invite Button 📤",
      content:
        "Once all required fields are filled correctly, click this button to send the invitation email to the new employee. The system will show a success message and redirect you to the employees list where you can see the pending invitation. The employee will remain pending until they complete the activation process.",
      target: "button[type='submit']",
      position: "bottom",
      autoAction: { type: "click", delay: 800, waitAfter: 600 },
    },
  ],
  "/events/newEvent": [
    {
      id: "create-event-welcome",
      title: "Create a New Event 🎉",
      content:
        "Welcome to the event creation form! This tutorial will walk you through each required field and explain how the auto-assignment system works. Let's start with the basics.",
      target: ".create-event-page",
      position: "bottom",
    },
    {
      id: "event-name-field",
      title: "Event Name (Required) 📝",
      content:
        "Enter a descriptive name for your event. This is required and will be used to identify the event in the system. Examples: 'Downtown Food Festival', 'Corporate Lunch Event', 'Weekend Market'.",
      target: "input[name='name']",
      position: "bottom",
      autoAction: { type: "focus", delay: 400, waitAfter: 600 },
    },
    {
      id: "location-field",
      title: "Location (Required) 📍",
      content:
        "Enter the event location using the address form below. This must be a valid Calgary address. The system will use this to find the best staff for your event. Important: Don't add number suffixes to streets (e.g., use '23rd Ave' not '23rd Ave rd').",
      target: ".input-group:has(input[name='name']) + .input-group",
      position: "bottom",
      autoAction: { type: "focus", delay: 400, waitAfter: 600 },
    },
    {
      id: "address-form-explanation",
      title: "Address Form Fields 📋",
      content:
        "The address form has several fields: Street Number, Street Name, Direction (NW, NE, SW, SE), City (defaults to Calgary), and Postal Code (optional). Fill these out to create a complete address.",
      target: ".address-form",
      position: "bottom",
    },
    {
      id: "check-address-button",
      title: "Check Address Button ✅",
      content:
        "After entering the location, click 'Check Address' to validate it. This button will verify the address exists in Calgary and get the coordinates needed for staff assignment. This step is crucial for the auto-assignment system to work properly.",
      target: "button[onClick*='geocodeAddress']",
      position: "bottom",
      autoAction: { type: "click", delay: 800, waitAfter: 600 },
    },
    {
      id: "date-field",
      title: "Event Date (Required) 📅",
      content:
        "Select the date for your event. Only future dates are allowed. The date picker will only show dates from today onwards. This helps ensure you're scheduling events in the future.",
      target: "input[name='date'], .react-datepicker-wrapper",
      position: "bottom",
      autoAction: { type: "focus", delay: 400, waitAfter: 600 },
    },
    {
      id: "start-time-field",
      title: "Start Time (Required) ⏰",
      content:
        "Select the start time for your event. This is required and helps determine the event duration. Choose a time that gives you enough setup time before customers arrive.",
      target: "input[name='time'], .react-datepicker-wrapper:nth-of-type(2)",
      position: "bottom",
      autoAction: { type: "focus", delay: 400, waitAfter: 600 },
    },
    {
      id: "end-time-field",
      title: "End Time (Required) ⏰",
      content:
        "Select the end time for your event. This must be after the start time. The system will calculate the event duration automatically. Make sure to allow enough time for cleanup.",
      target: "input[name='endTime'], .react-datepicker-wrapper:nth-of-type(3)",
      position: "bottom",
      autoAction: { type: "focus", delay: 400, waitAfter: 600 },
    },
    {
      id: "required-servers-field",
      title: "Required Servers (Required) 👥",
      content:
        "Enter the number of servers needed for this event. This is crucial for the auto-assignment system. The system will find the best available servers within 5km of your event location.",
      target: "input[name='requiredServers']",
      position: "bottom",
      autoAction: { type: "focus", delay: 400, waitAfter: 600 },
    },
    {
      id: "contact-name-field",
      title: "Contact Name (Required) 📞",
      content:
        "Enter the name of the main contact person for this event. This person will be responsible for coordinating with the event organizers and handling any issues that arise.",
      target: "input[name='contactName']",
      position: "bottom",
      autoAction: { type: "focus", delay: 400, waitAfter: 600 },
    },
    {
      id: "contact-email-field",
      title: "Contact Email (Required) 📧",
      content:
        "Enter a valid email address for the contact person. This is required and must be in a valid email format (e.g., john@example.com). This will be used for event communications.",
      target: "input[name='contactEmail']",
      position: "bottom",
      autoAction: { type: "focus", delay: 400, waitAfter: 600 },
    },
    {
      id: "contact-phone-field",
      title: "Contact Phone (Required) 📱",
      content:
        "Enter a phone number for the contact person. This is required and should be a valid phone number format. This will be used for urgent communications about the event.",
      target: "input[name='contactPhone']",
      position: "bottom",
      autoAction: { type: "focus", delay: 400, waitAfter: 600 },
    },
    {
      id: "truck-selection-field",
      title: "Select Trucks (Required) 🚚",
      content:
        "Choose which food trucks will be at the event. You must select at least one truck. You can select multiple trucks. Each truck card shows the truck name, type, and availability status.",
      target: ".truck-list",
      position: "bottom",
    },
    {
      id: "auto-assignment-explanation",
      title: "How Auto-Assignment Works 🤖",
      content:
        "When you create the event, the system will automatically: 1) Use the validated address coordinates to find all available servers within 5km, 2) Sort them by distance (closest first), then by wage (lowest first), 3) Assign the required number of servers, 4) Create the event with all details and redirect you to the event page.",
      target: ".create-event-page",
      position: "bottom",
    },
    {
      id: "form-validation-explanation",
      title: "Form Validation ✅",
      content:
        "Before creating the event, the system will check: All required fields are filled, email format is valid, phone number is valid, address is validated, at least one truck is selected, and end time is after start time. Any errors will be shown in a popup.",
      target: ".create-event-page",
      position: "bottom",
    },
    {
      id: "create-event-button",
      title: "Create Event Button 🎉",
      content:
        "Once all required fields are filled and the address is validated, click this button to create the event. The system will automatically assign the best available staff and redirect you to the event details page where you can see the assigned employees.",
      target: "button[type='submit']",
      position: "bottom",
      autoAction: { type: "click", delay: 800, waitAfter: 600 },
    },
  ],
  "/requests": [
    {
      id: "timeoff-requests-welcome",
      title: "Time-Off Requests Page 🌴",
      content:
        "This page allows you to submit and manage time-off requests. You can request vacation days, sick leave, or other types of time off. All requests will be reviewed by management.",
      target: ".min-h-screen",
      position: "bottom",
    },
    {
      id: "request-form",
      title: "Time-Off Request Form 📝",
      content:
        "Fill out this form to submit a time-off request. You'll need to specify the type of request, dates, duration, and provide a reason for your request.",
      target: "form",
      position: "bottom",
    },
    {
      id: "request-type-field",
      title: "Request Type 📋",
      content:
        "Select the type of time-off request: Vacation, Sick Leave, Personal Day, or Other. This helps management understand the nature of your request.",
      target: "select[name='type']",
      position: "bottom",
    },
    {
      id: "request-date-field",
      title: "Request Date 📅",
      content:
        "Select the date when you want to start your time off. Make sure to give enough notice for your request to be approved.",
      target: "input[name='date']",
      position: "bottom",
    },
    {
      id: "request-duration-field",
      title: "Duration ⏰",
      content:
        "Specify how long you need off: Half Day, Full Day, or Multiple Days. For multiple days, you can specify the exact number.",
      target: "select[name='duration']",
      position: "bottom",
    },
    {
      id: "request-reason-field",
      title: "Reason for Request 📝",
      content:
        "Provide a brief explanation for your time-off request. This helps management make informed decisions about approval.",
      target: "textarea[name='reason']",
      position: "bottom",
    },
    {
      id: "submit-request-button",
      title: "Submit Request Button 📤",
      content:
        "Click this button to submit your time-off request. You'll receive a confirmation and can track the status of your request.",
      target: "button[type='submit']",
      position: "bottom",
    },
  ],
  "/assign-staff": [
    {
      id: "assign-staff-welcome",
      title: "Auto-Assign Staff Page 👥",
      content:
        "This page helps you automatically assign the best available staff to events based on location and availability. The system uses distance calculations and employee preferences to find the optimal matches.",
      target: ".max-w-4xl",
      position: "bottom",
    },
    {
      id: "event-selection",
      title: "Select Event 📅",
      content:
        "Choose an event from the dropdown menu. Only events that need staff assigned will appear in this list. The system will show how many servers are required for each event.",
      target: "select",
      position: "bottom",
    },
    {
      id: "auto-assign-button",
      title: "Auto-Assign Staff Button 🤖",
      content:
        "Click this button to automatically assign the best available staff to the selected event. The system will find employees within 5km of the event location and sort them by distance and wage.",
      target: "button[onClick*='handleAutoAssign']",
      position: "bottom",
    },
    {
      id: "assigned-staff-results",
      title: "Assigned Staff Results 👥",
      content:
        "Here you can see the staff that has been automatically assigned to the event. Each card shows the employee's name, distance from the event, and hourly wage. You can review and adjust assignments as needed.",
      target: ".mt-8",
      position: "bottom",
    },
  ],
  "/login": [
    {
      id: "login-welcome",
      title: "Login Page 🔐",
      content:
        "Welcome to the YYC Food Trucks login page. Enter your credentials to access the scheduling system. If you're a new employee, you'll need to use the invitation link sent to your email.",
      target: ".min-h-screen",
      position: "bottom",
    },
    {
      id: "username-field",
      title: "Username/Email Field 📧",
      content:
        "Enter your username or email address. This is the same email address that was used when you were invited to join the system.",
      target: "input[name='username']",
      position: "bottom",
    },
    {
      id: "password-field",
      title: "Password Field 🔒",
      content:
        "Enter your password. If you're logging in for the first time, you'll need to use the temporary password sent to your email or set a new password using the invitation link.",
      target: "input[name='password']",
      position: "bottom",
    },
    {
      id: "login-button",
      title: "Login Button 🔐",
      content:
        "Click this button to sign in to your account. If your credentials are correct, you'll be redirected to the main dashboard.",
      target: "button[type='submit']",
      position: "bottom",
    },
    {
      id: "forgot-password-link",
      title: "Forgot Password Link 🔗",
      content:
        "If you've forgotten your password, click this link to reset it. You'll receive an email with instructions to create a new password.",
      target: "a[href*='forgot-password']",
      position: "bottom",
    },
  ],
  "/set-password": [
    {
      id: "set-password-welcome",
      title: "Set Password Page 🔐",
      content:
        "Welcome to the password setup page. This page appears when you click the invitation link sent to your email. Here you can create a secure password for your account.",
      target: ".min-h-screen",
      position: "bottom",
    },
    {
      id: "new-password-field",
      title: "New Password Field 🔒",
      content:
        "Enter a strong password for your account. Make sure it's at least 8 characters long and includes a mix of letters, numbers, and special characters.",
      target: "input[name='password']",
      position: "bottom",
    },
    {
      id: "confirm-password-field",
      title: "Confirm Password Field 🔒",
      content:
        "Re-enter your password to confirm it. This helps prevent typos and ensures you remember your password correctly.",
      target: "input[name='confirmPassword']",
      position: "bottom",
    },
    {
      id: "set-password-button",
      title: "Set Password Button 🔐",
      content:
        "Click this button to save your new password. Once set, you'll be able to log in to your account using your email and this password.",
      target: "button[type='submit']",
      position: "bottom",
    },
  ],
  "/set-up-employee-info": [
    {
      id: "setup-employee-welcome",
      title: "Complete Your Profile 👤",
      content:
        "Welcome! Now that you've set your password, you need to complete your employee profile. This information will be used for scheduling and contact purposes.",
      target: ".min-h-screen",
      position: "bottom",
    },
    {
      id: "personal-information",
      title: "Personal Information 📝",
      content:
        "Fill in your personal information including your full name, address, and contact details. This information is required for scheduling and emergency contact purposes.",
      target: ".personal-info-section",
      position: "bottom",
    },
    {
      id: "address-form",
      title: "Address Form 📍",
      content:
        "Enter your complete address. The system will use this to calculate distances to events for automatic scheduling. Make sure to include your street number and name.",
      target: ".address-form",
      position: "bottom",
    },
    {
      id: "role-selection",
      title: "Role Assigned by Your Boss 👥",
      content:
        "Your boss (admin) has assigned your role. You can view your role here, but you cannot change it. If you believe your role is incorrect, please contact your manager.",
      target: "div:has(.personal-info-section) .grid > div:nth-child(3)",
      position: "bottom",
    },
    {
      id: "wage-information",
      title: "View Your Wage 💰",
      content:
        "Your hourly wage has been set by your boss (admin). You can view your wage here, but you cannot edit it. If you have questions about your wage, please contact your manager.",
      target: "div:has(.personal-info-section) .grid > div:nth-child(4)",
      position: "bottom",
    },
    {
      id: "availability-settings",
      title: "Availability Settings 📅",
      content:
        "Select which days of the week you're available to work. You can choose individual days or use 'Select All' to choose every day. This helps with automatic scheduling.",
      target: ".availability-options",
      position: "bottom",
    },
    {
      id: "complete-profile-button",
      title: "Complete Profile Button ✅",
      content:
        "Click this button to save your profile information. Once completed, you'll be marked as an active employee and can be scheduled for shifts.",
      target: "button[type='submit']",
      position: "bottom",
    },
  ],
};

// Add a function to normalize dynamic paths
function normalizePath(path: string): string {
  // Add more dynamic route patterns as needed
  // Match UUID event IDs (like 3ab2bc94-3167-409d-93a4-6d7bc981caa8) and numeric IDs
  if (
    /^\/events\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      path
    )
  )
    return "/events/[id]";
  if (/^\/events\/\d+$/.test(path)) return "/events/[id]";
  if (
    /^\/employees\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      path
    )
  )
    return "/employees/[id]";
  if (/^\/employees\/\d+$/.test(path)) return "/employees/[id]";
  return path;
}

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [currentPath, setCurrentPath] = useState(
    typeof window !== "undefined"
      ? normalizePath(window.location.pathname)
      : "/"
  );
  const [pendingStep, setPendingStep] = useState<number | null>(null);

  // Monitor state changes
  useEffect(() => {
    // No logging remains
  }, [isActive, currentStep, currentPath, pendingStep]);

  // Get the appropriate tutorial steps for the current page
  const getCurrentSteps = useCallback(() => {
    const pageSteps = pageTutorials[normalizePath(currentPath)] || [];
    // Only include common steps on the home page, not when navigating to specific pages
    const isHomePage = normalizePath(currentPath) === "/";
    const steps = isHomePage ? [...commonSteps, ...pageSteps] : pageSteps;
    return steps;
  }, [currentPath]);

  const startTutorial = () => {
    setCurrentPath(normalizePath(window.location.pathname));
    setIsActive(true);
    setCurrentStep(0);
    setPendingStep(null);
  };

  const endTutorial = () => {
    // Clean up overlays only (no highlight class removal)
    const pageOverlayClass = "tutorial-page-overlay";
    // Remove page overlays
    document.querySelectorAll(`.${pageOverlayClass}`).forEach((el) => {
      el.remove();
    });
    setIsActive(false);
    setCurrentStep(0);
    setPendingStep(null);
  };

  // Watch for route changes and handle tutorial state
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleRouteChange = () => {
      const newPath = normalizePath(window.location.pathname);
      if (newPath !== currentPath) {
        setCurrentPath(newPath);
        // If tutorial is active, reset to step 0 for the new page
        if (isActive) {
          setCurrentStep(0);
        }
      }
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener("popstate", handleRouteChange);

    // Use a more reliable method to detect route changes
    let currentUrl = window.location.pathname;
    const checkUrl = () => {
      if (window.location.pathname !== currentUrl) {
        currentUrl = window.location.pathname;
        handleRouteChange();
      }
    };

    // Check for URL changes periodically
    const interval = setInterval(checkUrl, 100);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      clearInterval(interval);
    };
  }, [currentPath, isActive, pendingStep]);

  // Watch for step changes and apply highlighting
  useEffect(() => {
    // Remove page overlay only (no highlight class removal)
    const pageOverlayClass = "tutorial-page-overlay";
    document.querySelectorAll(`.${pageOverlayClass}`).forEach((el) => {
      el.remove();
    });
    // If tutorial is not active, don't do anything
    if (!isActive) {
      return;
    }
    // No scroll logic here! Only overlay cleanup.
  }, [currentStep, isActive]);

  // Watch for path changes and resume tutorial if needed
  useEffect(() => {
    if (pendingStep !== null) {
      // Always resume tutorial when there's a pending step, regardless of isActive state
      setIsActive(true);
      setCurrentStep(pendingStep);
      setPendingStep(null);
    }
  }, [currentPath, pendingStep]);

  // Test effect to force tutorial start
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      (window as { __TEST_TUTORIAL?: boolean }).__TEST_TUTORIAL
    ) {
      setIsActive(true);
      setCurrentStep(0);
      setPendingStep(null);
      (window as { __TEST_TUTORIAL?: boolean }).__TEST_TUTORIAL = false;
    }
  }, []);

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

  // Helper function to check if an element should be highlighted
  const shouldHighlight = useCallback(
    (selector: string): boolean => {
      if (!isActive) return false;
      const steps = getCurrentSteps();
      const currentStepData = steps[currentStep];
      if (!currentStepData) return false;
      const shouldHighlightElement = currentStepData.target === selector;
      return shouldHighlightElement;
    },
    [isActive, currentStep, getCurrentSteps]
  );

  // Helper function to set pending step for navigation
  const setPendingStepForNavigation = useCallback((stepIndex: number) => {
    // Set the pending step to continue the tutorial from the specified step
    setPendingStep(stepIndex);
  }, []);

  const value = {
    isActive,
    currentStep,
    steps: getCurrentSteps(),
    startTutorial,
    endTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    highlightTarget: isActive ? getCurrentSteps()[currentStep]?.target : null,
    shouldHighlight,
    setPendingStepForNavigation,
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
