# API Agent Rules

These rules are mandatory for every change under `apps/api`.

## 1. Architecture

The API uses strict layered boundaries:

```text
domain
  ↑
application
  ↑
infrastructure
  ↑
presentation
```

Source-code dependencies MUST point inward.

- `domain` MUST NOT depend on application, infrastructure, or presentation.
- application source code MAY depend on domain and application-level framework abstractions such as `EventBus`.
- infrastructure MAY depend on application ports and domain/application types.
- presentation MAY depend on application and domain types.
- presentation MUST NOT depend on concrete infrastructure.
- domain and application business code MUST NOT import concrete infrastructure or presentation code.
- A change MUST NOT bypass a layer merely to reduce the number of files.

`application/application.module.ts` is a composition boundary and MAY import `InfrastructureModule` only to assemble runtime dependencies. This exception does NOT permit use cases, ports, events, or other application source files to import infrastructure code.

Before implementing a change, identify which layer owns the behavior.

## 2. Domain

Domain code lives under:

`src/app/domain`

Domain code MUST contain domain models, value objects, and domain behavior only.

Domain code MUST NOT import:

- NestJS;
- TypeORM;
- HTTP types;
- Zod schemas or pipes;
- configuration;
- dataset providers;
- infrastructure adapters;
- presentation DTOs.

Persistence-generated state MUST NOT be forced into creation models. When creation and persisted representations differ, use separate types such as `NewLocation` and `Location`.

## 3. Application

Application code lives under:

`src/app/application`

It owns:

- use cases;
- application ports;
- application events;
- application-level orchestration.

### Use cases

Every focused application operation or orchestration flow MUST be represented by a use case.

A use case MUST:

- live under `application/use-cases/<use-case-name>/`;
- expose its operation through `execute(...)`;
- receive dependencies through constructor injection;
- depend on application ports rather than concrete adapters;
- use domain/application types;
- be registered in `ApplicationModule`;
- be exported from `ApplicationModule` when presentation consumes it.

A use case MUST NOT:

- import TypeORM entities or repositories;
- import concrete infrastructure adapters;
- execute SQL;
- know about HTTP routes, status codes, query parameters, SSE wire format, or response DTOs;
- parse provider-specific transport/file formats;
- access repositories through presentation or infrastructure classes.

Do NOT add unrelated behavior to an existing use case. Create a separate use case.

## 4. Ports and Dependency Injection

Application ports live only under:

`src/app/application/ports`

A port defines a capability required by application code.

Injectable ports MUST use abstract classes so they can be used as Nest DI tokens:

```ts
export abstract class ExamplePort {
    abstract execute(...): Promise<...>;
}
```

Application code MUST inject the port:

```ts
constructor(private readonly examplePort: ExamplePort) {}
```

Application code MUST NOT inject a concrete adapter.

A port MUST remain responsibility-focused. Do NOT add a method to an existing port merely because the same database or technology can implement it.

Separate capabilities when their application responsibilities differ. Current examples:

- `LocationPort` owns geocoding reads;
- `LocationImportPort` owns import persistence;
- `LocationDatasetProvider` owns access to an external location dataset.

### Port bindings

The infrastructure module that owns an adapter MUST bind the application port to its concrete implementation:

```ts
providers: [
    {
        provide: ExamplePort,
        useClass: ConcreteExampleAdapter,
    },
],
exports: [ExamplePort],
```

Consumers MUST depend on `ExamplePort`, not `ConcreteExampleAdapter`.

Concrete adapters SHOULD remain private to their owning infrastructure module.

If Nest DI cannot resolve a dependency, fix the module import/export/binding relationship. MUST NOT register a provider in an unrelated module merely to make DI succeed.

## 5. Nest Module Hierarchy

Modules MUST be hierarchical, responsibility-based, and separated by layer.

Current composition:

```text
AppModule
└── PresentersModule
    └── HttpModule
        ├── ApplicationModule
        │   ├── InfrastructureModule
        │   │   ├── ApiConfigModule
        │   │   ├── ApiTypeormModule
        │   │   └── DatasetsModule
        │   │       └── GeoNamesDatasetModule
        │   └── CqrsModule
        └── CqrsModule
```

`CqrsModule` is a cross-cutting framework module. It MAY be imported where Nest CQRS services are directly injected, including `ApplicationModule` for publishing events and `HttpModule` for SSE subscriptions.

Ownership rules are strict:

- `ApplicationModule` owns application use cases.
- `InfrastructureModule` composes infrastructure modules.
- technology/feature infrastructure modules own their adapters and port bindings.
- `HttpModule` owns HTTP controllers.
- parent modules compose child modules; they MUST NOT duplicate child provider registrations.

`InfrastructureModule` MUST NOT provide or export application use cases.

`HttpModule` MUST NOT provide infrastructure repositories/adapters.

Do NOT turn `AppModule`, `InfrastructureModule`, `ApplicationModule`, `PresentersModule`, or `HttpModule` into miscellaneous provider containers.

## 6. Infrastructure

Infrastructure code lives under:

`src/app/infrastructure`

Infrastructure implements capabilities defined by application ports.

Concrete adapters MUST:

- implement the corresponding application port;
- be technology/provider specific;
- have explicit names such as `TypeOrmLocationRepository` or `GeoNamesLocationDatasetProvider`;
- translate infrastructure representations before returning data across the boundary.

Infrastructure-specific types MUST NOT leak into application or domain APIs.

## 7. Persistence

TypeORM persistence code lives under:

`src/app/infrastructure/persistence/typeorm`

Responsibilities MUST remain separated:

```text
entities/
mappers/
migrations/
repositories/
```

TypeORM entities are persistence models. They MUST NOT be exposed to application, domain, or HTTP callers.

Repositories MUST:

- implement an application port;
- contain persistence/query logic;
- return domain/application types;
- use persistence mappers when representations differ.

Repositories MUST NOT:

- contain HTTP behavior;
- return HTTP DTOs;
- implement presentation formatting;
- contain unrelated application orchestration.

### Persistence mappers

Mapping between persistence and domain/application representations MUST be centralized in mapper classes.

Use patterns such as:

```ts
LocationMapper.toDomain(entity)
LocationMapper.toDomainArray(entities)
LocationMapper.toPersistence(location)
```

Do NOT scatter manual entity/domain conversion across repositories.

Coordinate ordering MUST be handled at the infrastructure boundary.

Domain/application coordinates use:

```ts
{
    latitude,
    longitude,
}
```

PostGIS `Point` coordinates use:

```ts
[longitude, latitude]
```

This conversion MUST NOT leak into use cases or controllers.

## 8. Database Schema and Migrations

Database schema changes MUST use TypeORM migrations.

- `synchronize` MUST remain disabled.
- Applied migrations MUST NOT be edited to introduce new schema changes.
- New schema changes MUST use a new migration.
- Required query indexes and constraints MUST be represented deliberately.
- Schema generation MUST NOT accidentally remove manually important indexes.
- When TypeORM cannot fully manage a specialized index, preserve it explicitly in entity metadata using the supported non-synchronized index pattern.
- Uniqueness assumptions MUST be verified against the real source dataset before adding unique constraints.

Persistence behavior that depends on PostgreSQL/PostGIS MUST be tested against the real database.

## 9. External Datasets

External dataset implementations belong in infrastructure.

Provider-specific download, archive, file, parsing, and normalization behavior MUST NOT appear in application use cases.

`LocationDatasetProvider` defines the application-facing dataset contract. Concrete providers such as GeoNames MUST implement that contract.

The provider MUST expose normalized application-facing records. Use cases MUST NOT know the GeoNames raw row/file format.

External-network tests MUST remain separate from deterministic unit/integration tests.

Test naming is deliberate:

- `*.e2e-spec.ts` under `apps/api` is reserved for explicit external-adapter smoke tests such as the real GeoNames provider check.
- full application E2E tests MUST live in the separate `apps/api-e2e` project.

Do NOT place full HTTP application E2E tests inside `apps/api`.

## 10. Presentation

HTTP presentation lives under:

`src/app/presenters/http`

Presentation responsibilities MUST remain separated:

```text
controllers/
dto/
mappers/
validation/
```

Controllers MUST be feature-oriented and small.

Current pattern:

```text
controllers/
├── search/
├── reverse-geocode/
└── import-locations/
```

Do NOT create a single large `GeocodingController`.

Create a separate controller when an endpoint represents a distinct operation or interaction model. A feature MAY contain more than one controller when transport responsibilities differ, such as command HTTP endpoints and SSE event streams.

A controller MAY:

- receive HTTP input;
- invoke validation;
- call an application use case;
- map application/domain output to an HTTP DTO;
- define transport-specific status codes and streaming semantics.

A controller MUST NOT:

- query a repository directly;
- inject infrastructure adapters;
- execute SQL;
- contain persistence mapping;
- implement dataset parsing;
- contain application/business logic;
- return TypeORM entities.

## 11. HTTP Validation

Request validation MUST live outside controller method bodies.

Use Zod schemas with `ZodValidationPipe`.

Feature-specific schemas MUST live next to the controller they validate:

```text
search/
├── search.controller.ts
└── search-query.schema.ts
```

Do NOT manually reproduce validation logic inside controllers when the schema can express it.

Validation schemas are presentation concerns and MUST NOT be imported into application or domain code.

## 12. HTTP DTOs and Presentation Mappers

Domain/application objects MUST NOT be used as the public HTTP response contract when a transport representation is required.

HTTP response shapes MUST live under:

`presenters/http/dto`

Conversion from domain/application results to HTTP DTOs MUST live under:

`presenters/http/mappers`

Use explicit mapper methods such as:

```ts
LocationResultMapper.toDto(location)
LocationResultMapper.toDtoArray(locations)
```

Controllers MUST use presentation mappers when domain/application and HTTP representations differ.

Do NOT put HTTP formatting into:

- domain models;
- use cases;
- repositories;
- TypeORM mappers.

Derived presentation fields such as `formattedAddress` belong at the presentation mapping boundary unless they represent actual domain behavior.

## 13. Events and SSE

Application events MUST represent application facts, not transport messages.

Events owned by a use case SHOULD live with that use case:

```text
application/use-cases/import-locations/events/
```

Application code MAY publish application events through `EventBus`.

Application events MUST NOT contain:

- HTTP response objects;
- SSE `MessageEvent` objects;
- controller-specific DTOs;
- transport formatting.

SSE is a presentation concern.

The SSE controller MUST:

- subscribe to relevant application events;
- filter events by the relevant operation/import identifier;
- translate application events into SSE messages;
- keep SSE-specific event names and payload formatting in presentation.

Application use cases MUST NOT know that consumers use SSE.

Do NOT move SSE formatting into application events to save mapping code.

Current `EventBus`/SSE delivery is live-only and non-replayable. Consumers MUST NOT assume that previously published events will be replayed after reconnect or page refresh.

If replay, reconnect recovery, or durable import status becomes a requirement, introduce explicit state/storage for that requirement. MUST NOT add mutable in-memory replay state to the SSE controller.

## 14. Adding a New Use Case

When adding a new use case, perform these steps in order:

1. Identify the owning application operation.
2. Define or reuse the required domain/application types.
3. Define the smallest required application port if external I/O is needed.
4. Add the use case under `application/use-cases/<name>/`.
5. Inject only application ports and other valid application dependencies.
6. Add the infrastructure adapter when a new port requires one.
7. Add infrastructure mapping when infrastructure and application/domain representations differ.
8. Bind the adapter to its port in the owning infrastructure module.
9. Export the port from that infrastructure module when required.
10. Register the use case in `ApplicationModule`.
11. Export the use case from `ApplicationModule` when presentation needs it.
12. Add a focused presentation controller if the operation is exposed over HTTP.
13. Add request schema and response DTO types as required.
14. Add a presentation mapper when output crosses into an HTTP representation.
15. Register the controller in `HttpModule`.
16. Add application events when the operation exposes application lifecycle facts.
17. Add SSE mapping only in presentation when realtime transport is required.
18. Add tests at the appropriate boundaries.
19. Run all required verification commands.

Do NOT bypass ports, mappers, or module boundaries to shorten this process.

## 15. Tests

Tests MUST target the boundary that owns the behavior.

### Use-case tests

Use-case tests MUST:

- mock application ports;
- mock application framework collaborators such as `EventBus` when used;
- test application orchestration and behavior;
- avoid PostgreSQL;
- avoid HTTP.

### Repository/infrastructure tests

Repository tests MUST use the real database when verifying:

- PostgreSQL queries;
- constraints;
- indexes where behavior depends on them;
- PostGIS behavior;
- persistence mapping;
- conflict/idempotency behavior.

### Controller tests

Controller tests MUST:

- mock use cases or transport collaborators as appropriate;
- test HTTP input validation;
- test status codes;
- test parameter forwarding;
- test HTTP/SSE response mapping.

Controller tests MUST NOT require the real database.

### External provider tests

Deterministic provider tests and tests against real external services MUST remain separate.

Tests requiring the real external GeoNames service MUST use the dedicated external test target.

### Full application E2E

Full application E2E tests live in the dedicated `apps/api-e2e` project.

E2E MUST remain a small smoke suite that exercises the real application over HTTP.

The smoke flow SHOULD cover the critical integration path:

```text
HTTP import
→ external dataset
→ application use case
→ persistence
→ application events
→ SSE
→ search
→ reverse geocoding
```

E2E MUST NOT duplicate every validation, repository, or use-case test.

Avoid multiple independent background imports across E2E spec files. Prefer a single sequential smoke flow when operations share the same running API and database.

## 16. Change Discipline

Before writing code, determine:

1. which layer owns the behavior;
2. which application capability is required;
3. whether a new port is required;
4. which module owns the provider;
5. which boundary requires a mapper;
6. which test level owns the expected behavior.

STOP and fix the design if a proposed change requires any of the following:

- `domain` importing application, infrastructure, or presentation;
- application business code importing infrastructure or presentation;
- a controller depending directly on a repository;
- a use case depending on a TypeORM repository/entity;
- a TypeORM entity crossing into application/domain/presentation;
- an infrastructure adapter registered in a presentation module;
- an application use case registered in an infrastructure module;
- bypassing an application port;
- duplicating provider registration in an unrelated parent module;
- transport-specific SSE/HTTP structures inside application events;
- unrelated responsibilities being added to an existing controller, port, repository, or use case.

The only allowed application-to-infrastructure import is composition wiring from `application.module.ts` to `InfrastructureModule`.

Do NOT work around an architectural violation. Correct the boundary.

## 17. Required Verification

Changes under `apps/api` MUST leave the relevant checks green.

At minimum run:

```bash
pnpm nx run @geocoding/api:test
pnpm nx run @geocoding/api:build
```

For changes involving the external dataset/provider, also run:

```bash
pnpm nx run @geocoding/api:test:external
```

For changes affecting application wiring, Nest modules, HTTP, persistence integration, imports, application events, or SSE, also run:

```bash
pnpm nx run @geocoding/api-e2e:e2e
```

When a database migration is added or changed, verify migration discovery/status and apply it to the development/test database before relying on behavior that requires the new schema.

Do NOT declare a task complete with:

- failing tests;
- build errors;
- unresolved Nest dependency-injection errors;
- pending required migrations;
- known layer violations.

If a required check cannot be run, explicitly report which check was not run and why.