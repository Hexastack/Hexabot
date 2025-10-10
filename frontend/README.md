# Hexabot UI Admin Panel

The [Hexabot](https://hexabot.ai/) UI Admin Panel is a React/Next.js application that serves as the admin interface for managing chatbot configurations, workflows, and interactions. The admin panel allows users to easily create and manage chat flows, monitor analytics, manage content, handle NLU (Natural Language Understanding) datasets, and configure system settings.


## Key Features
- **Visual Editor:** An intuitive drag-and-drop interface for managing chat flows, including text messages, quick replies, carousels, and more.
- **Multi-Channel Management:** Configure and manage multiple communication channels (e.g., web, mobile, social media) from a single interface.
- **Analytics Dashboard:** Track user interactions, messages sent, and retention rates through detailed analytics.
- **NLU (Natural Language Understanding) Management:** Manage datasets for training machine learning models for intent detection and language recognition.
- **Knowledge Base:** Seamlessly integrate and manage content such as product catalogs, lists of stores, or any dynamic content needed by the chatbot.
- **User, Roles, and Permissions:** Administer user access controls, roles, and permissions to ensure secure and appropriate access to different parts of the system.

## Directory Structure
- **app-components/:** Reusable components that are used across the admin panel.
- **components/:** Components organized by the page where they are being used.
- **hooks/:** Hooks defined.
- **pages/:** The core of the Next.js application, defining different routes for the admin panel.
- **services/:** API service calls to interact with the Hexabot API.
- **types/:** Defines the typescript interfaces, types, and enums used.
- **styles/:** Global and component-specific styles for the application.
- **utils/:** Utility functions and helpers used throughout the frontend.

## Run
The Hexabot project is structured as a monorepo using npm workspaces to manage multiple packages. The packages in the monorepo include:

- **frontend:** The admin interface for managing the chatbot system.
- **widget:** An embeddable live chat widget that can be integrated into any website.
Note: The API is not part of the monorepo and is managed separately.

To run the different UI components in development mode, execute the following commands at the project root level:

- **Run the Admin Interface:**

```bash
npm run dev:frontend
```

The admin interface will be accessible at http://localhost:8081.

- **Run the Live Chat Widget:**

```bash
npm run dev:widget
```

The live chat widget will be accessible at http://localhost:5173.

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
