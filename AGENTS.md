<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

## General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects,
  targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e.
  `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using
  globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed
  without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST
  before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# Workspace Agent Rules

These rules apply to the entire Nx workspace.

More specific `AGENTS.md` files MAY exist inside projects or directories.
When working in such a directory, the nearest applicable `AGENTS.md` defines
project-specific architecture and conventions in addition to this file.

Do NOT duplicate project-specific architecture rules here.

## Nested Agent Instructions

Before modifying any file, MUST check the target file's directory and its
ancestor directories for a more specific `AGENTS.md`.

When a nested `AGENTS.md` exists:

- MUST read it before making changes in its scope;
- MUST follow both root and nested instructions;
- nested instructions take precedence for project-specific rules;
- MUST NOT modify files in that scope using only the root instructions.

## 1. Workspace Tooling

This repository is an Nx monorepo managed with pnpm.

...

## 1. Workspace Tooling

This repository is an Nx monorepo managed with pnpm.

MUST:

- use `pnpm` for package management;
- use Nx targets for workspace tasks when a target exists;
- preserve the existing workspace layout and Nx project boundaries;
- inspect the target project's configuration before changing build/test/serve behavior.

MUST NOT:

- use `npm install`, `yarn`, or another package manager;
- create an additional lockfile;
- bypass Nx with ad-hoc commands when an equivalent Nx target exists;
- introduce a second build/test/lint system for a project without a concrete requirement.

Prefer:

```bash
pnpm nx <command>
pnpm nx run <project>:<target>
pnpm nx run-many -t <target>
```

## 2. Package Management

Dependencies MUST be installed at the narrowest correct scope.

Workspace-wide development tooling belongs in the root package:

```bash
pnpm add -Dw <package>
```

A dependency used by only one application/package MUST be added to that project's package:

```bash
pnpm --filter <project-package-name> add <package>
pnpm --filter <project-package-name> add -D <package>
```

MUST:

- classify dependencies correctly as runtime or development dependencies;
- reuse workspace catalog versions when the repository already manages that dependency through the pnpm catalog;
- keep project package manifests minimal;
- update `pnpm-lock.yaml` whenever dependency resolution changes.

MUST NOT:

- add an application runtime dependency to the workspace root merely because it is convenient;
- duplicate a dependency across packages without need;
- manually edit resolved package versions in `pnpm-lock.yaml`;
- commit a second lockfile;
- add a package before checking whether the workspace already provides the required capability.

Before adding a dependency, check whether an existing dependency or Nx plugin already solves the problem.

## 3. Nx Projects and Boundaries

Every application or library MUST remain an explicit Nx project.

Before modifying a project, inspect it when necessary:

```bash
pnpm nx show project <project>
```

Use the Nx project name shown by Nx. Do NOT infer project names solely from directory names or `package.json`.

Project dependencies MUST reflect actual source/build relationships.

MUST NOT:

- create hidden cross-project dependencies through relative imports;
- reach into another project's private source tree;
- make unrelated projects depend on each other to share one small helper;
- weaken project boundaries merely to make an import compile.

If code genuinely needs to be shared by multiple projects, extract it into an appropriate workspace library rather than
importing private application internals.

Do NOT create a shared library preemptively. Shared code MUST have a real cross-project consumer.

## 4. Nx Generators

Prefer official Nx generators for creating Nx-managed applications, libraries, configuration, and framework integration.

Before using an unfamiliar generator, inspect its options:

```bash
pnpm nx g <generator> --help
```

Use dry-run when the generator may touch multiple workspace files:

```bash
pnpm nx g <generator> ... --dry-run
```

MUST:

- review generated changes before accepting them;
- adapt generated defaults to existing workspace conventions;
- keep project names, versions, package names, and paths consistent with this repository;
- remove temporary/generated projects used only for inspecting Nx output.

MUST NOT:

- blindly accept generator output;
- overwrite established workspace configuration with generator defaults;
- manually recreate complex Nx configuration when the official generator already provides the required integration;
- keep sample endpoints/tests/configuration that do not belong to the actual project.

Generated code is a starting point, not an architectural authority.

## 5. Nx Plugins and Configuration

Use Nx plugins intentionally.

Before adding or removing an Nx plugin:

1. determine which project/target requires it;
2. check whether it is referenced by `nx.json`, project configuration, or inferred targets;
3. ensure the corresponding package is installed;
4. verify the project graph and affected targets afterward.

A plugin referenced in Nx configuration MUST exist in workspace dependencies.

MUST NOT remove an Nx package solely because no source file imports it. Nx plugins may be loaded from workspace
configuration.

When changing `nx.json`, project configuration, executors, inferred targets, or plugin configuration, verify the
resulting project configuration with Nx.

## 6. TypeScript and Source Conventions

Use TypeScript for application source unless an existing tool/configuration specifically requires JavaScript.

MUST:

- preserve the repository's strict TypeScript settings;
- use explicit types at architectural/public boundaries;
- use `import type` for type-only imports where appropriate;
- follow existing naming and directory conventions;
- keep files focused on one clear responsibility.

MUST NOT:

- weaken global TypeScript settings to fix a local type error;
- introduce `any` as a shortcut around a known type;
- disable lint/type checks globally to accommodate one change;
- add broad compiler exclusions to hide broken source.

Fix type errors at their source.

## 7. Formatting and Linting

Use the repository's existing formatting and lint configuration.

MUST NOT:

- introduce project-local formatting rules that conflict with root configuration without a requirement;
- reformat unrelated files;
- mix architectural changes with large cosmetic rewrites.

When formatting is required, use the workspace-installed tooling through pnpm/Nx.

Keep diffs focused.

## 8. Configuration and Environment

Runtime configuration MUST be supplied through the repository's established configuration mechanism.

MUST:

- keep secrets out of source control;
- document newly required environment variables;
- provide safe local-development defaults only where appropriate;
- keep environment-specific values outside application source.

MUST NOT:

- commit credentials, tokens, passwords, or private keys;
- hardcode machine-specific absolute paths;
- assume a developer's local username, home directory, port ownership, or globally installed tools.

Commands and configuration MUST work from the repository root unless explicitly documented otherwise.

## 9. Generated and Temporary Files

Do NOT commit build output, caches, temporary files, IDE state, or generated artifacts that are already excluded by
repository conventions.

Examples include:

```text
node_modules/
dist/
coverage/
.nx/
out-tsc/
*.tsbuildinfo
```

Temporary projects/files created to inspect generator behavior MUST be removed once they have served their purpose.

Do NOT modify generated output as a substitute for changing its source/configuration.

## 10. Tests

Put tests at the level owned by the project being changed.

Root workspace rules define orchestration only; project-specific `AGENTS.md` files define testing architecture.

MUST:

- use the project's configured Nx test target;
- add or update tests when behavior changes;
- keep deterministic tests independent from external services unless the target explicitly represents an
  external/integration check.

MUST NOT:

- make a default unit-test target depend on public network availability;
- delete or skip a failing test merely to make the workspace green;
- use `passWithNoTests` as justification for omitting tests for implemented behavior.

## 11. Required Verification

Before declaring a workspace change complete, run the smallest relevant Nx targets that prove the affected projects are
healthy.

For a single project, prefer:

```bash
pnpm nx run <project>:test
pnpm nx run <project>:build
```

Run lint/typecheck targets when they exist and the change can affect them.

For changes spanning multiple projects, use Nx orchestration:

```bash
pnpm nx run-many -t test build
```

For workspace/Nx configuration changes, additionally verify that Nx can construct the project graph and resolve the
affected project configuration.

Useful checks include:

```bash
pnpm nx show project <project>
pnpm nx graph
```

`nx graph` MAY be replaced by another non-interactive project-graph command when interactive graph output is not useful
in the current environment.

Project-specific `AGENTS.md` files MAY require additional checks. Those checks are mandatory for changes in their scope.

MUST NOT declare work complete with:

- failing relevant tests;
- build/type errors;
- broken Nx project discovery;
- unresolved Nx plugin errors;
- an inconsistent lockfile;
- known dependency-boundary violations.

If a required check cannot be run, explicitly state which check was not run and why.

## 12. Change Discipline

Before modifying the workspace:

1. identify the affected Nx project or projects;
2. read the nearest applicable `AGENTS.md`;
3. inspect existing project/package configuration;
4. determine whether the change belongs at root or project scope;
5. use existing Nx/package conventions before inventing new ones;
6. make the smallest coherent change;
7. run the relevant verification targets.

STOP and reconsider the design if a proposed change requires:

- installing project-specific runtime dependencies at root;
- importing private source from another application;
- weakening global TypeScript/lint rules for one project;
- duplicating Nx configuration without need;
- bypassing an existing project-specific `AGENTS.md`;
- adding tooling that duplicates an existing workspace capability;
- changing unrelated projects merely to make one project work.

Keep workspace-level concerns at workspace level and project-specific architecture inside the owning project.