# Web Channel

<figure><img src="../../.gitbook/assets/image (1) (1) (1) (1).png" alt=""><figcaption></figcaption></figure>

The Web Channel settings in Hexabot allow you to configure how your chatbot integrates into your website. You can control the appearance of the chatbot widget, manage the chatbot's initial greeting message, and more.

**1. Access Web Channel Settings:**

* Navigate to the "Settings" page.
* Select the "Web Channel" section.

**2. Configure Allowed Media Types:**

* **Allowed Upload Mime Types:** This setting controls the types of files that users can upload through your chatbot on your website.
  * **Enter Mime Types:** You can enter a comma-separated list of MIME types that are allowed. For example, to allow image uploads, you would include image/jpeg, image/png, image/gif, etc. Refer to your web server configuration or other documentation for specific MIME types.
* **Maximum Upload Size:** Set the maximum allowed file size in bytes (e.g., 2500000 for 2.5 MB).

**3. Manage User Interaction Features:**

* **Enable Geolocation Share:** Toggle this setting to allow users to share their location information with your chatbot on your website.
* **Enable Attachment Uploader:** Allow users to upload files (images, documents, etc.) through your chatbot.
* **Enable Emoji Picker:** Allow users to use emoji in their messages through your chatbot.

**4. Customize Chatbot Appearance:**

* **Chatbot Avatar URL:** Enter a URL to an image that will represent your chatbot's avatar in the chat widget. This should be a 64x64 px square image that displays next to the chatbot's messages.
* **Chat Window Title:** This text will appear as the title of the chat window when the user launches the chatbot on your website.&#x20;
* **Widget Theme:** Choose a color theme for the appearance of your chatbot widget, often offered as a dropdown selection. You can choose one of the following colors :&#x20;
  * Teal
  * Orange
  * Red
  * Green
  * Blue
  * Dark

**5. Set Initial Greeting Message:**

* **Greeting Message:** Enter the message that your chatbot will display when a user first launches the chatbot on your website. This could be a simple welcome message, a prompt for action, or an explanation of how the chatbot works.

**6. Manage Persistent Menu and Input:**

* **Display Persistent Menu:** Enable or disable the display of the chatbot's persistent menu on your website. The persistent menu is a set of buttons that are always visible to the user for quick navigation within the chatbot.
* **Disable Input:** Enable this option if you want to prevent users from typing into the chat input area and encourage the user to use the persistent menu or the predefined replies.

**7. Configure Allowed Domains:**

* **Allowed Domains:** Enter a list of domains (URLs) that are allowed to load your chatbot widget on your website. This is a security measure to prevent malicious scripts or unauthorized access.

**8. Verification Token:**

* **Verification Token:** Enter a unique token that verifies your domain's ownership when setting up integrations with third-party services, such as Facebook Messenger.
