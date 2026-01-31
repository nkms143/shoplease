# ShopLease Initialization Plan

## Goal
Migrate the static ShopLease prototype (currently in root) to a dynamic React application using Vite and Material UI.

## Proposed Changes

### 1. File Organization
- **Move Legacy Files:** Move current `index.html`, `css/`, `js/`, and other static files to a new `legacy/` directory to preserve them while clearing the root for the new app.

### 2. Project Scaffolding
- Initialize a new React project in the root: `npm create vite@latest . -- --template react`
- **Dependencies**:
    - `react`, `react-dom`
    - `@mui/material`, `@emotion/react`, `@emotion/styled` (UI Library)
    - `@mui/icons-material` (Icons)
    - `react-router-dom` (Routing)

### 3. Structure
- `src/`
    - `components/` (Reusable UI parts)
    - `pages/` (Login, Dashboard)
    - `layouts/` (MainLayout with Sidebar)
    - `theme/` (MUI Theme config)

### 4. Cleanup
- Remove default Vite Logo, `App.css`, `index.css` (we will use MUI's CssBaseline).

## User Review Required
- **Breaking Change**: The current static `index.html` will be moved. The site will effectively be "down" or replaced by the Vite dev server until built.