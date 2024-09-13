# NLP Training

<figure><img src="../.gitbook/assets/image (6).png" alt=""><figcaption></figcaption></figure>

Hexabot leverages Natural Language Processing (NLP) to understand what your users are saying and respond appropriately. To make sure Hexabot accurately interprets user intent, you need to train its NLU engine to learn from your user's interactions.&#x20;

{% hint style="info" %}
**Note:** If you are new to Natural Language Understanding (NLU) and NLP, it's highly recommended that you read the [Broken link](broken-reference "mention") section of the documentation first. This will provide you with a foundational understanding of these important concepts before you begin training your chatbot.
{% endhint %}

This guide provides a step-by-step approach to NLP training:

**1. Access NLP Training:**

* Navigate to the "NLP Training" or "NLU" section in the main menu or dashboard. This section is typically dedicated to managing and improving your chatbot's language understanding capabilities.

**2. Define Intents:**

* **Understanding Intents:** Intents represent the goals or actions that a user wants to achieve through their interaction with the chatbot (e.g., "book\_appointment," "get\_product\_information," "report\_issue").
* **Create Intents:** Add new intents by giving them descriptive names and click on "Add Intent" button.

**3. Add Training Phrases :**

* **Examples of User Input:** For each intent, you need to provide multiple examples of how a user might express that intent. These examples are called "training phrases" or "utterances."
* **Diversity is Key:** Aim for a variety of training phrases to cover different ways of expressing the same intent. Include variations in phrasing, wording, slang, and common misspellings.
* **Example:**
  * **Intent:** "get\_weather\_forecast"
  * **Training Phrases:**
    * "What's the weather like today?"
    * "Can you tell me the forecast for tomorrow?"
    * "Is it going to rain this week?"
    * "What's the temp in London?"

**4. Define Entities (Optional):**

* **Key Information:** Entities represent specific pieces of information that are relevant to fulfilling a user's intent. These could include locations, dates, times, product names, or any other custom data types.
* **Creating Entities:** Define new entities in the NLP training section. Give each entity a descriptive name and specify its data type (e.g., location, date, text).
* **Annotate Training Phrases:** In your training phrases, highlight the words or phrases that correspond to entities. This process is called "annotation" and it helps the NLP model learn to extract entities from user input.
* **Example:**
  * **Training Phrase:** "Book a flight to London for tomorrow."
  * **Intent:** "book\_flight"
  * **Entities:**
    * "destination": "London" (location)
    * "departure\_date": "tomorrow" (date)

**5. Test and Improve:**

* **Testing the NLP Model:** Most chatbot platforms offer a built-in testing console to test how well the NLP model is understanding intents and extracting entities. Input various test phrases and see how the model performs.
* **Analyze and Refine:** Review the testing results to identify areas for improvement.
  * **Add More Training Phrases:** If the model is misinterpreting certain intents, add more training phrases to clarify those intents.
  * **Adjust Entity Definitions:** If entities are not being extracted correctly, review and adjust your entity definitions and annotations.

{% hint style="info" %}
**Tips**

* **Real-User Data:** Once your chatbot is live, continue to monitor and analyze how users are interacting with it.
* **Identify Common Misunderstandings:** Look for patterns in how users express their intents, especially where the chatbot might be failing to understand.
* **Regularly Update Training:** Add new training phrases and entities based on real user data to keep improving your chatbot's accuracy and performance.
{% endhint %}

