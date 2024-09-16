# Hexabot
![App Screenshot](https://www.hexabot.ai/assets/images/screencast.gif)

## Description

[Hexabot](https://hexabot.ai/) Community Edition is an open-source chatbot solution that allows users to create and manage AI-powered, multi-channel, and multilingual chatbots with ease. Hexabot is designed for flexibility and customization, offering powerful text-to-action capabilities. Originally a closed-source project (version 1), we've now open-sourced version 2 to contribute to the community and enable developers to customize and extend the platform with extensions.

## Features

- **Analytics Dashboard:** Monitor chatbot interactions and performance with insightful metrics and visualizations.
- **Multi-Channel Support:** Create consistent chatbot experiences across multiple channels like web, mobile, and social media platforms.
- **Visual Editor:** Design and manage chatbot flows with an intuitive drag-and-drop interface. Supports text messages, quick replies, carousels, and more.
- **Plugin System:** Extend Hexabot's functionality by developing custom plugins. Enable features like text-to-action responses, 3rd party system integrations, and more.
- **NLP/NLU Management:** Manage training datasets for machine learning models that detect user intent and language, providing intelligent responses.
- **Multi-lingual Support:** Define multiple languages, allowing the chatbot to interact with users in their preferred language.
- **CMS Integration:** Seamlessly integrate and manage dynamic content such as product catalogs and store lists for more engaging conversations.
- **User Roles & Permissions:** Granular access control to manage user roles and permissions for different parts of the system.
- **Contextual Data:** Define variables to collect and leverage relevant information about end-users to deliver personalized responses.
- **Subscribers & Labels:** Organize users by assigning labels and customize their chat experience based on defined segments.
- **Inbox & Handover:** Provides a real-time chat window where conversations can be monitored and handed over to human agents when necessary.

## Directory Structure
- **frontend:** The admin panel built with React/Next.js for managing chatbot configurations and flows.
- **api:** The backend API built with NestJS and connected to MongoDB for data storage and management.
- **widget:** A React-based live chat widget that can be embedded into any website to provide real-time interaction.
- **nlu:** The NLU Engine built with Python, enabling intent recognition and language detection through machine learning models.
- **docker:** A set of Docker Compose files for deploying the entire solution, making it easy to run Hexabot in any environment.

## Prerequisites
To ensure Hexabot runs smoothly, you'll need the following:

- **Docker:** We recommend using Docker to start the app since multiple services are required (MongoDB, Redis, Prometheus, etc.). All the necessary Docker Compose files are located in the docker folder.
- **Node.js:** For development purposes, ensure you have Node.js >= v18.17.0 installed. We recommend using nvm (Node Version Manager) to easily manage and update your Node.js versions.

## Installation

1. **Clone the Repository:**
```bash
$ git clone https://github.com/hexastack/hexabot.git
```
2. **Environment Setup:** To configure the environment variables, use the Makefile at the root folder for initialization:
```bash
$ make init
```
This will copy the `.env.example` file to `.env` in the `./docker` directory if the file does not already exist.

3. **Running the Application:** Once your environment is set up, you can start the app. Use either of the following commands:
```bash
$ make start
```
or for development mode:
```bash
$ make dev
```
**Note:** The first time you run the app, Docker will take some time to download all the required images.

## Usage

UI Admin Panel is accessible via http://localhost:8080, the default credentials are : 
- **Username:** admin@admin.admin
- **Password:** adminadmin

Live Chat Widget is accessible via http://localhost:5173

## Commands

- `make init` : Copies the .env.example file to .env in the ./docker directory if .env does not exist. This is usually used for initial setup.
- `make dev` : Starts all configured Docker services in development mode. It first checks the .env file for completeness against .env.example.
- `make start` : Similar to dev, but explicitly builds the Docker images before starting the services. This target also checks the .env file for required variables.
- `make stop` : Stops all running Docker services defined in the compose files.
- `make destroy` : Stops all services and removes all volumes associated with the Docker compose setup, ensuring a clean state.
- `make check-env` : Checks if the ./docker/.env file exists and contains all the necessary environment variables as defined in ./docker/.env.example. If the file does not exist, it is created from the example. It also lists missing variables if any.

Example on how to start the stack by adding the Nginx service : 
```sh
make start NGINX=1
```

## Documentation
For detailed information on how to get started, as well as in-depth user and developer guides, please refer to our full documentation available in the docs folder or visit the [Documentation](https://docs.hexabot.ai).

You can also find specific documentation for different components of the project in the following locations:

- [API Documentation](api/README.md)
- [UI Documentation](frontend/README.md)
- [Live Chat Widget Documentation](widget/README.md)
- [NLU Engine Documentation](nlu/README.md)

## Contributing 
We welcome contributions from the community! Whether you want to report a bug, suggest new features, or submit a pull request, your input is valuable to us.

Please refer to our contribution policy first : [How to contribute to Hexabot](./CONTRIBUTING.md)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](./CODE_OF_CONDUCT.md)


Feel free to join us on [Discord](https://discord.gg/rNb9t2MFkG)

## License
This software is licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:

1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
3. SaaS Restriction: This software, or any derivative of it, may not be used to offer a competing product or service (SaaS) without prior written consent from Hexastack. Offering the software as a service or using it in a commercial cloud environment without express permission is strictly prohibited.
