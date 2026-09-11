# Eicher Job Card & Spares Management

Standalone web application for Eicher tractor service operations, job cards, customers, complaints, staff, attendance and spares.

## Architecture

- React + Vite frontend
- Express API backend
- PostgreSQL database
- Drizzle schema/migrations
- Excel/CSV import and export
- Optional Google Sheets synchronization

The application is **not dependent on Google AI Studio or a Gemini API key**.

## Run locally

1. Install Node.js 20+.
2. Install dependencies:
   `npm install`
3. Create `.env` from `.env.example` and set `DATABASE_URL` to your PostgreSQL database.
4. Start:
   `npm run dev`
5. Open `http://localhost:3000`.

## Production

Build:

`npm run build`

Start:

`npm start`

The Express server serves both the API and the built React application.

## Database

The server expects PostgreSQL through `DATABASE_URL`. The old Google AI Studio Cloud SQL fallback has been removed so the application can be deployed independently.

Before first use, create/update the PostgreSQL schema using the project's Drizzle configuration/migration workflow.

## Environment

Do not commit `.env`, database passwords, API keys, or service-account credentials.
