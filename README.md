# Geocoding

Version: 1.0.0

A full-stack geocoding service built as an Nx monorepo.

The application provides:

-   external geographic dataset import;
-   location search with autocomplete support;
-   reverse geocoding by coordinates;
-   interactive map integration.

## Architecture

The project is organized as an Nx workspace:

    apps/
    ├── api        # NestJS backend
    └── web        # React frontend

## Technology Stack

### Backend

-   Node.js
-   NestJS
-   TypeScript
-   TypeORM
-   PostgreSQL
-   PostGIS

### Frontend

-   React
-   TypeScript
-   Leaflet
-   OpenStreetMap tiles

### Infrastructure

-   Docker Compose
-   PostgreSQL/PostGIS container
-   Dedicated migration container
-   nginx for frontend delivery

## Running locally

Requirements:

-   Docker
-   Docker Compose
-   Node.js 24+
-   pnpm

Install dependencies:

```bash
pnpm install
```

Start the application:

```bash
docker compose up --build
```

The startup flow:

    database
        |
        | healthcheck
        v
    migrations
        |
        | completed successfully
        v
    api
        |
        v
    web

Frontend:

    http://localhost:4200

API:

    http://localhost:3000

## Testing

The repository separates fast automated tests, service-level API E2E tests, browser E2E tests, and an explicit external-provider smoke test. This keeps the normal development and CI test path deterministic while still providing a way to verify the real GeoNames integration when required.

### Unit and integration tests

Run the regular test targets across the workspace:

```bash
pnpm nx run-many -t test
```

These tests cover application logic, HTTP controllers, persistence behavior, dataset parsing, and frontend components without depending on the live external dataset provider.

### API E2E tests

Run the backend E2E suite with:

```bash
pnpm nx run @geocoding/api-e2e:e2e
```

The automated API E2E environment deliberately does **not** download the ZIP dataset from GeoNames. Nx starts a small local fixture HTTP server from `apps/api-e2e/scripts/fixture-server.mjs`, which serves the committed `apps/api-e2e/fixtures/US.zip`. The API process is then started with `DATASET_URL` pointing to that local server.

This preserves the real HTTP download and ZIP-processing path while removing an external network dependency from the automated suite. As a result, E2E runs are reproducible, fast, and are not affected by provider availability, rate limits, network failures, or upstream dataset changes.

### Browser E2E tests

The React application is covered by Playwright E2E tests:

```bash
pnpm nx run @geocoding/web-e2e:e2e
```

Playwright starts the complete test stack: a local dataset fixture server, the real API, and the web application. The API again receives `DATASET_URL` pointing to the local fixture server rather than GeoNames. The suite exercises the user-facing import, search, and reverse-geocoding workflows against the running application.

The browser E2E fixture is stored in `apps/web-e2e/fixtures/US.zip` and is served by `apps/web-e2e/scripts/fixture-server.mjs`.

### Manual external-provider E2E smoke test

The real GeoNames integration is intentionally tested separately because it crosses the system boundary and depends on a third-party service. Run it explicitly with:

```bash
pnpm nx run @geocoding/api:test:external
```

Unlike the automated E2E suites, this test uses the configured external `DATASET_URL` and streams the real GeoNames dataset. It verifies that the provider is reachable and that the current upstream archive can still be downloaded, decompressed, parsed, and mapped into application records.

This test is intended for manual verification of the external integration, for example before a release or while diagnosing provider-related issues. It should not be treated as part of the deterministic CI gate: a third-party outage or upstream data change should not make the application's normal test suite flaky.

## Database

The project uses PostgreSQL with PostGIS.

PostGIS was selected because geocoding requires spatial operations:

-   storing coordinates;
-   spatial indexing;
-   future distance and nearest-location queries.

Coordinates are stored using:

    geography(Point,4326)

with a GiST spatial index.

## Data Import

The application supports importing ZIP code data from an external
dataset.

The import flow:

    External dataset
            |
            v
    Import use case
            |
            v
    Repository
            |
            v
    PostgreSQL/PostGIS

The import process is implemented as an application workflow rather than
manual database loading.

## API

### Health check

    GET /api/health

### Search locations

Autocomplete search supports:

-   ZIP code;
-   city name;
-   partial input.

Example:

    GET /geocoding/search?q=90210

### Reverse geocoding

Find location information by coordinates:

    GET /geocoding/reverse?latitude=34.09&longitude=-118.4

## Frontend

The UI provides two connected workflows.

### Search

-   User enters a location query.
-   Suggestions are loaded from the backend.
-   Selecting a result moves the map and places a marker.

### Map interaction

-   User clicks on the map.
-   Coordinates are sent to reverse geocoding.
-   The resolved location is displayed in the interface.

## Technical decisions

### Why PostGIS?

A regular relational database can store coordinates, but PostGIS
provides:

-   spatial data types;
-   spatial indexes;
-   future support for geographic queries.

### Why separate migration container?

Database schema changes should not be coupled with application startup.

The migration container:

-   waits for database readiness;
-   applies migrations;
-   exits successfully;
-   allows API startup only after schema preparation.

## What I would improve with more time

-   better fuzzy search ranking;
-   pagination;
-   distributed caching;
-   background import workers;
-   import progress persistence;
-   API rate limiting;
-   observability metrics and tracing;
-   more integration tests.
