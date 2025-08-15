# Regular Blocks

Regular blocks are the most common building blocks that a user might need when creating a chatbot. On their own, they provide comprehensive control over the chatbot's responses, assuming that the conversational flow and message samples are well-defined and accurately reflect the users' queries and interactions.

{% tabs %}
{% tab title="Simple Text" %}
<figure><img src="../../../.gitbook/assets/image (1) (1) (1) (1) (1) (1) (1).png" alt=""><figcaption></figcaption></figure>

Chatbots receive and react to a significant volume of textual data. Text messages are the primary form of communication between a chatbot and its users. For this purpose, Hexabot provides the **Simple Text block**, prominently featured in the block palette, to facilitate the addition and configuration of straightforward textual conversational paths.

To configure what response the chatbot should deliver upon receiving a predefined message, simply select the block and click on the "**Edit**" button.&#x20;

{% hint style="warning" %}
&#x20;**Caution:** If there are multiple text blocks on the visual editor interface, make sure to select the specific text block you want to edit to avoid disrupting the conversational flows.&#x20;
{% endhint %}

Blocks can be moved around in the canvas; simply click on the block and hold the click to drag and drop them, ensuring better visibility of the conversational tree structure.

To define how the chatbot should react to user messages, select the block you want to configure, access the edit form using the "**Edit**" button, switch to the "**Triggers**" tab and enter a typical message that a user might send to the chatbot. Then, switch to the "**Message**" tab, specify the standard response that the chatbot should provide each time it receives a similar request, and click "**Submit**".

Text messages provide response clarity, allow for chatbot control, and maintain a fluid and active communication with users. However, relying solely on textual conversational paths is insufficient for transmitting non-textual data and can sometimes lead to rigid and less than optimal pathways for effectively guiding users.

For this reason, Hexabot offers a variety of interaction possibilities and provides several other blocks to diversify conversational paths.
{% endtab %}

{% tab title="Quick Replies" %}
<figure><img src="../../../.gitbook/assets/image (2) (1) (1) (1).png" alt=""><figcaption></figcaption></figure>

The Quick Replies block in Hexabot allows you to present users with a predefined set of responses in the form of clickable buttons, eliminating the need for them to manually type their answers. Quick Reply blocks can be configured with conditional triggers, ensuring they are displayed only when certain conditions within the conversation are met. This adds more dynamic control over how Quick Replies are used in your chatbot.



**Use Cases for Quick Replies:**

* **Asking Yes/No Questions:** Quick Replies simplify binary decisions by offering clear "Yes" and "No" options.
* **Gathering Basic Information:** Use Quick Replies to collect simple user information like language preferences, contact methods, or preferences.
* **Guiding the Conversation:** Subtly steer the direction of the dialog by suggesting actions or providing prompts as Quick Reply options.

<table data-view="cards"><thead><tr><th></th><th></th><th></th><th data-hidden data-card-cover data-type="files"></th><th data-hidden data-card-target data-type="content-ref"></th></tr></thead><tbody><tr><td></td><td>Using Quick Replies Block Guide</td><td></td><td><a href="../../../.gitbook/assets/image (2) (1) (1) (1).png">image (2) (1) (1) (1).png</a></td><td><a href="using-quick-replies-block.md">using-quick-replies-block.md</a></td></tr></tbody></table>
{% endtab %}

{% tab title="Buttons" %}
<figure><img src="../../../.gitbook/assets/image (3) (1) (1).png" alt=""><figcaption></figcaption></figure>

The **Buttons block** in Hexabot provides a structured and versatile way to present users with interactive choices within your chatbot conversations. It allows you to display a set of clickable buttons, each representing a distinct action or navigation path. Buttons differ from Quick Replies in their visual layout; while Quick Replies typically appear horizontally, Buttons are usually arranged vertically, making them suitable for presenting a more defined list of options.

Buttons blocks, like Quick Replies, can be configured with conditional triggers, ensuring they are displayed only when specific conditions within the conversation are met. This allows for greater flexibility and dynamic control over your chatbot's flow.

**Use Cases for Buttons:**

* **Presenting a Menu of Options:** Offer users a clear and organized selection of choices, such as product categories, account settings, or support topics.
* **Initiating Actions:** Trigger specific actions within the chatbot, like "Place Order," "Schedule Appointment," or "Contact Support."
* **Navigating to External Resources:** Direct users to external web pages or applications using URL buttons, providing additional information or linking to related services.
{% endtab %}

{% tab title="Attachment" %}
<figure><img src="../../../.gitbook/assets/image (4) (1) (1).png" alt=""><figcaption></figcaption></figure>

The **Attachment block** in Hexabot enables you to share files directly within your chatbot conversations, enhancing the user experience with rich media content. Go beyond text-only interactions by sending documents, images, videos, or other relevant files to provide more comprehensive information or a more engaging chatbot experience.

**Use Cases for Attachments:**

* **Sharing Documents:** Provide users with helpful resources such as product brochures, instruction manuals, invoice, or reports in PDF format.
* **Displaying Images:** Enhance your chatbot's responses with visual elements like product images, infographics, or diagrams.
* **Delivering Audio or Video Content:** Share audio instructions, product demonstrations, or company announcements directly through the chatbot.
* **Sending Personalized Files:** Based on user interactions or collected data, you can send customized documents or images tailored to the user's specific needs or requests.
{% endtab %}
{% endtabs %}

