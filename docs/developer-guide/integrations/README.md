# Plugins

Hexabot's powerful plugin system lets you extend the chatbot platform's functionality by adding new features and integrations. The Hexabot Extension Library offers a growing collection of plugins built by the community, ready to be installed and used in your own projects. These plugins can range from simple utility enhancements to complex integrations with external services. This page explains how to install and use existing plugins within your Hexabot environment, enabling you to enhance your chatbots with minimal effort.

## **Installing Plugins**

Plugins are distributed through npm (Node Package Manager) and can be installed using the command line. The Hexabot CLI makes installation of any available plugin very simple and straightforward.

### **General Installation Process**

To install a plugin, you'll use the following general command pattern in the root directory of your Hexabot project:

```bash
npm install hexabot-plugin-[name-of-the-plugin]
```

**Plugin Naming Convention:**

By convention, all official Hexabot plugins and most plugins published by the community on the NPM registry will have package names that start with the prefix `hexabot-plugin-`. This makes the plugins easier to identify, search for, and install.

### **Example: Installing the Google Gemini Plugin for RAG**

As a concrete example, let's consider the [Google Gemini Plugin](https://hexabot.ai/extensions), which enables RAG (Retrieval-Augmented Generation) capabilities for your Hexabot chatbots using Google’s Gemini API. This powerful plugin allows your chatbot to leverage external knowledge when generating responses. To install this plugin:

1. **Open your terminal:** Navigate to the root directory of your Hexabot project using your terminal.
2.  **Run the installation command:** Copy and paste the following command and press enter: This command will download and install the Gemini plugin and all related dependencies.

    ```bash
    npm install hexabot-plugin-gemini
    ```
3. **Plugin Activation :** After installing a plugin, you may need to restart Hexabot for the plugin's custom block to be detected and available in the block library. Additional activation steps may also be required, depending on the specific plugin. Be sure to check the plugin’s installation instructions in its documentation and repository for any particular instructions.

### **Important Notes:**

* **Dependency Management:** During the installation process, npm will automatically handle any plugin dependencies (other packages that the plugin relies on), making setup seamless.
* **Plugin activation**: No additional activation step is needed, once you install the plugin, the related custom block will automatically be added to the Hexabot block library.
* **Reporting Issues:** If you encounter any problems during installation, please report it to the plugin's repository or the Hexabot community. This is important to improve the plugin's stability and availability for all users.

### **Using the Installed Plugin**

After successful installation, the plugin's custom blocks will be automatically available within the Hexabot Visual Editor. Follow these steps to start utilizing your newly installed plugin:

1. **Open the Visual Editor:** Access the Hexabot Visual Editor through your web browser.
2. **Locate the Plugin Block:** Find the plugin's custom block within the Custom blocks section of the visual editor.
3. **Add the block to your flow:** Drag and drop the block into your conversation flow on the canvas.
4. **Configure the Block:** Click on the block to configure its settings, such as API keys or other plugin-specific parameters.
5. **Test your flow:** Save your flow and test it in the Live Chat Widget to experience the full capabilities of the plugin you have installed.

### **Additional Information:**

* **Plugin Documentation:** Always consult the README.md file of the plugin (often available on the plugin's public repository or GitHub repo) for more details on how to use it.
* **Extension Library:** Visit the  :point\_right::jigsaw: [Hexabot Extensions Library](https://hexabot.ai/extensions) to discover other plugins that might enhance your flow capabilities.&#x20;

