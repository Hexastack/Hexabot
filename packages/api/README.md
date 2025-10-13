# Hexabot API

[Hexabot](https://hexabot.ai/)'s API is a RESTful API built with NestJS, designed to handle requests from both the UI admin panel and various communication channels. The API powers core functionalities such as chatbot management, message flow, NLU (Natural Language Understanding), and plugin integrations.

## Key Features

- **RESTful Architecture:** Simple, standardized API architecture following REST principles.
- **Multi-Channel Support:** Handles requests from different communication channels (e.g., web, mobile).
- **Modular Design:** Organized into multiple modules for better scalability and maintainability.
- **Real-Time Communication:** Integrates WebSocket support for real-time features.

## API Modules

The API is divided into several key modules, each responsible for specific functionalities:

### Core Modules

- **Analytics:** Tracks and serves analytics data such as the number of messages exchanged and end-user retention statistics.
- **Attachment:** Manages file uploads and downloads, enabling attachment handling across the chatbot.
- **Channel:** Manages different communication channels through which the chatbot operates (e.g., web, mobile apps, etc.).
- **Chat:** The core module for handling incoming channel requests and managing the chat flow as defined by the visual editor in the UI.
- **Knowledge Base:** Content management module for defining content types, managing content, and configuring menus for chatbot interactions.
- **NLU:** Manages NLU (Natural Language Understanding) entities such as intents, languages, and values used to detect and process user inputs intelligently.
- **Plugins:** Manages extensions and plugins that integrate additional features and functionalities into the chatbot.
- **User:** Manages user authentication, roles, and permissions, ensuring secure access to different parts of the system.
- **Extensions:** A container for all types of extensions (channels, plugins, helpers) that can be added to expand the chatbot's functionality.
- **Settings:** A module for management all types of settings that can be adjusted to customize the chatbot.

### Utility Modules

- **WebSocket:** Adds support for Websicket with Socket.IO, enabling real-time communication for events like live chat and user interactions.
- **Logger:** Provides logging functionality to track and debug API requests and events.

## Installation

```bash
$ pnpm install
```

## Development Commands

Run all commands from the repository root so PNPM can resolve workspace dependencies:

```bash
pnpm --filter @hexabot/api run dev          # start the API with watch mode
pnpm --filter @hexabot/api run start:debug  # run with inspector attached
pnpm --filter @hexabot/api run start:prod   # run the compiled build
```

### Testing

```bash
pnpm --filter @hexabot/api run test      # unit tests
pnpm --filter @hexabot/api run test:e2e  # end-to-end tests
pnpm --filter @hexabot/api run test:cov  # collect coverage
```

## Migrations

Hexabot includes a migration module to help manage database schema and data changes over time. Migrations allows us to apply or revert changes to the database and keep it in sync with the version release.

Check the Migration README file for more : [Migration Module](./src/migration/README.md)

## Documentation

Access the Swagger API documentation by visiting the API url `/docs` once run it in development mode.

It's also possible to access the API reference documentation by running `pnpm --filter @hexabot/api run doc`.

For detailed information about the API routes and usage, refer to the API documentation or visit [https://docs.hexabot.ai](https://docs.hexabot.ai).

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
