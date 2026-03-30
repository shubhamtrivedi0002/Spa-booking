# Spa-booking
Spa Booking app

React JS Developer Assessment

Design references are provided in the Figma files at bottom of the page.
Backend APIs will be provided for the following operations:
● List bookings
● Create booking
● Update booking
● Delete booking

2. Booking Calendar UI
Build a therapist schedule calendar similar to the provided design.
Calendar characteristics:
● Time grid (15-minute interval)
● Therapists displayed horizontally
● Time displayed vertically
● Bookings rendered as blocks

Your UI must be designed so that it does not lag under this load.
Important considerations:
● Virtual rendering
● Efficient DOM updates
● Avoid unnecessary re-renders
● Memory management

4. API Integration
You will be provided APIs in the POSTMAN COLLECTION. Please look at bottom of the page for API
collection.
GET /bookings
POST /bookings/create
PUT /bookings/{id}
CANCEL /bookings/item/cancel
DELETE /bookings/destroy/{id}

4. Color/icons Rules
When displaying therapist labels:
● Female → Pink
● Hex: #EC4899
● Male → Blue
● Hex: #3B82F6

5. Booking Panel
When clicking a booking block, open a right side panel.
Panel must allow:
● View booking

● Edit booking
● Cancel booking
● Select service
● Select therapist
● Update duration

6. Local Data Handling
Your solution must support:
● Local caching of bookings
● Instant UI updates in real time when creating and updating the booking
● No UI lag
Test scenario:
Load 2000 bookings per day in the calendar.
The UI must remain responsive.

7. Error Handling
Your application must demonstrate proper handling of:
Frontend errors
Examples:
● Invalid form input
● Failed state updates
● Component rendering failures
Backend errors

8. Logging Strategy
Implement a logging mechanism that captures:

● API errors
● UI exceptions
● User actions

9. Performance Expectations
The application should demonstrate knowledge of:
● Memoization
● Code splitting
● Lazy loading
● Optimized rendering
You should avoid:
● Full re-renders of the calendar
● Heavy state propagation
● Unnecessary component updates

10. Architecture Expectations
We expect the candidate to demonstrate:
● Component modularity
● Clean folder structure
● Reusable components
● Clear state management
State management can use:
● Context API
● Redux
● Zustand

Submission Requirements
Provide:
1. Hosted working link
(Vercel / Netlify / similar)
