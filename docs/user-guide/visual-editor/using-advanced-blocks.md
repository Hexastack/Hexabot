# Using Advanced Blocks

{% include "../../.gitbook/includes/list-block.md" %}

The List block in Hexabot provides a dynamic way to showcase a collection of items, options, or information to your users in an organized and engaging manner. You have the flexibility to display your content in either a traditional list format or as a visually appealing carousel.

The List block is ideal when you need to:

* Present a menu of options to the user.
* Showcase a collection of products or services.
* Display a series of steps or instructions in a clear format.
* Provide users with multiple choices that they can easily browse.



**1. Add the List Block:**

* Find the "List" block in the block palette within the Visual Editor.&#x20;
* Drag and drop the List block onto the canvas, placing it at the desired point in the conversation flow where you want the list to be displayed.

**2. Connect the Block:**

* **Preceding Connection:** Connect the List block to the block that precedes it in the conversation flow. This connection determines when the list will be shown to the user. It can be linked to any block that prompts user interaction or provides information, such as a Simple Text block or a Quick Replies block.

**3. Configure the List:**

* **Select the Block:** Click on the List block on the canvas.
* **Click "Edit":** The configuration panel for the List block will open, allowing you to customize the list's appearance and content.
* **Triggers Tab (Optional):**
  * If you want the List block to be triggered only under specific conditions, define those conditions in the "Triggers" tab.
  * These could be based on user responses, data values, or other relevant conversation elements.
* **Message Tab:** This tab is where you define the items in your list and how they should be presented:
  * **Title (Optional):** Provide a title for the list, giving users context about the information being displayed.
  * **Items:** Add individual list items using the "Add Item" button. For each item:
    * **Title:** Enter the title or main text for the list item (e.g., "Product Name," "Service Description").
    * **Subtitle (Optional):** Add a brief subtitle to provide more details about the list item.
    * **Image (Optional):** Upload an image to be displayed next to the list item, making it visually engaging.
    * **Button (Optional):** Include a button to allow users to interact with the list item directly. You can set the button type (Postback or Web URL) and define a payload to trigger actions or open external links.
* **Options Tab (Optional):**
  * **Display Mode:** Select whether the list should be displayed as a regular vertical list or a horizontally scrolling carousel. The carousel mode is particularly useful for presenting image-heavy lists.
  * **Pagination:** If you have a large number of items, enable pagination to break the list into manageable chunks.
  * **Other Options:** Configure typing indicator delay, label targeting, and fallback responses as needed.

**4. Save and Test:**

* Click "Save" to store your changes to the List block.
* Test the conversation flow in the "Live Chat Tester" or through your connected messaging channels to ensure the List block is working correctly.

**Example:**

Imagine you have a real estate chatbot showcasing property listings. A List block would be ideal to present a selection of properties to the user:

* **Title:** "Here are some properties that match your criteria:"
* **Items:**
  * **Title:** "Modern 3-Bedroom House"
  * **Subtitle:** "Spacious garden, prime location"
  * **Image:** Upload an image of the house.
  * **Button:** Title: "View Details" Payload: "property\_details\_123" Type: Postback
