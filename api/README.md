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
$ npm install
```

## Running the app in standalone

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Migrations

Hexabot includes a migration module to help manage database schema and data changes over time. Migrations allows us to apply or revert changes to the database and keep it in sync with the version release.

Check the Migration README file for more : [Migration Module](./src/migration/README.md)

## Documentation

Access the Swagger API documentation by visiting the API url `/docs` once run it in development mode.

It's also possible to access the API reference documentation by running `npm run doc`.

For detailed information about the API routes and usage, refer to the API documentation or visit [https://docs.hexabot.ai](https://docs.hexabot.ai).

## Contributing

We welcome contributions from the community! Whether you want to report a bug, suggest new features, or submit a pull request, your input is valuable to us.

Feel free to join us on [Discord](https://discord.gg/rNb9t2MFkG)

## License

This software is licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:

1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
