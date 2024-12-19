# Using Attachment Block

<figure><img src="../../../.gitbook/assets/image (4) (1) (1).png" alt=""><figcaption></figcaption></figure>

The Attachment block in Hexabot allows you to share files with your chatbot users, making your conversations more engaging and informative. You can send PDF documents and image, enhancing the chatbot's ability to provide richer and more comprehensive responses.

This guide will walk you through the steps of using the Attachment block:

**1. Add the Attachment Block:**

* In the Visual Editor, locate the "Attachment" block within the block palette.
* Drag and drop the Attachment block onto the canvas, positioning it where you want the attachment to be sent in the conversation flow.

**2. Connect the Block:**

* **Preceding Connection:** Connect the Attachment block to the previous block in the conversation flow. This connection determines when the attachment will be sent to the user. You can connect the Attachment block to any type of block that prompts a user action or response, such as a Simple Text block, a Quick Replies block, or a Buttons block.

**3. Configure the Attachment:**

* **Select the Block:** Click on the Attachment block you added to the canvas.
* **Click "Edit":** The configuration panel for the Attachment block will open.
* **Triggers Tab (Optional):**
  * If you want the attachment to be sent only under certain conditions, use the "Triggers" tab to define those conditions.
  * This could involve triggers based on user input, specific data, or other conversational context.
* **Message Tab:** This tab allows you to select and configure the attachment file:
  * **Attachment Type:** Choose the type of file you want to attach (e.g., image, document, audio, video).
  * **File Selection:** Upload the file from your computer or provide a URL to the file if it is hosted online.
  * **Title (Optional):** Enter a title or descriptive text for the attachment that will be displayed to the user (e.g., "Product Brochure," "Audio Instructions").
* **Options Tab (Optional):** Configure any additional options for the Attachment block, such as the typing indicator or label assignment.

**4. Save and Test:**

* Click the "Save" button in the configuration panel to save the changes.
* Use the "Live Chat Tester" or interact with the chatbot through your chosen channel to verify that the attachment is being sent correctly and that the user is able to view or download the file.

**Example:**

Suppose you have a chatbot that helps users troubleshoot technical issues. You might use the Attachment block to send a PDF document containing a troubleshooting guide:

* **Attachment Type:** Document
* **File Selection:** Upload a PDF file named "TroubleshootingGuide.pdf."
* **Title:** "Here's a helpful troubleshooting guide."

**Tips and Best Practices:**

* **File Size:** Be mindful of file sizes, especially when sending videos or large documents. Consider compressing files or hosting them online for optimal delivery.
* **File Formats:** Choose file formats that are compatible with the messaging platform where your chatbot is deployed.
* **Contextual Relevance:** Ensure that attachments are relevant to the conversation and provide value to the user.
