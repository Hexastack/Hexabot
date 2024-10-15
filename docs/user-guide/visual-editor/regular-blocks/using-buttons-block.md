# Using Buttons Block

<figure><img src="../../../.gitbook/assets/image (3) (1).png" alt=""><figcaption></figcaption></figure>

The Buttons block enables you to display a set of clickable buttons to users, allowing them to easily make choices and guide the flow of the conversation. Unlike Quick Replies, which are typically displayed horizontally, Buttons can be arranged in a vertical layout, providing a more structured and visually appealing way to present options.

This guide will walk you through the steps of using the Buttons block:

**1. Add the Buttons Block:**

* Locate the "Buttons" block in the block palette within the Visual Editor.
* Drag and drop the Buttons block onto the canvas, placing it at the point in the conversation flow where you want the buttons to appear.

**2. Connect the Block:**

* **Preceding Connection:** Connect the Buttons block to the previous block in the conversation flow to determine when the buttons should be displayed to the user.
* You can connect the Buttons block to any block that sends a message or prompts a user action, such as a Simple Text block or a User Input block.

**3. Configure the Buttons:**

* **Select the Block:** Click on the Buttons block you added to the canvas to select it.
* **Click "Edit":** The configuration panel for the Buttons block will open.
* **Triggers Tab (Optional):**
  * If you want the buttons to be displayed only under specific conditions, define those conditions in the "Triggers" tab.
  * This could include triggers based on the user's previous message, specific data values, or other factors relevant to the conversation.
* **Message Tab:** This tab allows you to set up the content and appearance of the buttons:
  * **Title (Optional):** Add a title or brief instruction above the buttons to provide context or guide the user.
  * **Buttons:** Click the "Add Button" button to create your button options. For each button:
    * **Title:** Enter the text that will be displayed on the button (e.g., "Learn More," "Contact Us").
    * **Payload:** Define a unique payload for each button. This payload is a value that's sent back to the chatbot when a user clicks that specific button.
    * **Type:** Choose the type of action you want the button to trigger:
      * **Postback:** Sends the payload to the chatbot, allowing you to branch the conversation or trigger specific actions. (This is the most common type for navigation and actions within the chatbot.)
      * **Web URL:** Opens a web page in a new browser window. Enter the complete URL you want to open (e.g., "[https://www.example.com](https://www.google.com/url?sa=E\&q=https%3A%2F%2Fwww.example.com)").
* **Options Tab (Optional):** Configure additional settings like the typing indicator delay or assign labels to target specific users with the button options.

**4. Save and Test:**

* Click the "Save" button in the configuration panel.
* Use the "Live Chat Tester" or interact with your chatbot on your chosen channel to verify that the buttons are displayed correctly and that clicking them triggers the intended actions based on their defined payloads.

**Example:**

Let's say you have a chatbot for a restaurant. You could use the Buttons block to present a menu:

* **Title:** "What would you like to order?"
*   **Buttons:**

    * **Title:** "Appetizers" **Payload:** "show\_appetizers" **Type:** Postback
    * **Title:** "Main Courses" **Payload:** "show\_main\_courses" **Type:** Postback
    * **Title:** "Desserts" **Payload:** "show\_desserts" **Type:** Postback
    * **Title:** "Visit Our Website" **Payload:** (Leave blank) **Type:** Web URL (Link to the restaurant's website)

