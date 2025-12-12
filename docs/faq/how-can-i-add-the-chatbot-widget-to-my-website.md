---
icon: comment-dots
---

# How can I add the Chatbot Widget to my Website?

The [Hexabot](https://hexabot.ai/) Live Chat Widget is a React-based embeddable widget that allows you to integrate real-time chat functionality into your website. This guide will walk you through how to add the widget to your website, customize it to fit your needs, and manage its settings.

<figure><img src="../.gitbook/assets/image (28).png" alt=""><figcaption><p>Embed Chatbot Widget in a Website</p></figcaption></figure>

### Embedding the Chat Widget

Once you have built the widget, embedding it on any webpage is straightforward. Here's how to add it:

#### Step-by-Step Instructions

1.  **Include the Required Scripts**: First, include the React and ReactDOM libraries, as well as the Hexabot widget script.

    ```
    <script crossorigin src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="<<WIDGET_URL>>/hexabot-widget.umd.js"></script>
    ```
2.  **Add the Widget Container**: Create a container where the widget will be rendered.

    ```
    <div id="hb-chat-widget"></div>
    ```
3.  **Attach the Shadow DOM**: This prevents the CSS of your website from conflicting with the chat widget's CSS by using the shadow DOM.

    ```
    <script>
      // Create the shadow root and attach it to the widget container
      const createElement = (tag, props = {}) => Object.assign(document.createElement(tag), props);
      const shadowContainer = createElement("div");
      document
          .getElementById('hb-chat-widget')
          .attachShadow({ mode: 'open' })
          .append(
            shadowContainer,
            createElement("link", {
              rel: "stylesheet",
              href: "<<WIDGET_URL>>/style.css"
            })
          );

      // Render the widget inside the shadow root
      ReactDOM.render(
        React.createElement(HexabotWidget, {
          apiUrl: 'https://api.yourdomain.com',
          channel: 'web-channel'
        }),
        shadowContainer,
      );
    </script>
    ```

#### Using the Official Widget CDN

If you want to use the official widget and receive updates automatically, you can use the following CDN URL:

```
<script src="https://cdn.jsdelivr.net/npm/hexabot-chat-widget@latest/dist/"></script>
```

Or, you can indicate a specific version by replacing the latest tag with the widget version tag:

```
<script src="https://cdn.jsdelivr.net/npm/hexabot-chat-widget@2.2.10/dist/"></script>
```

These scripts will load the Hexabot widget directly from the JsDelivr CDN, which pulls from the package published on the [NPM registry](https://www.npmjs.com/package/hexabot-chat-widget).

### Widget Settings

<figure><img src="../.gitbook/assets/Screenshot 2024-10-14 at 12.41.53 PM.png" alt=""><figcaption><p>Web Channel Widget Settings</p></figcaption></figure>

The widget settings can be managed through the Hexabot Admin through the side menu on the left (access "Settings > Web Channel"). Below is a list of customizable settings:

* **Allowed Upload Mime Types**: Define the types of files users can upload (e.g., audio, images, text).
* **Max Upload Size**: Set the maximum file size for uploads (in bytes).
* **Enable Features**: Enable or disable features like geolocation sharing, attachment uploader, and emoji picker.
* **Chatbot Avatar**: Specify the avatar URL for the chatbot (e.g., `https://eu.ui-avatars.com/api/?name=Hexa+Bot&size=64`).
* **Chat Window and Widget Titles**: Set custom titles for the chat window and widget.
* **Widget Theme**: Choose a color theme for the widget (e.g., teal).
* **Greeting Message**: Customize the greeting message (e.g., "Welcome! Ready to start a conversation with our chatbot?").
* **Persistent Menu and Input Settings**: Display a persistent menu, enable 'Get Started' button, and manage user input.
* **Allowed Domains**: Define the domains where the widget can be embedded (e.g., `http://localhost:8080`).
* **Verification Token**: Set a token for verifying widget requests.

### Customizing the Widget

The Hexabot Live Chat Widget allows you to customize its appearance and behavior to match your website. You can:

* **Change Colors and Fonts**: Match the chat widget's design to your website's branding by modifying its SCSS styles.
* **Configure User Settings**: Customize user settings like the chatbot's language and response preferences.

To build your own widget, you can modify the styles or behavior using the widget’s source code.

### Examples

As a proof of concept, we have developed a [WordPress plugin](https://github.com/hexastack/hexabot-wordpress-live-chat-widget) that makes it easy to embed the chat widget into a WordPress website.

### Summary

Adding the Hexabot Live Chat Widget to your website is straightforward and provides robust customization options for adapting it to your specific needs. By leveraging the widget’s SCSS styles, shadow DOM for isolated styling, and various settings in the Hexabot Admin UI, you can seamlessly integrate real-time chatbot functionality into your website.

If you have any questions or need assistance, feel free to reach out to the Hexabot community or consult the Hexabot documentation.
