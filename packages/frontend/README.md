# Hexabot UI Admin Panel

The [Hexabot](https://hexabot.ai/) UI Admin Panel is a React single-page application powered by Vite and React Router that serves as the admin interface for managing chatbot configurations, workflows, and interactions.

Workflow graph building, layout, and rendering are now provided by the dedicated `@hexabot-ai/graph` package. The frontend package owns editor orchestration, workflow CRUD, drawers/forms, and route/state integration around that graph component.


## Key Features
- **Visual Editor:** An intuitive workflow editor powered by `@hexabot-ai/graph`, with frontend-managed actions, forms, and workflow state.
- **Multi-Channel Management:** Configure and manage multiple communication channels (e.g., web, mobile, social media) from a single interface.
- **Analytics Dashboard:** Track user interactions, messages sent, and retention rates through detailed analytics.
- **Knowledge Base:** Seamlessly integrate and manage content such as product catalogs, lists of stores, or any dynamic content needed by the chatbot.
- **User, Roles, and Permissions:** Administer user access controls, roles, and permissions to ensure secure and appropriate access to different parts of the system.

## Directory Structure
- **app-components/:** Reusable components that are used across the admin panel.
- **components/:** Feature-level modules, including the visual editor integration at `components/visual-editor/v4`.
- **contexts/:** Global and feature contexts used by providers/hooks.
- **hooks/:** Shared hooks, including CRUD and routing helpers.
- **layout/:** Authenticated/public shell and theme setup.
- **providers/:** App-level providers (auth, permissions, API client).
- **routes/:** Centralised route configuration for the React Router SPA.
- **services/:** API service calls to interact with the Hexabot API.
- **config/:** Runtime config and app bootstrap constants.
- **types/:** Defines the typescript interfaces, types, and enums used.
- **websocket/:** Socket utilities and subscriptions.
- **i18n/:** Translation initialization and locale loading config.
- **styles/:** Global and component-specific styles for the application.
- **utils/:** Utility functions and helpers used throughout the frontend.

## Theming

MUI theme customization is centralized in `packages/frontend/src/layout/theme` (theme primitives, component overrides, and theme composition via `AppTheme`).

## Development

This package is part of the Hexabot PNPM workspace alongside API, widget, graph, types, and other packages. Run commands from the repository root so Turborepo can orchestrate tasks efficiently.

```bash
pnpm --filter @hexabot-ai/frontend run dev       # start the admin interface with Vite
pnpm --filter @hexabot-ai/frontend run build     # type-check and compile production assets
pnpm --filter @hexabot-ai/frontend run preview   # serve the built bundle locally
pnpm --filter @hexabot-ai/graph run dev          # watch/rebuild graph package while editing shared graph internals
```

The admin interface is exposed on http://localhost:8080 by default.

Hexabot also provides a live chat widget package that can be launched in parallel when working on widget integrations:

```bash
pnpm --filter @hexabot-ai/widget run dev
```

To run all workspace dev tasks (including `@hexabot-ai/frontend` and `@hexabot-ai/graph`), use `pnpm dev` from the repository root.

The chat widget development server listens on http://localhost:5173.

### Environment variables

Create a `.env.local` (or `.env`) file inside `packages/frontend/` to override defaults that are read at build-time:

```
VITE_API_ORIGIN=http://localhost:4000
VITE_SSO_ENABLED=false
VITE_UPLOAD_MAX_SIZE_IN_BYTES=20971520
VITE_DEFAULT_LANGUAGE=en
```

The `ConfigProvider` consumes these values on the client, so rebuilding is required after any change.

## Contributing 
We welcome contributions from the community! Whether you want to report a bug, suggest new features, or submit a pull request, your input is valuable to us.

Feel free to join us on [Discord](https://discord.gg/rNb9t2MFkG)


## License

Copyright (c) 2025 Hexastack.

This project is licensed under the **Fair Core License, Version 1.0**, with **Apache License 2.0** as the future license (abbrev. **FCL-1.0-ALv2**).

**Change date.** For each version of the software, the Fair Core License converts to Apache-2.0 on the **second anniversary** of the date that version is made available.

**Commercial features & license keys.** Certain features of Hexabot are protected by license-key checks. You **must not** remove, modify, disable, or circumvent those checks, nor enable access to protected functionality without a valid license key.

**Competing uses (non-compete).** Use that competes with Hexastack’s business—for example, offering Hexabot (or a substantially similar service) as a hosted or commercial product—is not permitted until the conversion to Apache-2.0 for the applicable version.

**Redistribution.** If you distribute copies, modifications, or derivatives, you must include this license and not remove copyright or proprietary notices.

**Patents.** A limited patent license is granted for permitted uses and terminates on patent aggression.

**Trademarks.** “Hexabot” and “Hexastack” are trademarks. Except to identify Hexastack as the origin of the software, no trademark rights are granted.

**Disclaimer.** The software is provided “AS IS,” without warranties or conditions of any kind, and Hexastack will not be liable for any damages arising from its use.
