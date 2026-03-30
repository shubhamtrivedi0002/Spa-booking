# Spa Booking Management System

A therapist schedule and booking management app built for spa/salon outlets. Provides an interactive calendar view with real-time booking visualization, optimized to handle ~2000 bookings per day.

---

## Tech Stack

- **React 19** with Vite 8
- **Zustand** for state management
- **dayjs** for date/time handling
- **react-window** for virtual scrolling

## Features

- Interactive calendar with 15-min time grid (7 AM – 11 PM)
- Therapist columns with gender-based color coding
- Booking CRUD — create, view, edit, status updates, cancel, delete
- Client search with inline creation
- Room availability checking
- Service & therapist assignment with duration/price auto-fill
- Optimistic UI updates with automatic rollback on failure
- LocalStorage caching with TTL (5 min bookings, 10 min therapists/services)
- Horizontal virtualization for large therapist lists
- Toast notifications & error boundaries

## Project Structure

```
src/
├── api/            # API client & endpoint modules
│   ├── client.js   # HTTP wrapper (auth, timeout, error handling)
│   ├── auth.js     # Login
│   ├── bookings.js # Booking CRUD endpoints
│   ├── therapists.js
│   ├── services.js
│   ├── rooms.js
│   └── users.js    # Client/user search & creation
├── components/     # UI components
│   ├── CalendarGrid.jsx    # Virtualized calendar with time slots
│   ├── CalendarToolbar.jsx # Date nav, search, filters
│   ├── BookingBlock.jsx    # Individual booking display
│   ├── BookingPanel.jsx    # Side panel (view/edit/create)
│   ├── BookingForm.jsx     # Booking create/edit form
│   ├── LoginForm.jsx       # Authentication
│   ├── Toast.jsx           # Notifications
│   └── ErrorBoundary.jsx   # Error fallback
├── pages/
│   └── CalendarPage.jsx    # Main page orchestrator
├── store/          # Zustand stores
│   ├── authStore.js        # Auth & session
│   ├── bookingStore.js     # Bookings with optimistic updates
│   ├── therapistStore.js   # Therapist data & timings
│   ├── serviceStore.js     # Service categories
│   └── uiStore.js          # Panel state, toasts, filters
└── utils/
    ├── constants.js  # Config from env vars, app constants
    ├── cache.js      # localStorage wrapper with TTL
    ├── helpers.js    # Time conversion, date parsing, debounce
    └── logger.js     # In-memory logger (last 1000 entries)
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `VITE_BASE_URL` | Backend API base URL | `https://dev.natureland.hipster-virtual.com` |
| `VITE_COMPANY_ID` | Company identifier | `1` |
| `VITE_OUTLET_ID` | Outlet identifier | `1` |
| `VITE_OUTLET_TYPE` | Outlet type | `2` |
| `VITE_PANEL` | Panel type | `outlet` |

### Run

```bash
# Development
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## API Endpoints

All requests go through `{VITE_BASE_URL}/api/v1`. The API client auto-injects Bearer tokens and handles 401 (auto-logout), timeouts (30s), and error standardization.

| Module | Endpoint | Method |
|---|---|---|
| Auth | `/login` | POST |
| Bookings | `/bookings/outlet/booking/list` | GET |
| Bookings | `/bookings/create` | POST |
| Bookings | `/bookings/{id}` | POST |
| Bookings | `/bookings/update/payment-status` | POST |
| Bookings | `/bookings/item/cancel` | POST |
| Bookings | `/bookings/destroy/{id}` | DELETE |
| Therapists | `/therapists` | GET |
| Therapists | `/therapist-timings` | GET |
| Services | `/service-category` | GET |
| Rooms | `/room-bookings/outlet/{id}` | GET |
| Users | `/users` | GET |
| Users | `/users/create` | POST |

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
