"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
    target: ".logo",
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
        "Welcome to the employee invitation form! This tutorial will walk you through each required field for inviting a new employee to join your team. Let's start with the basics.",
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
      id: "wage-field",
      title: "Wage (Required) 💰",
      content:
        "Enter the employee's hourly wage rate. This is required and must be a positive number (e.g., 15.50, 20.00). The wage will be used for scheduling and payroll calculations.",
      target: "input[id='wage']",
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
      id: "invitation-process-explanation",
      title: "How the Invitation Works 📨",
      content:
        "When you submit this form, the system will: 1) Send an invitation email to the employee, 2) Create a pending employee record, 3) The employee will receive a link to set up their password, 4) Once they set up their account, they can complete their profile with address, role, and availability.",
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
        "Once all required fields are filled correctly, click this button to send the invitation email to the new employee. The system will show a success message and redirect you to the employees list where you can see the pending invitation.",
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

function forceScrollToElement(selector: string, headerHeight = 80, extraSpacing = 20) {
  const el = document.querySelector(selector) as HTMLElement;
  if (!el) {
    console.warn("Tutorial: Element not found for selector:", selector);
    return;
  }

  // Check if element is already in viewport
  const rect = el.getBoundingClientRect();
  const windowHeight = window.innerHeight;
  const windowWidth = window.innerWidth;
  
  const isInViewport = (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= windowHeight &&
    rect.right <= windowWidth
  );

  // If element is already in viewport, don't scroll
  if (isInViewport) {
    console.log("Tutorial: Element already in viewport, skipping scroll");
    return;
  }

  console.log("Tutorial: Scrolling to element:", selector, "Header height:", headerHeight);

  try {
    // Step 1: Smooth scroll the element to the top of the viewport
    el.scrollIntoView({
      behavior: "smooth", // Changed from 'auto' to 'smooth' for better UX
      block: "center", // Changed from 'start' to 'center' for better positioning
      inline: "nearest",
    });

    // Step 2: Apply header offset with smooth behavior
    setTimeout(() => {
      try {
        window.scrollBy({
          top: headerHeight + extraSpacing,
          behavior: "smooth" // Changed from 'auto' to 'smooth'
        });
        console.log("Tutorial: Applied header offset:", headerHeight + extraSpacing);
      } catch (scrollError) {
        console.error("Tutorial: Error applying header offset:", scrollError);
      }
    }, 300); // Increased delay to allow smooth scroll to complete
  } catch (error) {
    console.error("Tutorial: Error scrolling to element:", error);
  }
}

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
  const [currentPath, setCurrentPath] = useState(typeof window !== 'undefined' ? normalizePath(window.location.pathname) : "/");
  const [pendingStep, setPendingStep] = useState<number | null>(null);
  const [previousStepId, setPreviousStepId] = useState<string | null>(null);

  // Get the appropriate tutorial steps for the current page
  const getCurrentSteps = () => {
    const pageSteps = pageTutorials[normalizePath(currentPath)] || [];
    return [...commonSteps, ...pageSteps];
  };

  const startTutorial = () => {
    setCurrentPath(normalizePath(window.location.pathname));
    setIsActive(true);
    setCurrentStep(0);
  };

  const endTutorial = () => {
    setIsActive(false);
    setCurrentStep(0);
    setPendingStep(null);
    document.querySelectorAll(".tutorial-highlight-packing-item, .tutorial-highlight-button, .tutorial-expanded-truck, .tutorial-highlight").forEach(el => {
      el.classList.remove("tutorial-highlight-packing-item", "tutorial-highlight-button", "tutorial-expanded-truck", "tutorial-highlight");
    });
  };

  // Watch for path changes and resume tutorial if needed
  useEffect(() => {
    if (pendingStep !== null && isActive) {
      setCurrentStep(pendingStep);
      setPendingStep(null);
    }
  }, [currentPath, isActive, pendingStep]);

  // Watch for step changes and apply highlighting
  useEffect(() => {
    if (!isActive) return;
    
    const steps = getCurrentSteps();
    const currentStepData = steps[currentStep];
    
    // Add highlighting for create event form fields
    if (currentPath === "/events/newEvent") {
      // Highlight start time field - use more specific selector
      if (currentStepData?.id === "start-time-field") {
        setTimeout(() => {
          // Find the second DatePicker wrapper (start time)
          const datePickerWrappers = document.querySelectorAll(".react-datepicker-wrapper");
          if (datePickerWrappers.length >= 2) {
            const startTimeWrapper = datePickerWrappers[1] as HTMLElement;
            startTimeWrapper.classList.add("tutorial-highlight");
            console.log("Tutorial: Highlighted start time field");
          }
        }, 600);
      }
      
      // Highlight end time field - use more specific selector
      if (currentStepData?.id === "end-time-field") {
        setTimeout(() => {
          // Find the third DatePicker wrapper (end time)
          const datePickerWrappers = document.querySelectorAll(".react-datepicker-wrapper");
          if (datePickerWrappers.length >= 3) {
            const endTimeWrapper = datePickerWrappers[2] as HTMLElement;
            endTimeWrapper.classList.add("tutorial-highlight");
            console.log("Tutorial: Highlighted end time field");
          }
        }, 600);
      }
      
      // Highlight check address button
      if (currentStepData?.id === "check-address-button") {
        setTimeout(() => {
          const targetElement = document.querySelector(currentStepData.target) as HTMLElement;
          if (targetElement) {
            targetElement.classList.add("tutorial-highlight-button");
            console.log("Tutorial: Highlighted check address button");
          }
        }, 600);
      }
      
      // Highlight other form fields (but not time fields)
      if (currentStepData?.id.includes("field") && 
          !currentStepData.id.includes("time") && 
          currentStepData.id !== "start-time-field" && 
          currentStepData.id !== "end-time-field") {
        setTimeout(() => {
          const targetElement = document.querySelector(currentStepData.target) as HTMLElement;
          if (targetElement) {
            targetElement.classList.add("tutorial-highlight");
            console.log("Tutorial: Highlighted form field:", currentStepData.id);
          }
        }, 600);
      }
    }
    
    // Add highlighting for create employee form fields
    if (currentPath === "/employees/newEmployee") {
      // Highlight form fields
      if (currentStepData?.id.includes("field")) {
        setTimeout(() => {
          const targetElement = document.querySelector(currentStepData.target) as HTMLElement;
          if (targetElement) {
            targetElement.classList.add("tutorial-highlight");
            console.log("Tutorial: Highlighted employee form field:", currentStepData.id);
          }
        }, 600);
      }
      
      // Highlight submit button
      if (currentStepData?.id === "send-invite-button") {
        setTimeout(() => {
          const targetElement = document.querySelector(currentStepData.target) as HTMLElement;
          if (targetElement) {
            targetElement.classList.add("tutorial-highlight-button");
            console.log("Tutorial: Highlighted send invite button");
          }
        }, 600);
      }
    }
  }, [currentStep, isActive, currentPath]);

  const nextStep = () => {
    // Remove all highlights before advancing
    document.querySelectorAll(".tutorial-highlight-packing-item, .tutorial-highlight-button, .tutorial-expanded-truck, .tutorial-highlight").forEach(el => {
      el.classList.remove("tutorial-highlight-packing-item", "tutorial-highlight-button", "tutorial-expanded-truck", "tutorial-highlight");
    });
    const steps = getCurrentSteps();
    const prevStepData = steps[currentStep];
    if (currentStep < steps.length - 1) {
      const nextStepData = steps[currentStep + 1];
      console.log("Tutorial: All step IDs:", steps.map(s => s.id));
      console.log("Tutorial: Current step index:", currentStep);
      console.log("Tutorial: Total steps:", steps.length);
      
      if (nextStepData.id.includes("welcome") || nextStepData.id === "calendar-view" || nextStepData.id === "event-list" || nextStepData.id === "employee-list" || nextStepData.id === "navigation-tips") {
        console.log("Tutorial: MATCHED - Scrolling to top for overview step:", nextStepData.id);
        console.log("Tutorial: Current scroll position before:", window.scrollY);
        
        // Multiple scroll attempts to ensure it works
        // Force scroll to top immediately
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        console.log("Tutorial: Forced scroll to top, new position:", window.scrollY);
        
        // Second attempt after a short delay
        setTimeout(() => {
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          console.log("Tutorial: Second scroll attempt, position:", window.scrollY);
        }, 100);
        
        // Then smooth scroll to top
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });
          console.log("Tutorial: Applied smooth scroll to top");
        }, 200);
        
        // Final check and scroll
        setTimeout(() => {
          if (window.scrollY > 0) {
            window.scrollTo(0, 0);
            document.documentElement.scrollTop = 0;
            document.body.scrollTop = 0;
            console.log("Tutorial: Final scroll attempt, position:", window.scrollY);
          }
        }, 500);
      } else {
        console.log("Tutorial: NO MATCH - Using targeted scroll for:", nextStepData.id);
      forceScrollToElement(nextStepData.target);
      }
      
      // Special handling for dropdown button step
      if (currentPath === "/about" && nextStepData.id === "dropdown-button") {
      setTimeout(() => {
          const firstTruckButton = document.querySelector(".truck-card:first-child button[class*='bg-green-800']") as HTMLButtonElement;
          if (firstTruckButton) {
            firstTruckButton.click();
            console.log("Tutorial: Automatically expanded first truck");
            
            setTimeout(() => {
              const firstTruckCard = document.querySelector(".truck-card:first-child") as HTMLElement;
              if (firstTruckCard) {
                firstTruckCard.classList.add("tutorial-expanded-truck");
              }
            }, 300);
          }
        }, 500);
      }
      
      // Special handling for schedule tutorial view changes
      if (currentPath === "/schedule") {
        // Change to daily view when explaining daily view
        if (nextStepData.id === "daily-view-button") {
          setTimeout(() => {
            const dailyViewButton = document.querySelector(".view-toggle-button:nth-child(1)") as HTMLButtonElement;
            if (dailyViewButton) {
              dailyViewButton.click();
              console.log("Tutorial: Automatically switched to daily view");
            }
          }, 500);
        }
        
        // Change to weekly view when explaining weekly view
        if (nextStepData.id === "weekly-view-button") {
          setTimeout(() => {
            const weeklyViewButton = document.querySelector(".view-toggle-button:nth-child(2)") as HTMLButtonElement;
            if (weeklyViewButton) {
              weeklyViewButton.click();
              console.log("Tutorial: Automatically switched to weekly view");
            }
          }, 500);
        }
        
        // Change to monthly view when explaining monthly view
        if (nextStepData.id === "monthly-view-button") {
          setTimeout(() => {
            const monthlyViewButton = document.querySelector(".view-toggle-button:nth-child(3)") as HTMLButtonElement;
            if (monthlyViewButton) {
              monthlyViewButton.click();
              console.log("Tutorial: Automatically switched to monthly view");
            }
          }, 500);
        }
        
        // Navigate to previous day/week/month when explaining previous button
        if (nextStepData.id === "previous-button") {
          setTimeout(() => {
            const previousButton = document.querySelector(".navigation-container button:first-child") as HTMLButtonElement;
            if (previousButton) {
              previousButton.click();
              console.log("Tutorial: Automatically clicked previous button");
            }
          }, 500);
        }
        
        // Navigate to next day/week/month when explaining next button
        if (nextStepData.id === "next-button") {
          setTimeout(() => {
            const nextButton = document.querySelector(".navigation-container button:last-child") as HTMLButtonElement;
            if (nextButton) {
              nextButton.click();
              console.log("Tutorial: Automatically clicked next button");
            }
          }, 500);
        }
        
        // Go to today when explaining today button
        if (nextStepData.id === "today-button") {
          setTimeout(() => {
            const todayButton = document.querySelector(".navigation-container button:nth-child(2)") as HTMLButtonElement;
            if (todayButton) {
              todayButton.click();
              console.log("Tutorial: Automatically clicked today button");
            }
          }, 500);
        }
      }
      
      // Special handling for events tutorial - click View Details button
      if (currentPath === "/events" && nextStepData.id === "view-details-button") {
        // Highlight the button first
        setTimeout(() => {
          const viewDetailsButton = document.querySelector(".event-card:first-child .button") as HTMLButtonElement;
          if (viewDetailsButton) {
            viewDetailsButton.classList.add("tutorial-highlight-button");
          }
        }, 600);
        // Wait 1 second after highlight, then click
        setTimeout(() => {
          try {
            const viewDetailsButton = document.querySelector(".event-card:first-child .button") as HTMLButtonElement;
            if (viewDetailsButton) {
              viewDetailsButton.click();
              setTimeout(() => {
                const newPath = window.location.pathname;
                if (newPath.includes("/events/") && newPath !== "/events") {
                  setCurrentPath(newPath);
                  // Find the first relevant step for the event details page
                  const eventDetailSteps = pageTutorials["/events/[id]"] || [];
                  let firstDetailStepIdx = eventDetailSteps.findIndex(
                    s => s.id === "event-details-welcome" || s.id === "event-info"
                  );
                  if (firstDetailStepIdx === -1) firstDetailStepIdx = 0;
                  // Add commonSteps length to get the correct index in getCurrentSteps()
                  setPendingStep(commonSteps.length + firstDetailStepIdx);
                }
              }, 1500);
            } else {
        setCurrentStep(currentStep + 1);
            }
          } catch {
            setCurrentStep(currentStep + 1);
          }
        }, 1600); // 600ms for highlight + 1000ms delay
        return;
      }
      
      // Special handling for employees tutorial - click Edit button
      if (currentPath === "/employees" && nextStepData.id === "edit-employee-button") {
        setTimeout(() => {
          try {
            const editEmployeeButton = document.querySelector(".employee-card:first-child button[title='Edit Employee']") as HTMLButtonElement;
            if (editEmployeeButton) {
              editEmployeeButton.click();
              setTimeout(() => {
                const newPath = window.location.pathname;
                if (newPath.includes("/employees/") && newPath !== "/employees") {
                  setCurrentPath(newPath);
                  setPendingStep(currentStep + 2);
                }
              }, 1500);
            } else {
              setCurrentStep(currentStep + 1);
            }
          } catch {
            setCurrentStep(currentStep + 1);
          }
        }, 500);
        return;
      }
      
      // Special handling for event details tutorial - click management buttons
      if (currentPath.includes("/events/") && currentPath !== "/events") {
        // Click Select Employees button
        if (nextStepData.id === "select-employees-button") {
          setTimeout(() => {
            const selectEmployeesButton = document.querySelector(".mt-6.flex.gap-4 button:first-child") as HTMLButtonElement;
            if (selectEmployeesButton) {
              selectEmployeesButton.click();
              console.log("Tutorial: Automatically clicked Select Employees button");
            }
          }, 2500);
        }
        // Select first employee in modal and close
        if (nextStepData.id === "select-employee-in-modal") {
          setTimeout(() => {
            const firstEmployeeCheckbox = document.querySelector(".modal-body .employee-checkbox:first-child") as HTMLInputElement;
            if (firstEmployeeCheckbox) {
              firstEmployeeCheckbox.click();
              console.log("Tutorial: Automatically selected first employee");
              setTimeout(() => {
                const closeButton = document.querySelector(".modal-footer .btn-secondary") as HTMLButtonElement;
                if (closeButton) {
                  closeButton.click();
                  console.log("Tutorial: Automatically closed employee modal");
                }
              }, 2500);
            }
          }, 2500);
        }
        // Click Select Trucks button
        if (nextStepData.id === "select-trucks-button") {
          setTimeout(() => {
            const selectTrucksButton = document.querySelector(".mt-6.flex.gap-4 button:nth-child(2)") as HTMLButtonElement;
            if (selectTrucksButton) {
              selectTrucksButton.click();
              console.log("Tutorial: Automatically clicked Select Trucks button");
            }
          }, 2500);
        }
        // Select first truck in modal and close
        if (nextStepData.id === "select-truck-in-modal") {
          setTimeout(() => {
            const firstTruckCheckbox = document.querySelector(".modal-body .employee-checkbox:first-child") as HTMLInputElement;
            if (firstTruckCheckbox) {
              firstTruckCheckbox.click();
              console.log("Tutorial: Automatically selected first truck");
              setTimeout(() => {
                const closeButton = document.querySelector(".modal-footer .btn-secondary") as HTMLButtonElement;
                if (closeButton) {
                  closeButton.click();
                  console.log("Tutorial: Automatically closed truck modal");
                }
              }, 2500);
            }
          }, 2500);
        }
        
        // Click Delete Event button (but don't confirm)
        if (nextStepData.id === "delete-event-button") {
          setTimeout(() => {
            const deleteEventButton = document.querySelector(".mt-6.flex.gap-4 button:last-child") as HTMLButtonElement;
            if (deleteEventButton) {
              deleteEventButton.click();
              console.log("Tutorial: Automatically clicked Delete Event button");
              
              // Close the confirmation dialog after a short delay
              setTimeout(() => {
                // Find the cancel button in the modal by class and text
                const cancelButton = Array.from(document.querySelectorAll(".modal-footer .btn-secondary")).find(
                  (btn) => btn.textContent && btn.textContent.trim().toLowerCase() === "cancel"
                ) as HTMLButtonElement | undefined;
                if (cancelButton) {
                  cancelButton.click();
                  console.log("Tutorial: Automatically cancelled delete confirmation after next");
                }
              }, 2500);
            }
          }, 2500);
        }
      }
      
      // Add highlighting for packing list overview
      if (currentPath === "/about" && nextStepData.id === "packing-list-overview") {
        setTimeout(() => {
          const targetElement = document.querySelector(nextStepData.target) as HTMLElement;
          if (targetElement) {
            targetElement.classList.add("tutorial-highlight-packing-item");
          }
        }, 600);
      }
      
      // Add highlighting for buttons
      if (currentPath === "/about" && (nextStepData.id.includes("button") || nextStepData.id.includes("arrow"))) {
        setTimeout(() => {
          const targetElement = document.querySelector(nextStepData.target) as HTMLElement;
          if (targetElement) {
            targetElement.classList.add("tutorial-highlight-button");
          }
        }, 600);
      }
      
      // Add highlighting for schedule tutorial elements
      if (currentPath === "/schedule") {
        // Highlight view toggle buttons
        if (nextStepData.id.includes("view-button")) {
          setTimeout(() => {
            const targetElement = document.querySelector(nextStepData.target) as HTMLElement;
            if (targetElement) {
              targetElement.classList.add("tutorial-highlight-button");
            }
          }, 600);
        }
        
        // Highlight navigation buttons
        if (nextStepData.id.includes("button") && !nextStepData.id.includes("view")) {
          setTimeout(() => {
            const targetElement = document.querySelector(nextStepData.target) as HTMLElement;
            if (targetElement) {
              targetElement.classList.add("tutorial-highlight-button");
            }
          }, 600);
        }
        
        // Highlight calendar view
        if (nextStepData.id === "calendar-view") {
          setTimeout(() => {
            const targetElement = document.querySelector(nextStepData.target) as HTMLElement;
            if (targetElement) {
              targetElement.classList.add("tutorial-highlight");
            }
          }, 600);
        }
      }
      
      // Add highlighting for assigned staff section
      if (currentPath.includes("/events/") && currentPath !== "/events" && nextStepData.id === "assigned-staff-section") {
        setTimeout(() => {
          const targetElement = document.querySelector(nextStepData.target) as HTMLElement;
          if (targetElement) {
            targetElement.classList.add("tutorial-highlight");
          }
        }, 600);
      }
      
      // Add highlighting for assigned trucks section
      if (currentPath.includes("/events/") && currentPath !== "/events" && nextStepData.id === "assigned-trucks-section") {
        setTimeout(() => {
          const targetElement = document.querySelector(nextStepData.target) as HTMLElement;
          if (targetElement) {
            targetElement.classList.add("tutorial-highlight");
          }
        }, 600);
      }
      
      setTimeout(() => {
        setPreviousStepId(prevStepData?.id || null);
        setCurrentStep(currentStep + 1);
      }, 100);
    } else {
      endTutorial();
    }
  };

  // Effect to handle canceling delete dialog after advancing from delete-event-button
  useEffect(() => {
    if (previousStepId === "delete-event-button") {
      setTimeout(() => {
        // Find the cancel button in the modal by class and text
        const cancelButton = Array.from(document.querySelectorAll(".modal-footer .btn-secondary")).find(
          (btn) => btn.textContent && btn.textContent.trim().toLowerCase() === "cancel"
        ) as HTMLButtonElement | undefined;
        if (cancelButton) {
          cancelButton.click();
          console.log("Tutorial: Automatically cancelled delete confirmation after next");
        }
      }, 2500);
    }
  }, [previousStepId]);

  const previousStep = () => {
    // Remove all highlights before going back
    document.querySelectorAll(".tutorial-highlight-packing-item, .tutorial-highlight-button, .tutorial-expanded-truck, .tutorial-highlight").forEach(el => {
      el.classList.remove("tutorial-highlight-packing-item", "tutorial-highlight-button", "tutorial-expanded-truck", "tutorial-highlight");
    });
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
