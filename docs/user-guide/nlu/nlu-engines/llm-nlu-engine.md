# LLM NLU Engine

The LLM NLU Engine in Hexabot leverages the power of Large Language Models (LLMs) to detect intents and determine language efficiently. This engine is ideal for users who want a quick, pre-trained solution without the need to develop and train custom AI models. Below is the detailed guide on configuring and using the LLM NLU Engine in Hexabot.

### Configuring the LLM NLU Engine

<figure><img src="../../../.gitbook/assets/image (31).png" alt=""><figcaption></figcaption></figure>

#### **Step 1: Set the Default NLU Helper**

* Navigate to “**Settings**” from the main menu.
* Select the “**Chatbot**” tab.
* Ensure that the “**Default NLU Helper**” is set to "**llm-nlu-helper**".

This ensures that Hexabot uses the LLM-powered NLU engine for processing intents and language detection.

#### **Step 2: Select the Default LLM Helper**

{% hint style="info" %}
**Helper Installation:** Ensure the desired LLM helper is installed before selecting it in the settings. Installation instructions for each helper are provided in their respective documentation.
{% endhint %}

1. In the same “Chatbot” tab, locate the “Default LLM Helper” setting.
2. Choose your preferred LLM helper from the installed options. Below some LLM helpers as an example:
   1. **Ollama Helper (**[**hexabot-helper-ollama**](https://hexabot.ai/extensions/672731347ddd71f5fb2f0d7a)**) :** A helper for integrating with [Ollama](https://ollama.ai/), an LLM platform designed for localized or containerized usage. Install Ollama either locally on your machine or as a Docker container.
   2. **Google Gemini Helper (**[**hexabot-helper-gemini**](https://hexabot.ai/extensions/67272e927ddd71f5fb2f0c5c)**):** A helper for integrating with Google Gemini, Google’s advanced LLM for high-performance AI applications. Generate an API key from Google Cloud Console. Configure the helper with the API key in Hexabot’s settings.
   3. **OpenAI ChatGPT Helper (**[**hexabot-helper-chatgpt**](https://hexabot.ai/extensions/67272fef7ddd71f5fb2f0d02)**):** A helper for integrating with OpenAI’s ChatGPT, a widely used and versatile LLM. Generate an API key from the OpenAI dashboard. Configure the helper with the API key in Hexabot’s settings.

3\. Before moving to the next steps, ensure the necessary helper is installed and fully configured.

#### **Step 3: Configure the prompts of the LLM NLU Engine**

The LLM NLU Helper Settings allow you to configure and fine-tune the behaviour of the LLM-powered NLU engine in Hexabot. These settings include options for selecting the model, defining language detection prompts, and customizing trait classification prompts. Below are the details and guidelines for configuring these settings.

<figure><img src="../../../.gitbook/assets/image (32).png" alt=""><figcaption></figcaption></figure>

1. Navigate to “**Settings**” from the main menu.
2. Select the “**LLM NLU Engine**” tab.
3. Specify the name of the LLM (Large Language Model) you want to use. Leave this field empty to use the default model specified in the LLM helper’s settings. Examples:&#x20;
   1. **Ollama Models:** [https://ollama.com/library](https://ollama.com/library) (Note that you will need to download each model you would like to in Ollama)
   2. **Google Gemini Models:** [**https://ai.google.dev/gemini-api/docs/models/gemini#model-variations**](https://ai.google.dev/gemini-api/docs/models/gemini#model-variations)
   3. **OpenAI ChatGPT Models:** [**https://platform.openai.com/docs/models/gp**](https://platform.openai.com/docs/models/gp)
4. The **language detection prompt** is used to identify the language of a given input text. The LLM helper uses this template to dynamically generate prompts.
5. The **trait classifier prompt** is designed for tasks like detecting intent, sentiment, or other high-level attributes from input text.

{% hint style="info" %}
Prompts use [Handlebars](https://handlebarsjs.com/guide/) for dynamic templates:

* Enclose variables in `{{` and `}}`. For example: `{{variableName}}`.
* Use `{{#if}}` for conditional statements.
* Loop through arrays with `{{#each arrayName}}`.
{% endhint %}

**Step 4: Test the LLM NLU Engine**

1. Navigate to the "**NLU**" from the main menu and then select the "**NLU Entities**" tab to add some entities and/or intent values.

{% content-ref url="../manage-nlu-entities.md" %}
[manage-nlu-entities.md](../manage-nlu-entities.md)
{% endcontent-ref %}

2. Use the **NLU training form** to test out some text and see if predictions are good.

<figure><img src="../../../.gitbook/assets/image (33).png" alt=""><figcaption></figcaption></figure>

3. Finally, you can use NLU Entities when configuring triggers in the blocks within the [Visual Editor](../../visual-editor/)

{% content-ref url="../../visual-editor/regular-blocks/" %}
[regular-blocks](../../visual-editor/regular-blocks/)
{% endcontent-ref %}

### Key Considerations

**1. Performance and Limitations:** LLMs excel at detecting intents and languages without custom training, but they lack confidence scores and may perform poorly with less-common languages or dialects.

**2. Security and Privacy:**

* Use local deployment options like **Ollama** if privacy is a concern.
* For cloud-based APIs (Google Gemini and OpenAI ChatGPT), ensure API keys are securely managed and adhere to organizational security policies.
