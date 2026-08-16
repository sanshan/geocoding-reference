# NestJS

- Controllers handle HTTP/transport concerns.
- Controllers must not contain business logic.
- Business logic belongs in services or use cases.
- Keep infrastructure concerns separate from application logic.
- Use dependency injection.
- Validate incoming DTOs.
- Do not expose persistence models directly through HTTP responses.
- Keep module boundaries explicit.
- Avoid circular dependencies.
- Avoid `forwardRef` unless there is no reasonable architectural alternative.
- Prefer constructor injection.
- Keep database queries out of controllers.
- Map infrastructure errors to appropriate application/API errors.
- Keep configuration strongly typed.