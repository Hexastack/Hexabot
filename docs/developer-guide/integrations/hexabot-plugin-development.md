# Hexabot Plugin Development

Hexabot is designed to be a versatile and extensible chatbot platform. One of its core strengths lies in its plugin system, which allows developers to drastically expand its capabilities beyond the built-in features. Plugins in Hexabot are essentially self-contained modules that integrate seamlessly into the platform, providing a way to introduce custom logic, connect to external services.

At its core, the plugin helps create custom blocks that can be added to the Hexabot’s block library (the blocks library is explained more deeply in the[ Visual Editor](../../user-guide/visual-editor/) section). These new custom blocks allow you to extend the functionality of the conversation flows, meaning your chatbot can handle a wide variety of tasks, like text-to-action response or even complex third-party system integrations.

## Why Develop Hexabot Plugins?

* **Custom Functionality:** Implement specific logic tailored to your unique use case.
* Third-Party Integrations: Connect Hexabot to external APIs, databases, and other services.
* **Enhanced Automation:** Create advanced conversational actions, such as data lookups or complex workflows.
* **Offer a native product experience:** Add native integration with your product by providing a dedicated plugin for Hexabot, developers and startup founders can offer their product and services directly within the Hexabot ecosystem.
* **Expand Hexabot ecosystem:** Share your plugins with other Hexabot users through the Extension Library. Your plugins can become a valuable tool for other users, empowering Hexabot community to learn, grow, and achieve more, together  (You can learn more about the extension library in the[ Hexabot’s Extensions Library](https://hexabot.ai/extensions) section).

### Plugin Structure

A typical Hexabot plugin, residing within the /extensions/plugins/ directory of the Hexabot project, adheres to the following recommended structure:

```
hexabot-plugin-example/
│
├── README.md                        // Plugin documentation
├── index.plugin.ts                  // Main plugin entry point
├── package.json                     // Plugin manifest
├── settings.ts                      // Plugin settings
├── i18n/                            // Translation directory
│   └── en/                        
│        └── title.json
```

Let’s break down each component:

1. `README.md`: Provides an overview, instructions, and other relevant information about your plugin. The documentation should clearly explain what the plugin does, its features, any prerequisites, installation instructions, configuration details, and usage examples.
2. `index.plugin.ts`: The heart of your plugin. This file contains the core logic that will govern the plugin's behaviour. This includes how the plugin interacts with Hexabot and any external services it may utilize.
3. `package.json`: Acts as the manifest for the plugin. It’s where you define the plugin's name, version, dependencies, and other essential metadata required for Hexabot to properly identify and handle the plugin. (More details in the[ package.json](https://docs.google.com/document/d/1PyNwF9DHOY8omTm1n8snPrxc9MDHd5vlz6KNM7GuSJ0/edit#package.json) section)
4. `settings.ts`: Defines the customizable settings for your plugin block. This will allow you to tweak its behaviour in the Visual editor. You'll be able to define UI elements such as Text Inputs, Checkboxes, etc. (More details in the[ settings.ts](https://docs.google.com/document/d/1PyNwF9DHOY8omTm1n8snPrxc9MDHd5vlz6KNM7GuSJ0/edit#settings.ts) section).
5. `i18n/`: The internationalization folder where you store translations for your plugin, allowing it to be localized for different languages. Each language gets a separate folder (e.g., en for English, fr for French) containing translation files (e.g., title.json for your plugin’s display name). (More details in the[ i18n](https://docs.google.com/document/d/1PyNwF9DHOY8omTm1n8snPrxc9MDHd5vlz6KNM7GuSJ0/edit#i18n) section)
