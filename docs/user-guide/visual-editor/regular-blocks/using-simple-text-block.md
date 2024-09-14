# Using Simple Text Block

<figure><img src="../../../.gitbook/assets/image (1) (1) (1) (1).png" alt=""><figcaption></figcaption></figure>



**1. Add the Simple Text Block:**

* Locate the "Simple Text" block in the block palette. It's often the first or most prominent block in the list.
* Drag and drop the "Simple Text" block onto the canvas, placing it where you want the text message to appear in the conversation flow.

**2. Connect the Block:**

* **Start of a Flow:** If the "Simple Text "block is the beginning of your conversation, it doesn't need to be connected to another block. It will be the first message the user receives when they interact with the chatbot. You just need to toggle on the ![](<../../../.gitbook/assets/image (17).png>) "**Entrypoint**" option.
* **Continuing a Flow:** If the block is part of a longer conversation, connect it to the preceding block to define when the text message should be sent. This connection could be from any type of block, like a Quick Replies block, a User Input block, or another Simple Text block. Each block has a single input port and two types of output ports :&#x20;
  * ![](<../../../.gitbook/assets/image (15).png>) **Next/Previous Block(s) Port:** Defines which block(s) should be triggered next depending on the user input/reply.
  * ![](<../../../.gitbook/assets/image (16).png>) **Attached Block Port:** This should be used if you would like to send subsequent messages.

**3. Configure the Text Message:**

* **Select the Block:** Click on the Simple Text block you added to the canvas.
* **Click "Edit":** This opens the configuration panel for the Simple Text block.
* **Triggers Tab (Optional):**
  * If you only want the text message to be sent under certain conditions, define those conditions in the "Triggers" tab.
  * You can use triggers based on the user's previous message, the presence of specific data, or other contextual factors.
  * You can also choose to target users by a specific label or limit the block scope to a given channel.
* **Message Tab:**
  * Enter the text message you want to send to the user in the "Message" field.
  * You can define one or multiple text message and the chatbot will send randomly one of them.
* **Options Tab (Optional):**
  * **Typing Indicator:** Choose whether to show a typing indicator before sending the message, making the interaction feel more human-like.
  * **Assign Labels:** Associate the block with specific user labels. This enables you to send different messages to users based on their categories or characteristics.
  * **Fallback Responses:** Define messages to send if the user's input doesn't meet any defined triggers, preventing dead ends in the conversation.

**4. Save and Test:**

* Click the "Save" button to save the changes you made to the Simple Text block.
* Use the "Live Chat Tester" or interact with the chatbot through your chosen channel to test how the Simple Text block works in the actual conversation flow.

**Example:**

You might use a Simple Text block at the beginning of a conversation to greet the user:

* **Message Tab:** "Hi there! 👋 Welcome to our customer support chatbot. How can I help you today?"

{% hint style="info" %}
**Tips:**

* **Be Clear and Concise:** Keep messages short, focused, and easy to understand.
* **Use a Natural Tone:** Write in a friendly and conversational style.
* **Personalize When Possible:** Use information you know about the user (e.g., name) to tailor messages.
* **Provide Context:** Make sure the user knows why they are receiving a message and what they should do next.
{% endhint %}
