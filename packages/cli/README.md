# Hexabot CLI

Hexabot CLI is a powerful command-line tool to help manage your Hexabot chatbot instance. With it, you can create new projects, initialize environments, start services in various modes, run database migrations, and more. The CLI aims to make managing your chatbot seamless and intuitive.


Not yet familiar with [Hexabot](https://hexabot.ai/)? It's a open-source chatbot / agent solution that allows users to create and manage AI-powered, multi-channel, and multilingual chatbots with ease. If you would like to learn more, please visit the [official github repo](https://github.com/Hexastack/Hexabot/).

## Getting Started

### Prerequisites

- Node.js >= 20.18.1
- npm (Node Package Manager)
- Docker installed

### Installation

Install Hexabot CLI globally to have easy access to its commands:

```sh
npm install -g hexabot-cli
```

### Usage

Once installed, you can use the `hexabot` command in your terminal. Here are some of the available commands:

### Commands

#### `create <projectName>`

Create a new Hexabot project.

```sh
hexabot create my-chatbot
```

Options:

- `--template <template>`: Specify a GitHub repository in the format `GITHUB_USERNAME/GITHUB_REPO` to use a custom template.

Example:

```sh
hexabot create my-chatbot --template myusername/my-template-repo
```

#### `init`

Initialize the environment by copying `.env.example` to `.env`.

```sh
hexabot init
```

#### `dev`

Start specified services in development mode with Docker Compose.

```sh
hexabot dev --services nlu,ollama
```

Options:

- `--services <services>`: Comma-separated list of services to enable.


#### `start`

Start specified services with Docker Compose.

```sh
hexabot start --services api,nlu
```

Options:

- `--services <services>`: Comma-separated list of services to enable.


#### `migrate [args...]`

Run database migrations.

```sh
hexabot migrate
```

You can also pass additional arguments to the migration command.

#### `start-prod`

Start specified services in production mode with Docker Compose.

```sh
hexabot start-prod --services api,nlu
```

Options:

- `--services <services>`: Comma-separated list of services to enable.

#### `stop`

Stop specified Docker Compose services.

```sh
hexabot stop --services api,nlu
```

Options:

- `--services <services>`: Comma-separated list of services to stop.

#### `destroy`

Destroy specified Docker Compose services and remove volumes.

```sh
hexabot destroy --services api,nlu
```

Options:

- `--services <services>`: Comma-separated list of services to destroy.

## Example Workflow

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
   npm install
   ```

4. **Initialize environment**:

   ```sh
   hexabot init
   ```

   This command copies the `.env.example` file to `.env`, which you can edit to customize your configuration.

5. **Run in development mode**:

   ```sh
   hexabot dev --services nlu,ollama
   ```

   This starts the required services in development mode.

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
