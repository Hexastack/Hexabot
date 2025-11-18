# Hexabot CLI

This document distills the current behavior of the Hexabot CLI and acts as a quick reference for extending or coordinating the CLI subcommands that orchestrate Hexabot projects.

## Runtime & Bootstrap

- **Entry point**: `src/index.ts` is compiled to `dist/index.js` and exposed through the `hexabot` binary (`package.json` `bin` field).
- **Prerequisite gate**: Every invocation prints an ASCII banner, then `checkPrerequisites()` ensures Docker is reachable and Node.js ≥ 20.18.1 before any command logic runs (`src/index.ts:35-40`, `src/lib.ts:11-51`).
- **Working folder**: The CLI expects a `docker/` sibling of the active working directory (`src/index.ts:41`). Commands touching containers or env files will exit early if this folder is missing (`src/lib.ts:73-91`).

## Subcommand Catalog

| Command | Responsibilities | Options & IO | Implementation Notes |
| --- | --- | --- | --- |
| `create <projectName>` | Scaffold a new Hexabot project from the latest release of a template repo, emit onboarding hints (`src/index.ts:52-129`). | `--template` overrides the default `hexastack/hexabot-template-starter`. Downloads the release ZIP via GitHub's API and extracts it into `<projectName>/`. | Enforces a lowercase/digit/dash slug (`validateProjectName()`, `src/lib.ts:179-188`). Uses `downloadAndExtractTemplate()` to fetch and unzip while stripping the top-level folder (`src/lib.ts:190-214`). |
| `init` | Duplicate `docker/.env.example` to `docker/.env` without overwriting existing files (`src/index.ts:135-153`). | No options. | Executes entirely on the host filesystem but guards against a missing `docker/` directory. |
| `start` | Compose and boot the requested services with the default stack (`src/index.ts:155-170`). | `--services nlu,ollama` translates to additional compose files layered via `generateComposeFiles()`. | Runs `docker compose up -d`. Empty `--services` falls back to core compose file only because `parseServices('')` yields `[]`. |
| `dev` | Same as `start`, but includes `docker-compose.dev.yml` and service-specific `*.dev.yml` overlays, forcing image rebuilds (`src/index.ts:172-189`). | `--services` identical to `start`. | Executes `docker compose … up --build -d`. |
| `migrate [args…]` | Proxy database migrations to the `api` container (`src/index.ts:191-203`). | Optional trailing args appended to `npm run migrate`. | Uses `dockerExec('api', \`npm run migrate ${args}\`, '--user $(id -u):$(id -g)')` to run as the host user and avoid root-owned artifacts (`src/lib.ts:144-165`). |
| `start-prod` | Launch production overlays (`src/index.ts:206-223`). | Same options as `start`. | Loads `docker-compose.prod.yml` plus any `<service>.prod.yml`. |
| `stop` | Stop active services via `docker compose down` (`src/index.ts:225-240`). | `--services` optionally narrows the compose file set. | Leaves volumes intact. |
| `destroy` | Tear down services and remove volumes (`src/index.ts:242-257`). | `--services` optional. | Invokes `docker compose down -v`. |

## Shared Utilities

- **`generateComposeFiles(folder, services, type?)`** builds an ordered string of `-f` flags beginning with `docker-compose.yml`, then appends files for each requested service, and finally optional global or per-service overlays for `dev`/`prod` modes if the files exist (`src/lib.ts:93-127`). When `services` is empty the command falls back to just the base compose file.
- **`dockerCompose(args)`** and **`dockerExec(container, command, options?)`** simply print the resolved command for traceability, run it synchronously, and exit on failure with a human-readable error (`src/lib.ts:129-165`).
- **`parseServices(list)`** trims whitespace, splits on commas, and removes empty tokens (`src/lib.ts:167-177`), so CLI layers can safely pass empty defaults.
- **`downloadAndExtractTemplate(url, destination)`** persists the release archive to disk (`template.zip`), unzips by stripping the repository root folder, and deletes the temporary ZIP (`src/lib.ts:190-214`). Any error rethrows with a terse message; the caller surfaces it to the user.

## Typical Workflow

1. `hexabot create my-bot` — bootstrap a project from the default template. The command enforces the naming convention, fetches the latest GitHub release, and unpacks it into `./my-bot/`.
2. `cd my-bot && hexabot init` — copy environment defaults (`docker/.env.example → docker/.env`) before editing.
3. `hexabot dev --services nlu,ollama` — compose the base stack, base service overrides, service-specific dev overlays, and `docker-compose.dev.yml`, then run `docker compose … up --build -d`.
4. `hexabot migrate` — run migrations inside the `api` container as the host user.
5. `hexabot stop|destroy --services api` — stop or fully remove the targeted services and volumes.

## Extending the CLI

- **Adding a new subcommand**: Define a new `program.command()` block inside `src/index.ts`, referencing shared helpers wherever possible. Place long-running or cross-command helpers in `src/lib.ts` for reuse.
- **Service-aware commands**: Reuse `parseServices()` and `generateComposeFiles()` so new logic respects the existing layering of compose files and optional service overrides.
- **Safety checks**: Keep the early exit behavior consistent—call `checkDockerFolder()` for any command that expects `docker/` assets and honor the prerequisite validation that runs before command registration.

This file should be updated whenever a command is added, removed, or materially changed so downstream automation or orchestration tooling can rely on up-to-date behavior.
