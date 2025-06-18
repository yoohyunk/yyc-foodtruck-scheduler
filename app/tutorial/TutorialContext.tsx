"use client";
import "../globals.css";
import { useState, useEffect, ReactElement } from "react";

import React, {
  createContext,
  useContext,
  useCallback,
  ReactNode,
} from "react";

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
  highlightTarget: string | null;
  shouldHighlight: (selector: string) => boolean;
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
      id: "schedule-button",
      title: "Schedule Button 📅",
      content:
        "Click this button to view and manage your team's work schedule. Here you can see who's working when and create new shifts.",
      target: '.landing-links .TutorialHighlight:nth-child(1)',
      position: "right",
    },
    {
      id: "employees-button",
      title: "Employees Button 👥",
      content:
        "This button takes you to your employee management page. Here you can add new staff, view employee details, and manage their information.",
      target: '.landing-links .TutorialHighlight:nth-child(2)',
      position: "right",
    },
    {
      id: "events-button",
      title: "Events Button 🎉",
      content:
        "Click here to manage your food truck events. You can create new events, view upcoming events, and assign staff to events.",
      target: '.landing-links .TutorialHighlight:nth-child(3)',
      position: "right",
    },
    {
      id: "trucks-button",
      title: "Trucks Button 🚚",
      content:
        "This button takes you to your truck management page. Here you can add new trucks, view your fleet, and manage truck details.",
      target: '.landing-links .TutorialHighlight:nth-child(4)',
      position: "right",
    },
    {
      id: "timeoff-button",
      title: "Time-Off Button 🌴",
      content:
        "Click here to manage time-off requests from your staff. You can approve or deny requests and view upcoming time off.",
      target: '.landing-links .TutorialHighlight:nth-child(5)',
      position: "right",
    },
    {
      id: "upcoming-events",
      title: "Upcoming Events Section 📅",
      content:
        "This section shows your next 5 upcoming events. Each card shows the event name, date, and location. Click on an event to see more details.",
      target: ".upcoming-events-highlight",
      position: "bottom",
    },
    {
      id: "timeoff-requests",
      title: "Time-Off Requests Section 🌴",
      content:
        "Here you can see the next 3 time-off requests from your staff. Each card shows the type of request, dates, and reason. Click to approve or deny requests.",
      target: ".timeoff-requests-highlight",
      position: "bottom",
    },
    {
      id: "navigation-tips",
      title: "Quick Tips 💡",
      content:
        "Hover over any button to see it highlight. The help button in the footer can restart this tutorial anytime you need it. Each section updates automatically with the latest information.",
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
    {
      id: "edit-employee-button",
      title: "Edit Employee Details 📝",
      content:
        "Click the 'Edit' button on any employee card to see all the information about that employee and make changes. This opens the employee details page where you can update their contact information, role, wage, and availability.",
      target: ".employee-card:first-child button[title='Edit Employee']",
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
      id: "view-details-button",
      title: "View Event Details 📋",
      content:
        "Click the 'View Details' button on any event card to see all the information about that event, including assigned staff, trucks, and contact details. This opens the event details page where you can make changes.",
      target: ".event-card:first-child .button",
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
        "Click this button to open a modal where you can choose which employees will work at this event. Let's try adding an employee!",
      target: ".mt-6.flex.gap-4 button:first-child",
      position: "bottom",
    },
    {
      id: "select-employee-in-modal",
      title: "Select an Employee ✅",
      content:
        "Select the first available employee by checking the box, then close the modal to save your selection.",
      target: ".modal-body .employee-checkbox:first-child",
      position: "bottom",
    },
    {
      id: "select-trucks-button",
      title: "Select Trucks Button 🚚",
      content:
        "Click this button to open a modal where you can choose which food trucks will be at this event. Let's try adding a truck!",
      target: ".mt-6.flex.gap-4 button:nth-child(2)",
      position: "bottom",
    },
    {
      id: "select-truck-in-modal",
      title: "Select a Truck ✅",
      content:
        "Select the first available truck by checking the box, then close the modal to save your selection.",
      target: ".modal-body .employee-checkbox:first-child",
      position: "bottom",
    },
    {
      id: "delete-event-button",
      title: "Delete Event Button ❌",
      content:
        "Click this button to permanently delete this event. You'll get a confirmation popup to prevent accidental deletions. Be careful - this action cannot be undone!",
      target: ".mt-6.flex.gap-4 button:last-child",
      position: "bottom",
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
      id: "assigned-trucks-section",
      title: "Assigned Trucks Section 🚚",
      content:
        "This section shows all the trucks currently assigned to this event. Each card displays the truck name and type. You can manage truck assignments using the Select Trucks button above.",
      target: ".assigned-trucks-section",
      position: "bottom",
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
    },
    {
      id: "last-name-field",
      title: "Last Name (Required) 📝",
      content:
        "Enter the employee's last name. This is required and will be used along with the first name for complete identification. Examples: 'Smith', 'Johnson', 'Williams'.",
      target: "input[id='lastName']",
      position: "bottom",
    },
    {
      id: "email-field",
      title: "Email Address (Required) 📧",
      content:
        "Enter a valid email address for the employee. This is required and must be in a valid email format (e.g., john.smith@example.com). The system will send an invitation email to this address.",
      target: "input[id='email']",
      position: "bottom",
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
    },
    {
      id: "location-field",
      title: "Location (Required) 📍",
      content:
        "Enter the event location using the address form below. This must be a valid Calgary address. The system will use this to find the best staff for your event. Important: Don't add number suffixes to streets (e.g., use '23rd Ave' not '23rd Ave rd').",
      target: ".input-group:has(input[name='name']) + .input-group",
      position: "bottom",
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
    },
    {
      id: "date-field",
      title: "Event Date (Required) 📅",
      content:
        "Select the date for your event. Only future dates are allowed. The date picker will only show dates from today onwards. This helps ensure you're scheduling events in the future.",
      target: "input[name='date'], .react-datepicker-wrapper",
      position: "bottom",
    },
    {
      id: "start-time-field",
      title: "Start Time (Required) ⏰",
      content:
        "Select the start time for your event. This is required and helps determine the event duration. Choose a time that gives you enough setup time before customers arrive.",
      target: "input[name='time'], .react-datepicker-wrapper:nth-of-type(2)",
      position: "bottom",
    },
    {
      id: "end-time-field",
      title: "End Time (Required) ⏰",
      content:
        "Select the end time for your event. This must be after the start time. The system will calculate the event duration automatically. Make sure to allow enough time for cleanup.",
      target: "input[name='endTime'], .react-datepicker-wrapper:nth-of-type(3)",
      position: "bottom",
    },
    {
      id: "required-servers-field",
      title: "Required Servers (Required) 👥",
      content:
        "Enter the number of servers needed for this event. This is crucial for the auto-assignment system. The system will find the best available servers within 5km of your event location.",
      target: "input[name='requiredServers']",
      position: "bottom",
    },
    {
      id: "contact-name-field",
      title: "Contact Name (Required) 📞",
      content:
        "Enter the name of the main contact person for this event. This person will be responsible for coordinating with the event organizers and handling any issues that arise.",
      target: "input[name='contactName']",
      position: "bottom",
    },
    {
      id: "contact-email-field",
      title: "Contact Email (Required) 📧",
      content:
        "Enter a valid email address for the contact person. This is required and must be in a valid email format (e.g., john@example.com). This will be used for event communications.",
      target: "input[name='contactEmail']",
      position: "bottom",
    },
    {
      id: "contact-phone-field",
      title: "Contact Phone (Required) 📱",
      content:
        "Enter a phone number for the contact person. This is required and should be a valid phone number format. This will be used for urgent communications about the event.",
      target: "input[name='contactPhone']",
      position: "bottom",
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
    },
  ],
};

// Add a function to normalize dynamic paths
function normalizePath(path: string): string {
  // Add more dynamic route patterns as needed
  // Only match actual event IDs (numbers), not "newEvent"
  if (/^\/events\/\d+$/.test(path)) return "/events/[id]";
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
  const [previousStepId, setPreviousStepId] = useState<string | null>(null);

  // Get the appropriate tutorial steps for the current page
  const getCurrentSteps = useCallback(() => {
    const pageSteps = pageTutorials[normalizePath(currentPath)] || [];
    return [...commonSteps, ...pageSteps];
  }, [currentPath]);

  const startTutorial = () => {
    setCurrentPath(normalizePath(window.location.pathname));
    setIsActive(true);
    setCurrentStep(0);
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

  // Watch for path changes and resume tutorial if needed
  useEffect(() => {
    if (pendingStep !== null && isActive) {
      setCurrentStep(pendingStep);
      setPendingStep(null);
    }
  }, [currentPath, isActive, pendingStep]);

  // Watch for route changes and end tutorial if user navigates to a different page
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleRouteChange = () => {
      const newPath = normalizePath(window.location.pathname);
      if (isActive && newPath !== currentPath) {
        endTutorial();
      }
      setCurrentPath(newPath);
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener("popstate", handleRouteChange);

    // Listen for pushstate/replacestate events (programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      setTimeout(handleRouteChange, 0);
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      setTimeout(handleRouteChange, 0);
    };

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    };
  }, [isActive, currentPath]);

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
  }, [currentStep, isActive, getCurrentSteps]);

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
  const shouldHighlight = useCallback((selector: string): boolean => {
    if (!isActive) return false;
    const steps = getCurrentSteps();
    const currentStepData = steps[currentStep];
    if (!currentStepData) return false;
    return currentStepData.target === selector;
  }, [isActive, currentStep, getCurrentSteps]);

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
