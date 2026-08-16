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

``` bash
pnpm install
```

Start the application:

``` bash
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