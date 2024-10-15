# Hexabot API

## Hexabot API

[Hexabot](https://hexabot.ai/)'s API is a RESTful API built with NestJS, designed to handle requests from both the UI admin panel and various communication channels. The API powers core functionalities such as chatbot management, message flow, NLU (Natural Language Understanding), and plugin integrations.

### Key Features

* **RESTful Architecture:** Simple, standardized API architecture following REST principles.
* **Multi-Channel Support:** Handles requests from different communication channels (e.g., web, mobile).
* **Modular Design:** Organized into multiple modules for better scalability and maintainability.
* **Real-Time Communication:** Integrates WebSocket support for real-time features.

### API Modules

The API is divided into several key modules, each responsible for specific functionalities:

#### Core Modules

* **Analytics:** Tracks and serves analytics data such as the number of messages exchanged and end-user retention statistics.
* **Attachment:** Manages file uploads and downloads, enabling attachment handling across the chatbot.
* **Channel:** Manages different communication channels through which the chatbot operates (e.g., web, mobile apps, etc.).
* **Chat:** The core module for handling incoming channel requests and managing the chat flow as defined by the visual editor in the UI.
* **Knowledge Base:** Content management module for defining content types, managing content, and configuring menus for chatbot interactions.
* **NLU:** Manages NLU entities such as intents, languages, and values used to detect and process user inputs intelligently.
* **Plugins:** Manages extensions and plugins that integrate additional features and functionalities into the chatbot.
* **User:** Manages user authentication, roles, and permissions, ensuring secure access to different parts of the system.
* **Extensions:** A container for all types of extensions (channels, plugins, helpers) that can be added to expand the chatbot's functionality.
* **Settings:** A module for management all types of settings that can be adjusted to customize the chatbot.

#### Utility Modules

* **WebSocket:** Adds support for Websicket with Socket.IO, enabling real-time communication for events like live chat and user interactions.
* **Logger:** Provides logging functionality to track and debug API requests and events.

### Installation

```bash
$ npm install
```

### Running the app in standalone

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

### Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

### Migrations

The API includes a migrations feature to help manage database schema and data changes over time. Migrations allow you to apply or revert changes to the database in a consistent and controlled manner.

#### Creating a Migration

You need to navigate to the `api` folder to run the following commands. To create a new migration, use the following command:

```bash
$ npm run create-migration <migration-name>
```

Example:

```bash
$ npm run create-migration all-users-language-fr
```

This command generates a new migration file in the `./migrations` folder. The file will look like this:

```typescript
import getModels from '@/models/index';

export async function up(): Promise<void> {
  // Write migration here
}

export async function down(): Promise<void> {
  // Write migration here
}
```

Within the migration file, you can define the changes to be made in the up() function. For example, if you want to update the language field of all users to 'fr', your migration might look like this:

```typescript
import getModels from '@/models/index';

export async function up(): Promise<void> {
  const { UserModel } = await getModels();
  await UserModel.updateMany({}, { language: 'fr' });
}

export async function down(): Promise<void> {}
```

#### Running Migrations Up

All migrations are run automatically when the app starts.

Alternatively, you can run the following command in the `root` directory to run all pending migrations:

```bash
$ make migrate-up
```

#### Running Migrations Manually

If you want to run specific actions manually, you need to gain access to the `api` container and use the following command to run what you specifically want:

```bash
$ npm run migrate -h
```

### Documentation

Access the Swagger API documentation by visiting the API url `/docs` once run it in development mode.

It's also possible to access the API reference documentation by running `npm run doc`.

For detailed information about the API routes and usage, refer to the API documentation or visit [https://docs.hexabot.ai](https://docs.hexabot.ai).
