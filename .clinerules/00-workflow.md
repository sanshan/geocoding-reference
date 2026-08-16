# Development workflow

These instructions are mandatory.

Before modifying code:

1. Read the relevant existing files first.
2. Inspect surrounding code and existing conventions.
3. Identify affected callers, imports, tests, configuration, and public APIs.
4. Prefer the smallest change that correctly solves the task.
5. Do not modify unrelated code.
6. Do not introduce a new abstraction if an existing one is suitable.
7. Do not introduce new dependencies without a clear reason.
8. Never disable TypeScript, ESLint, tests, or validation to make code pass.
9. Never use `any` as a workaround for a typing problem.
10. Never claim that a command succeeded unless you actually executed it.

When working with an external framework or library:

1. Do not rely on remembered APIs if Context7 is available.
2. Use Context7 to check current documentation.
3. Follow the installed version used by this repository.

After making changes:

1. Format affected files.
2. Run affected typecheck.
3. Run affected lint.
4. Run affected tests.
5. Run the affected build when appropriate.
6. Fix failures caused by your changes.
7. Report commands executed and their results.

Do not silently ignore failures.

## Documentation lookup

When working with external libraries, frameworks, SDKs, tools, configuration formats, or APIs:

- Use Context7 before making assumptions about their current API.
- Prefer documentation matching the version installed in this repository.
- Do not invent configuration properties or framework APIs.
- Do not ask the user to provide documentation if Context7 can retrieve it.