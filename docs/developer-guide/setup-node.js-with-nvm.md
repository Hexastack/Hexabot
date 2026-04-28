---
description: >-
  Install and manage Node.js 20.19.0 or later with NVM for local Hexabot
  development.
icon: node
---

# Setup Node.js with NVM

Hexabot v3 requires Node.js `>= 20.19.0`.

Use [NVM](https://github.com/nvm-sh/nvm) to install and switch Node.js versions cleanly. This is the easiest setup for local Hexabot development.

If you want the full local setup flow, see [Installation](../quickstart/installation.md).

### Install NVM

The steps below use Ubuntu. For other operating systems, use the official NVM install guide.

1. Update your package index:

```bash
sudo apt update
```

2. Install NVM:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.4/install.sh | bash
```

3. Restart your terminal.

Or load NVM in the current shell:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
```

4. Verify the installation:

```bash
nvm --version
```

### Install Node.js 20.19.0 or later

Install the current minimum supported version:

```bash
nvm install 20.19.0
```

Set it as your default version:

```bash
nvm alias default 20.19.0
```

Use it in the current shell:

```bash
nvm use 20.19.0
```

Verify the active Node.js version:

```bash
node --version
```

The output should be `v20.19.0` or later.
