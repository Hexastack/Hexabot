# Build your First Plugin

Hexabot's features can be extended by developing and installing extensions from the [Extension Library](https://hexabot.ai/extensions). A plugin is an extension that allows to add features like text-to-action and third-party system integrations. Once you add a plugin, a new "**Building Block**" will appear in the [Visual Editor](https://docs.hexabot.ai/user-guide/visual-editor) for you to use when designing your flows.

If you want to add your own building block, this guide will walk you through the process of developing a custom plugin for your Hexabot project.

### Prerequisites

* **TypeScript, Node.js and Nest.js:** Being familiar with [TypeScript](https://www.typescriptlang.org/docs/), [Node.js](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs) and [Nest.js](https://nestjs.com/) makes the process of plugin development smoother. But don't worry if you're just getting started – our detailed guide will walk you through creating your first plugin.
* **Node.js:** Ensure you have Node.js and a package manager (npm or yarn) installed.

{% include "../../.gitbook/includes/untitled.md" %}

* **Docker :** Ensure you have Docker installed.

{% content-ref url="../setting-up-docker-for-development-and-production.md" %}
[setting-up-docker-for-development-and-production.md](../setting-up-docker-for-development-and-production.md)
{% endcontent-ref %}

* **Create a new Hexabot project:** Download the Hexabot CLI and run the `hexabot create my-project` command.

{% content-ref url="../../quickstart/installation.md" %}
[installation.md](../../quickstart/installation.md)
{% endcontent-ref %}

## Plugin Folder Structure

Hexabot plugins interact with Hexabot's existing boilerplate and can be managed through the Hexabot UI. Each plugin typically includes:

* **A package.json file :** To define the plugin meta-data (name, description, ...) as well as extra dependencies you may need to use.
* **Integration Code:** Code that defines how the plugin interacts with Hexabot and external APIs (like Google Gemini in this case).
* **Settings:** Customizable settings to tailor the plugin’s behaviour.
* **i18n translation files**&#x20;

A Hexabot plugins resides in the following directory  `/extensions/plugins/` within the root folder of the Hexabot project. Here's the recommended project structure:

<pre><code><strong>hexabot-plugin-example/
</strong>│
├── README.md                        // Plugin documentation
├── index.plugin.ts                  // Main plugin entry point
├── package.json                     // Plugin manifest
├── settings.ts                      // Plugin settings
├── i18n/                            // Translation directory
│   └── en/                        
│        └── title.json
</code></pre>

## Step-by-Step Guide

Creating a new plugin will help you create a new custom block in the [Visual editor](../../user-guide/visual-editor/). This guide will walk you through creating a custom plugin, using a basic example: "**A block that retrieves and displays the current time**". This approach can be expanded further to create all kinds of custom blocks, allowing you to add new functionality that aligns perfectly with your project needs.

### Create Your Plugin Directory

* Navigate to `extensions/plugins/` folder in your Hexabot project.
* Create a new folder named `hexabot-plugin-time`

### Create README.md

Inside the `hexabot-plugin-time` folder, create `README.md` file.  The file should use the Markdown syntax in order to provide an overview and essential details about the usage of your plugin.

{% code fullWidth="false" %}
```markdown
## Plugin Name
**Plugin Description**: 
    Briefly explains what the plugin is about.
**Features**: 
    Key functionalities of the plugin.
**Prerequisites**: 
     Tools, libraries or skills required.
**Installation Instructions**: 
    Steps to set up the plugin.
**Configuration**: 
    Details on how to configure or adapt the plugin to specific needs.
**Usage Guide**: 
    How to use the plugin.
```
{% endcode %}

### Create `package.json`

The `package.json` is the manifest file of your plugin. It describes the plugin to Hexabot:

```json
{
  "name": "hexabot-plugin-example",
  "version": "1.0.0",
  "author": "Your Name",
  "description": "A brief description of your plugin."
}
```

Inside the hexabot-plugin-time folder, create package.json and add the following:

```json
{
    "name": "hexabot-plugin-time",
    "version": "1.0.0",
    "author": "Your Name",
    "description": "Hexabot plugin to get the current time."
}
```

### Create `settings.ts`

The `settings.ts` file is the place where you'll be able to define the settings of your custom block,  whether it's setting up API authentication or any other configurations.&#x20;

In the same folder, create `settings.ts` file and paste the following::

```typescript
import { PluginSetting } from '@/plugins/types';
import { SettingType } from '@/setting/schemas/types';

export default [
  {
    label: 'response_message',
    group: 'default',
    type: SettingType.multiple_text,
    value: ['Time now is: ', 'Right now it\'s: '],
  },
] as const satisfies PluginSetting[];
```

Later, the block configuration menu will display these settings, as illustrated below&#x20;

<figure><img src="../../.gitbook/assets/time-Plugin-settings.jpg" alt=""><figcaption></figcaption></figure>

### Create i18n Folder

This folder stores translation filess for your plugin to be multilingual. You can add as many languages as needed by creating a new folder for each language under `i18n`  folder. Place under each language file a JSON document that will define your translation for a specific language. For example, the file `title.json` includes the translation of your plugin name.

* Inside the hexabot-plugin-time directory, create a new folder named i18n
* Inside the i18n folder, create a new folder named en

```json
{
  "currenttime_plugin": "Hexabot Plugin Current Time"
}
```

Refer to this example of Gemini Plugin to better understand how to define your i18n translation string :&#x20;

{% embed url="https://github.com/Hexastack/hexabot-plugin-gemini/tree/main/i18n/en" %}

### Building a Custom Block

**Implement Block Logic (index.plugin.ts):**

This plugin example returns the current time when sending 'time' keyword in the chat to trigger the conversation flow. You can learn more about creating your flow and managing blocks [here](../../quickstart/create-your-first-flow.md).

Inside the same directory hexabot-plugin-time create the `index.plugin.ts` with the following code:

**Let's start by importing necessary modules and services:**

Import all the necessary modules, services, and types required for the plugin.

```typescript
import { Injectable } from '@nestjs/common';
import { BlockService } from '@/chat/services/block.service';
import { SettingService } from '@/setting/services/setting.service';
import { Block } from '@/chat/schemas/block.schema';
import { Context } from '@/chat/schemas/types/context';
import {
  OutgoingMessageFormat,
  StdOutgoingEnvelope,
  StdOutgoingTextEnvelope,
} from '@/chat/schemas/types/message';
import { BaseBlockPlugin } from '@/plugins/base-block-plugin';
import { PluginService } from '@/plugins/plugins.service';
import { PluginBlockTemplate } from '@/plugins/types';
import SETTINGS from './settings';
```

**Define the plugin class and specify its template:**

Create a class `CurrentTimePlugin` extending `BaseBlockPlugin` and define the plugin's template with patterns, conversation starter, and a display name.

```typescript
@Injectable()
export class CurrentTimePlugin extends BaseBlockPlugin<typeof SETTINGS> {
  template: PluginBlockTemplate = {
    patterns: ['time'],
    starts_conversation: true,
    name: 'Current Time Plugin',
  };
```

* `@Injectable()`: A decorator that makes the class injectable within the NestJS which is the underlying framework for Hexabot’s API.
* `CurrentTimePlugin extends BaseBlockPlugin<typeof SETTINGS>`: Defines our plugin class, inheriting from BaseBlockPlugin and specifying that the settings are defined by our previously created settings.ts file.
* `template`: A class attribute that defines the default template for the building block:
  * `patterns`: The list of keywords that will trigger the block.
  * `starts_conversation`: Whether the block can start a conversation or should it only be triggered by previous messages.
  * `name`: The name of the block that will appear in the visual editor.

**Constructor to initialize services:**

Initialize the necessary services (`PluginService`, `BlockService`, and `SettingService`) in the constructor.

```typescript
constructor(
    pluginService: PluginService,
    private readonly blockService: BlockService,
    private readonly settingService: SettingService,
  ) {
    super('currenttime-plugin', pluginService);
  }
```

**Define the `getPath` method:**

Adding the `getPath()`  method is mandatory, which helps Hexabot to identify the directory name of the current module and locating the plugin's files.

```typescript
getPath(): string { 
    return __dirname; 
}
```

#### Define the **`process()` method to handle block main logic:**

The `process()` method performs the main logic of the block:

* Fetch settings and arguments.
* Gets the current time and format it.
* Generate a random response message by combining the formatted time with a predefined message.
* Create an outgoing message envelope with the response text.
* Return the message envelope.

```typescript
async process(
    block: Block,
    context: Context,
    _convId: string,
  ): Promise<StdOutgoingEnvelope> {
    const settings = await this.settingService.getSettings();
    const args = this.getArguments(block);

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', { hour12: false });

    const response: string =
      this.blockService.getRandom([...args.response_message]) + formattedTime;

    const msg: StdOutgoingTextEnvelope = {
      format: OutgoingMessageFormat.text,
      message: {
        text: this.blockService.processText(
          response,
          context,
          {},
          settings,
        ),
      },
    };

    return msg;
  }
}
```

#### Final Code:

:tada: Below is the complete code for the `CurrentTimePlugin`:

```typescript
import { Injectable } from '@nestjs/common';
import { BlockService } from '@/chat/services/block.service';
import { SettingService } from '@/setting/services/setting.service';
import { Block } from '@/chat/schemas/block.schema';
import { Context } from '@/chat/schemas/types/context';
import {
  OutgoingMessageFormat,
  StdOutgoingEnvelope,
  StdOutgoingTextEnvelope,
} from '@/chat/schemas/types/message';
import { BaseBlockPlugin } from '@/plugins/base-block-plugin';
import { PluginService } from '@/plugins/plugins.service';
import { PluginBlockTemplate } from '@/plugins/types';

import SETTINGS from './settings';

@Injectable()
export class CurrentTimePlugin extends BaseBlockPlugin<typeof SETTINGS> {
  template: PluginBlockTemplate = {
    // default trigger for you custom block
    patterns: ['time'],
    // if set to true then your block comes as entrypoint by default
    starts_conversation: true,
    // displayed name for your plugin
    name: 'Current Time Plugin',
  };

  constructor(
    pluginService: PluginService,
    private readonly blockService: BlockService,
    private readonly settingService: SettingService,
  ) {
    super('currenttime-plugin', pluginService);
  }

  getPath(): string {
    return __dirname;
  }

  async process(
    block: Block,
    context: Context,
    _convId: string,
  ): Promise<StdOutgoingEnvelope> {
    const settings = await this.settingService.getSettings();
    const args = this.getArguments(block);

    const now = new Date();
    const formattedTime = now.toLocaleTimeString('en-US', { hour12: false });

    /**
     * getRandom() function will pick randomly a string from response_message value
     * array defined in the settings file to build the response.
     */
    const response: string =
      this.blockService.getRandom([...args.response_message]) +
      ' ⌚ ' +
      formattedTime;

    /**
     * returned response from your custom block when triggering it, in this example
     * it returns a text message displaying time now.
     */
    const msg: StdOutgoingTextEnvelope = {
      format: OutgoingMessageFormat.text,
      message: {
        text: this.blockService.processText(
          response,
          context,
          {},
          settings,
        ),
      },
    };

    return msg;
  }
}

```

### Test your plugin

1. **Restart Hexabot API service** so that it recognises the newly added plugin. If you are using the development mode (using the \`_**hexabot dev**_\` CLI command), the API should restart automatically. In case you have installed extra node dependencies, then you may need to stop/start the service.
2. **Test in Visual Editor:** Open the Visual Editor, your custom block named **Current Time Plugin** should be available within the left panel under the "**Custom Blocks**" section. Add it to your flow and use the "_time"_ keyword in the **Admin Chat Console**, the block should then be triggered and return the formatted time.

\
The following represents what your custom plugin will look like based on the example above:

<figure><img src="../../.gitbook/assets/Screenshot from 2024-12-10 16-49-00.png" alt=""><figcaption></figcaption></figure>

## Publishing your plugin

After completing your plugin, be sure to connect with the Hexabot community on Discord to showcase your plugin and work in the _show-n-tell_ channel.&#x20;

Consider publishing your plugin to a repository (e.g., NPM, GitHub) for others to use and continue to improve it.

### Hexabot's Extensions Library

The Hexabot [Extension Library](https://hexabot.ai/extensions) is a collection of extensions built by the community, for the community. Contributors can share their extensions, allowing everyone to benefit from a growing collection of plugins, channels, and helpers to enhance their conversational AIs.&#x20;

## Plugins examples

{% embed url="https://github.com/Hexastack/hexabot-plugin-gemini" %}

{% embed url="https://github.com/Hexastack/hexabot-plugin-chatgpt" %}

Remember that the best way to learn is to dive in, experiment, and build. Don't hesitate to refer back to the core Hexabot documentation and our Discord community as you continue your development journey!&#x20;
