# Modular Form Creator

A React + TypeScript frontend project for an application that manages resources and form modules.

## What has been done

1. Frontend integrated with the backend
   - Added `src/api/client.ts` as an HTTP layer for communication with the backend.
   - Added `src/api/resources.ts` with methods for fetching and updating resources according to the API contract.

2. Pages and navigation
   - `src/App.tsx` configures routing for the pages:
     - resource list
     - resource overview
     - resource details
     - Basic Info module
     - Project Details module
   - Each page uses the `PageShell` component for a consistent layout.

3. Data model and edit context
   - `src/types/resources.ts` defines the data types for the resource, Basic Info module, and Project Details.
   - `CompletedResourceEditContext` + `useCompletedResourceEdits` buffer local changes for resources with `completed` status.
   - For completed resources, module changes are stored locally and can only be saved to the backend on the resource details page.

4. Basic Info form
   - `src/pages/BasicInfoPage.tsx` handles editing the owner, email, description, and priority.
   - Validation was added for all form fields.
   - For the email field, the format is verified for `@` and a `.com` ending.
   - Validation errors are displayed next to the corresponding fields.
   - The form has a more pleasant style and a readable layout.

5. Design and styling
   - `styled-components` were used to style the layout and forms.
   - Pages use consistent cards, buttons, and form fields.

6. Docker and running the project
   - Added configuration for the frontend service in `docker-compose.yml`.
   - The frontend has been prepared to run in a container on port `5173`.

## Main files

- `src/App.tsx` — router and context provider
- `src/components/PageShell.tsx` — shared wrapper for pages
- `src/api/client.ts` — helper for HTTP requests
- `src/api/resources.ts` — CRUD methods for resources
- `src/contexts/CompletedResourceEditContext.tsx` / `src/contexts/completedResourceEditStore.ts` / `src/contexts/useCompletedResourceEdits.ts` — buffering of local edits
- `src/pages/ResourcesListPage.tsx` — resource list
- `src/pages/ResourceOverviewPage.tsx` — resource overview and actions
- `src/pages/ResourceDetailsPage.tsx` — saving local changes for completed resources
- `src/pages/BasicInfoPage.tsx` — Basic Info form with validation
- `src/pages/ProjectDetailsPage.tsx` — Project Details form
- `src/pages/resourceHelpers.ts` — shared helper functions
- `src/types/resources.ts` — data types and contracts

## How to run

1. In the project directory, run:
   - `npm install`
   - `npm run dev -- --host 0.0.0.0 --port 5173`

2. Open the frontend:
   - `http://localhost:5173/`

If you want to run the whole stack in Docker, use `docker-compose up` from the project's root directory.

## Project status

- Frontend build (`npm run build`) works correctly.
- Lint (`npm run lint`) reports no errors.
- The Basic Info form has validation support and a readable interface.
