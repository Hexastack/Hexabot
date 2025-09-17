# Chatbot Global Fallback

Hexabot's Global Fallback settings allow you to define a default response that your chatbot will use when it cannot understand or respond to a user's query. This ensures a more consistent and user-friendly experience, even in situations where the chatbot might struggle to interpret the user's input.

**1. Access Global Fallback Settings:**

* Navigate to the "Settings" section.
*   Select the "Chatbot" view.\
    \


    <figure><img src="../../.gitbook/assets/image (34).png" alt=""><figcaption></figcaption></figure>

**2. Configure the Global Fallback Message:**

* **Enter Fallback Message:** Type the message you want your chatbot to send when it encounters a fallback situation. This message should be polite, informative, and helpful.
* **Example:**
  * "I'm not sure if I understand your request. Could you please rephrase it?"
  * "Sorry, but I didn't understand your request. Maybe you can check the menu"

**3. (Optional) Configure Fallback Triggers:**

* Some Hexabot blocks configurations might allow you to define specific conditions that trigger the global fallback message.
* This could include:
  * **Number of Consecutive Fallbacks:** Only trigger the fallback after a certain number of failed attempts to understand the user's query.
  * **Specific Keywords:** Trigger the fallback if the user's message contains certain keywords that indicate a misunderstanding.

**4. Enable Global Fallback**

* Click on the switch button to enable/disable your global fallback settings.

{% hint style="info" %}
**Tips:**

* Always aim for a positive tone in your fallback message.
* Let the user know why the chatbot is unable to understand their query (e.g., "I'm still learning" or "I need more information").
* Offer users alternative ways to get help, such as contacting a human agent or searching for information on a website.
* Limit the number of times the global fallback message is triggered to prevent a frustrating user experience. If a user repeatedly sends confusing input, you might consider automatically redirecting them to a human agent.
{% endhint %}
