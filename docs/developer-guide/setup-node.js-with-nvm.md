# Setup Node.js with NVM

Node.js is a pre-requisite to run both the Hexabot CLI and a Hexabot project since the API is built on NestJS. Using [NVM](https://github.com/nvm-sh/nvm) (Node Version Manager) simplifies managing the required Node.js version. When creating a new Hexabot project, the structure includes source folders like **extensions** to add custom plugins, helpers and channels, making Node.js essential tool for smooth development and customization.

If you are new to NVM, please follow these steps to install:

1. Update the system:

```bash
sudo apt update
```

2. Install NVM:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
```

Close and reopen your terminal to start using nvm or run the following to use it now:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion
```

3. Verify the NVM installation:

```bash
nvm --version
```

4. Install Node.js version 18.17.0 or higher :

```bash
nvm install 18.17.0
```

5. Check default Node.js version:

```bash
node --version
```
