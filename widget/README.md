# Hexabot Live Chat Widget

The [Hexabot](https://hexabot.ai/) Live Chat Widget is a React-based embeddable widget that allows users to integrate real-time chat functionality into their websites. It connects to the Hexabot API and facilitates seamless interaction between end-users and chatbots across multiple channels.

[Hexabot](https://hexabot.ai/) is an open-source chatbot / agent solution that allows users to create and manage AI-powered, multi-channel, and multilingual chatbots with ease. If you would like to learn more, please visit the [official github repo](https://github.com/Hexastack/Hexabot/).

## Key Features

- **Real-Time Chat:** Engage in real-time conversations with users directly through your website.
- **Customizable:** Easily customize the widget's appearance and behavior to fit your brand and website.
- **Multi-Channel Support:** Integrates with multiple messaging platforms through the Hexabot API.
- **Embeddable:** Simple to embed and integrate into any web page with just a few lines of code.

## Directory Structure

The Hexabot Live Chat Widget is organized into the following directory structure, under `src` we have:

- **src/assets:** Static assets like icons, fonts, and images used in the widget.
- **src/components:** Reusable React components that make up the chat widget interface, such as message bubbles, input fields, and buttons.
- **src/constants:** Hard coded values that are used like colors.
- **src/hooks:** Custom React hooks for managing widget state and handling side effects like API calls or real-time events.
- **src/services:** Handles external services, such as communication with the Hexabot API or other third-party integrations.
- **src/styles:** Contains the styling for the widget, including CSS or SCSS files used to define the look and feel of the chat interface.
- **src/providers:** Context providers for managing global state, such as user session, chat messages, and widget configurations.
- **src/translations:** Contains transalation of a couple of strings.
- **src/types:** Defines the typescript interfaces, types, and enums used.
- **src/utils:** Utility functions and helpers used throughout the widget, such as formatting, validations, or data transformations.

- **/public:** Contains static files that are publicly accessible. This includes the main HTML template where the widget is embedded for local development.

## Run the Live Chat Widget

### Dev Mode

To run the widget in development mode, execute the following command at the project root level:

```bash
npm run dev:widget
```

The live chat widget will be accessible at http://localhost:5173.

### Build for Production

To build the widget for production, execute the following command at the widget folder level:

```bash
npm run build
```

This will generate a production-ready build in the dist folder.

## Embed Chat Widget

Once the widget is built, you can easily embed it into any webpage. Here's an example of how to add it to your website:

```js
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<link rel="stylesheet" href="./style.css">
<script src="<<WIDGET URL>>/hexabot-widget.umd.js"></script>

<div id="hb-chat-widget"></div>
<script>
  const el = React.createElement;
  const domContainer = document.getElementById('hb-chat-widget');
  ReactDOM.render(
    el(HexabotWidget, {
      apiUrl: 'https://api.yourdomain.com',
      channel: 'web-channel',
      token: 'token123',
    }),
    domContainer,
  );
</script>
```

Replace the values in apiUrl and token with your configuration details.

To prevent the website css from conflicting with the chat widget css, we can leverage the shadow dom:

```js
<script crossorigin src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="<<WIDGET URL>>/hexabot-widget.umd.js"></script>

<div id="hb-chat-widget"></div>
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
          href: "<<WIDGET URL>>/style.css"
        });
      );

  // Render the widget inside the shadow root
  ReactDOM.render(
    React.createElement(HexabotWidget, {
      apiUrl: 'https://api.yourdomain.com',
      channel: 'web-channel',
      token: 'token123',
    }),
    shadowContainer,
  );
</script>
```

If you would like to use the official widget and benefit from updates automatically, you can consider using the cdn url:
`https://cdn.jsdelivr.net/npm/hexabot-chat-widget@2.0.4/dist/`

or lastest from major version:
`https://cdn.jsdelivr.net/npm/hexabot-chat-widget@2/dist/`

JsDelivr uses the package published in the NPM registry : https://www.npmjs.com/package/hexabot-chat-widget

## Examples

As a proof of concept we developed a Wordpress plugin to embed the chat widget in a Wordpress website : [https://github.com/hexastack/hexabot-wordpress-live-chat-widget](https://github.com/hexastack/hexabot-wordpress-live-chat-widget)

## Customization

You can customize the look and feel of the chat widget by modifying the widget’s scss styles or behavior. The widget allows you to:

- Change colors and fonts to match your website's branding.
- Configure user settings like language and chatbot response preferences.

## Contributing

We welcome contributions from the community! Whether you want to report a bug, suggest new features, or submit a pull request, your input is valuable to us.

Feel free to join us on [Discord](https://discord.gg/rNb9t2MFkG)

## License

This software is licensed under the GNU Affero General Public License v3.0 (AGPLv3) with the following additional terms:

1. The name "Hexabot" is a trademark of Hexastack. You may not use this name in derivative works without express written permission.
2. All derivative works must include clear attribution to the original creator and software, Hexastack and Hexabot, in a prominent location (e.g., in the software's "About" section, documentation, and README file).
