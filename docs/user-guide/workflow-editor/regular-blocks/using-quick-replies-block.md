# Using Quick Replies Block

{% include "../../../.gitbook/includes/quick-replies-block.md" %}

The Quick Replies block enhances chatbot interactions by offering users a quick and pratical way to the user to provide a standard input. Instead of typing a response, users can select from a predefined set of buttons, each representing a specific option or action.&#x20;

**1. Add the Quick Replies Block:**

* In the Visual Editor, locate the "Quick Replies" block in the block palette (usually on the left or right side of the editor).
* Drag and drop the Quick Replies block onto the canvas where you want it to appear in the conversation flow.

**2. Connect the Block:**

* Connect the Quick Replies block to the preceding block in your conversation flow. This connection determines when the quick replies will be displayed to the user.
* You can connect the Quick Replies block to any block that sends a message to the user (e.g., a Simple Text block, an Attachment block).

**3. Configure the Quick Replies:**

* **Select the Block:** Click on the Quick Replies block on the canvas to select it.
* **Click "Edit":** A configuration panel for the Quick Replies block will open.
* **Triggers Tab (Optional):** If you want the Quick Replies to be displayed only under certain conditions, you can use the Triggers tab to define these conditions. For example, you might trigger the Quick Replies only if the user's previous message contained specific keywords.
* **Message Tab:** This is where you define the content of the quick replies.
  * **Title (Optional):** Enter a title for the quick replies. This title will be displayed above the buttons.
  * **Buttons:** Add the quick reply buttons that you want to provide to the user. Each button has two fields:
    * **Title:** The text that will be displayed on the button.
    * **Payload:** A value that will be sent back to your chatbot when the user clicks the button. You can use this payload to trigger different actions or branches in your conversation flow based on the user's choice.
* **Options Tab (Optional):** This tab allows you to configure advanced options for the Quick Replies block, such as adding a typing indicator, assigning the block to specific user labels, or defining fallback responses if the user enters something unexpected.

**4. Save and Test:**

* **Save Changes:** Click the "Save" button in the configuration panel to save your changes to the Quick Replies block.
* **Test the Conversation:** Use the "Live Chat Tester" or connect to your chatbot through your chosen channel (e.g., Facebook Messenger) to test the conversation flow and ensure that the Quick Replies are displayed and function as expected.

**Example:**

Let's say you want to create a chatbot that asks users about their preferred mode of contact. You could use the Quick Replies block to offer the following options:

* **Title:** "How would you prefer to be contacted?"
* **Buttons:**
  * **Title:** "Email" **Payload:** "contact\_email"
  * **Title:** "Phone" **Payload:** "contact\_phone"
  * **Title:** "Chat" **Payload:** "contact\_chat"

Based on the payload returned when the user clicks a button, you can then direct the chatbot to ask for their email address, phone number, or continue the conversation within the chat interface.
