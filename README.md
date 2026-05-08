# AuctionDashboard

## Overview

AuctionDashboard is a lightweight football auction administration app built with an Angular frontend and an Express backend. The application stores all runtime data in an Excel workbook (`backend/excel/Players.xlsx`) and exposes a small API surface for reading players, teams, budgets, positions, and users.

The app currently supports three user roles:

- `admin`: full access to auction controls and player management.
- `bidder`: read-only access to the player list.
- `readonly`: read-only access to the player list.

## Architecture

### Backend

- Built with `Express` and `ExcelJS`.
- Reads data from `backend/excel/Players.xlsx`.
- Uses `body-parser` for JSON request parsing.
- Serves Swagger documentation at `/api-docs`.
- Runs by default on port `3000`.

### Frontend

- Built with Angular 20 and Angular Material.
- Uses a single-page app routing model.
- Reads backend base URL from `frontend/src/assets/config.json`.
- Supports login by email only.

## Data Source and Excel Schema

The backend expects the workbook sheet layout as follows:

- `Sheet 1`: Players data
  - Required columns include `PlayerID`, `Name`, `Age`, `PrimaryPosition`, `SecondaryPosition`, `BasePrice`, `SoldPrice`, `TeamAssigned`, and any additional player metadata.
- `Sheet 2`: Teams data
  - Expected columns include `TeamName`, `CapID`, `ViceCapID`, etc.
- `Sheet 3`: Budget data
  - Expected column `VirtualBudget`.
- `Sheet 4`: Positions data
  - Expected column `Positions`.
- `Sheet 5`: Users data
  - Expected columns: `Email`, `Name`, `Role`.

The backend reads header row values dynamically and converts rows into JSON objects.

## Roles and Access Rules

### Admin

- Allowed to access `/admin` dashboard.
- Can view current player, upcoming players, and team budgets.
- Can perform auction selling operations.
- Sees admin-specific navigation and controls.

### Bidder / Readonly

- Allowed to access `/players` only.
- Can view the full player list, filter by position, and inspect team compositions.
- Cannot access `/admin`.

### Login Behavior

- The login form requires only an email.
- Auth is resolved by matching the email against entries in the Excel users sheet.
- Roles are normalized to lowercase and must be one of `admin`, `bidder`, or `readonly`.
- Invalid email or invalid role results in login failure.

## Backend API Endpoints

### General

- `GET /` — Health check.
- `GET /api-docs` — Swagger UI for backend endpoints.

### Players

- `GET /players` — Returns all players from `Sheet 1`.
- `POST /players/sell` — Updates a player's `SoldPrice` and `TeamAssigned`.
  - Request body: `{ PlayerID, SoldPrice, TeamAssigned }`
  - Backend validates that the required fields are present.
  - The backend finds the matching row by `PlayerID` and saves the updated values back to `Players.xlsx`.

### Config

- `GET /config/teams` — Returns team metadata from `Sheet 2`.
- `GET /config/budget` — Returns budget data from `Sheet 3`.
- `GET /config/positions` — Returns a list of positions from `Sheet 4`.
- `GET /config/users` — Returns users from `Sheet 5` as:
  - `{ users: [{ Email, Name, Role }, ...] }`

## Frontend Flow

### Configuration

- `frontend/src/assets/config.json` contains the backend `apiBaseUrl`.
- `frontend/src/app/services/config-loader-service.ts` loads this config before the app starts.

### Login

- `frontend/src/app/components/login/login.component.ts` submits the email to `AuthService`.
- `AuthService` uses `ConfigService.getUsers()` to fetch user records.
- If the email matches a row in the users list, the app stores the role and marks the session as authenticated.

### Route Protection

- `frontend/src/app/services/auth.guard.ts` protects both `/admin` and `/players`.
- If the user is not authenticated, they are redirected to `/login`.
- If a non-admin attempts to reach `/admin`, they are redirected to `/players`.

### Navigation

- `frontend/src/app/app.ts` renders navigation only when logged in.
- The `Admin Dashboard` link is visible only for users whose role is `admin`.
- `Player List` is visible to all authenticated users.

## Auctioning Workflow

### Admin Dashboard

The admin dashboard is the main auction tool.

- Loads initial data from the backend:
  - Players list
  - Team list
  - Budget config
  - Positions list
- Displays the current player card and upcoming players.
- Allows filtering by `PrimaryPosition` and `SecondaryPosition`.
- Shows team remaining budgets and player counts.

### Selling a Player

1. Select a player using the current card / navigation controls.
2. Enter a `Sold Price`.
3. Select a destination team from the dropdown.
4. Click `Sell`.

Business rules enforced in the frontend:

- `SoldPrice` and `TeamAssigned` must be provided.
- The current team budget is computed from `VirtualBudget` minus all sold prices for players assigned to that team.
- If the selected team does not have enough remaining budget, the sell action is blocked with a warning.

When `Sell` succeeds:

- The frontend updates the local player list state.
- The backend persists the update to the Excel workbook.

### Player List View

- Shows all players and allows filtering by primary/secondary positions.
- Offers two views:
  - Players with filtering controls
  - Teams with member composition and total cost
- Team composition is built from players whose `TeamAssigned` matches the team name.
- Captain and vice-captain are identified by `CapID` and `ViceCapID`.

## Implementation Notes

### Backend

- Data persistence is Excel-based, not database-based.
- Player updates are written directly back to `backend/excel/Players.xlsx`.
- The backend exposes Swagger docs via `swagger-jsdoc` and `swagger-ui-express`.
- `server.js` dynamically logs available local IP addresses on startup.

### Frontend

- Uses Angular standalone components and reactive signals.
- `AuthService` stores only login state and role in memory.
- No persistent session or token storage is implemented.
- `AuctionService` provides helper methods for loading auction data and submitting a sale.

### Current Role Behavior

- The app treats `bidder` and `readonly` as equivalent in access control.
- Both roles are allowed to view the player list but cannot access the admin page.

## Running the Application

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### Notes

- Confirm `frontend/src/assets/config.json` points to the actual backend host.
- Default backend host is `http://localhost:3000` or a local network IP such as `http://192.168.1.8:3000`.
- Swagger docs are available at `http://<backend-host>:3000/api-docs`.

## When Changing User Data

- Update `backend/excel/Players.xlsx` sheet 5 with rows containing `Email`, `Name`, and `Role`.
- Valid roles are `admin`, `bidder`, and `readonly`.
- An invalid or missing role will prevent login.

## Recommended Future Improvements

- Add password-based authentication or token-based sessions.
- Separate bidder and readonly behavior if needed.
- Add backend-side role validation for sell actions.
- Add more robust Excel validation and error reporting.
- Add tests for frontend route protection and backend Excel persistence.
