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
This software is licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:

1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
