<p align="center">
  <a href="https://hexabot.ai" target="_blank">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://i.imgur.com/Ov50Pwe.png">
    <img alt="Logo" src="https://i.imgur.com/gz1FnM7.png" width="280"/>
  </picture>
  </a>
</p>

<div align="center">
  <strong>
  <h2>Build Smooth AI Chatbots / Agents</h2><br />
  </strong>
  Hexabot provides everything you need to create and manage your own AI powered chatbot / agent,<br />Customizable, Multi-Channel, Multi-Lingual and Text-to-Action Capabilities.
</div>

<p align="center">
  <br />
  <a href="https://hexabot.ai/extensions" rel="dofollow"><strong>Extensions Library</strong></a>
  .
  <a href="https://docs.hexabot.ai" rel="dofollow"><strong>Documentation</strong></a>
  <br />

  <br/>
  <a href="https://www.youtube.com/watch?v=-SBwHcFQESg">Video Tutorial</a>
  ·
  <a href="https://discord.gg/rNb9t2MFkG">Join Our Discord</a>
</p>

<p align="center">
  <video src="https://github.com/user-attachments/assets/623d94d1-12ae-4230-b6bb-fab64fc733c3" width="100%" />
</p>

## Description

[Hexabot](https://hexabot.ai/) is an AI chatbot / agent solution. It  allows you to create and manage multi-channel, and multilingual chatbots / agents with ease. Hexabot is designed for flexibility and customization, offering powerful text-to-action capabilities. You can customize and extend the platform with [extensions](https://hexabot.ai/extensions).

<a href="https://www.producthunt.com/posts/hexabot?embed=true&utm_source=badge-featured&utm_medium=badge&utm_souce=badge-hexabot" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=477532&theme=light" alt="Hexabot - Create&#0032;exceptional&#0032;chatbot&#0032;experiences&#0046;&#0032;100&#0037;&#0032;Open&#0032;Source&#0046; | Product Hunt" style="width: 250px; height: 54px;" width="250" height="54" /></a>
## Features

- **LLMs & NLU Support:** Integrate with your favorite LLM model whether it's by using Ollama, ChatGPT, Mistral or Gemini ... Manage training datasets for machine learning models that detect user intent and language, providing intelligent responses.
- **Multi-Channel Support:** Create consistent chatbot experiences across multiple channels like web, mobile, and social media platforms.
- **Visual Editor:** Design and manage chatbot flows with an intuitive drag-and-drop interface. Supports text messages, quick replies, carousels, and more.
- **Plugin System:** Extend Hexabot's functionality by developing and installing extensions from the [Extension Library](https://hexabot.ai/extensions). Enable features like text-to-action responses, 3rd party system integrations, and more.
- **Multi-lingual Support:** Define multiple languages, allowing the chatbot to interact with users in their preferred language.
- **Knowledge Base:** Seamlessly integrate and manage dynamic content such as product catalogs and store lists for more engaging conversations.
- **User Roles & Permissions:** Granular access control to manage user roles and permissions for different parts of the system.
- **Contextual Data:** Define variables to collect and leverage relevant information about end-users to deliver personalized responses.
- **Subscribers & Labels:** Organize users by assigning labels and customize their chat experience based on defined segments.
- **Inbox & Handover:** Provides a real-time chat window where conversations can be monitored and handed over to human agents when necessary.
- **Analytics Dashboard:** Monitor chatbot interactions and performance with insightful metrics and visualizations.

## Directory Structure

All workspace packages live under the `packages/` directory.

- **packages/frontend:** The admin panel built with React/Next.js for managing chatbot configurations and flows.
- **packages/api:** The backend API built with NestJS and connected to MongoDB for data storage and management.
- **packages/widget:** A React-based live chat widget that can be embedded into any website to provide real-time interaction.
- **docker:** A set of Docker Compose files for deploying the entire solution, making it easy to run Hexabot in any environment.

## Workspace Tooling

This repository is managed with a PNPM workspace and Turborepo for task orchestration.

```bash
pnpm install          # install all workspace dependencies
pnpm dev              # run package dev servers in parallel
pnpm build            # build all packages
pnpm lint             # lint across the workspace
pnpm test             # execute test suites
pnpm --filter @hexabot-ai/api run dev        # run a package script
```

PNPM is bundled with Node.js via Corepack. Enable it with `corepack enable pnpm@9.12.0` if necessary.

## Getting Started

### Prerequisites

- Node.js >= 20.18.1
- pnpm (via Corepack)
- Docker installed

### Installation

Install Hexabot CLI globally to have easy access to its commands:

```sh
npm install -g @hexabot-ai/cli
```

### Usage

1. **Create a new project**:

   ```sh
   hexabot create my-chatbot
   ```

   This will create a new folder `my-chatbot` with all necessary files to get started.

2. **Navigate to your project folder**:

   ```sh
   cd my-chatbot
   ```

3. **Install dependencies**:

   ```sh
   pnpm install
   ```

4. **Initialize environment**:

   ```sh
   hexabot init
   ```

   This command copies the `.env.example` file to `.env`, which you can edit to customize your configuration.

5. **Run in development mode**:

   ```sh
   hexabot dev --services ollama
   ```

   This starts the required services in development mode.


UI Admin Panel is accessible via http://localhost:8080, the default credentials are :

- **Username:** admin@admin.admin
- **Password:** adminadmin

## Documentation

For detailed information on how to get started, as well as in-depth user and developer guides, please refer to our full documentation available in the docs folder or visit the [Documentation](https://docs.hexabot.ai).

You can also find specific documentation for different components of the project in the following locations:

- [CLI Documentation](https://github.com/Hexastack/hexabot-cli/)
- [API Documentation](packages/api/README.md)
- [UI Documentation](packages/frontend/README.md)
- [Live Chat Widget Documentation](packages/widget/README.md)

## Contributing

We welcome contributions from the community! Whether you want to report a bug, suggest new features, or submit a pull request, your input is valuable to us.

Please refer to our contribution policy first : [How to contribute to Hexabot](./CONTRIBUTING.md)


[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](./CODE_OF_CONDUCT.md)

Feel free to join us on [Discord](https://discord.gg/rNb9t2MFkG)

1. **Clone the Repository:**

```bash
$ git clone https://github.com/hexastack/hexabot.git
```

2. **Installation:**
Install node dependencies:
```bash
$ pnpm install
```

3. **Environment Setup:** To configure the environment variables, use the following command at the root folder for initialization:

```bash
$ hexabot init
```

This will copy the `.env.example` file to `.env` in the `./docker` directory if the file does not already exist.

4. **Running the Application:** Once your environment is set up, you can start the app. Use either of the following commands:


For development mode:

```bash
$ hexabot dev
```

Otherwise, you can choose to download docker images rather than building them:
```bash
$ hexabot start 
```

You can also enable services such as Ollama (The services are declared under the `./docker` folder) :

```bash
$ hexabot dev --services ollama
```

**Note:** The first time you run the app, Docker will take some time to download all the required images.

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
