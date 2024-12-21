# Ludwig NLU Engine

The Ludwig NLU Engine is a robust Natural Language Understanding (NLU) solution built using Ludwig AI, a high-level, declarative machine learning framework. This engine simplifies the process of extracting intents, entities, and other language features by leveraging Ludwig’s intuitive design and powerful machine learning capabilities. It uses models deployed on [HuggingFace](https://huggingface.co) or your own locally trained models for inference...

### Setting up the Ludwig NLU Engine

1. Install the Hexabot CLI running this command `npm install -g hexabot-cli`
2. Create your own chatbot using the command: `hexabot create my-chatbot --template Hexastack/hexabot-template-ludwig`
3. Initialize your project and customize your configuration in my-chatbot/docker/.env file: `hexabot init`&#x20;
4. Kickstart your newly created chatbot running: `hexabot dev --services ludwig-nlu,ollama`

<figure><img src="../../../.gitbook/assets/Screenshot from 2024-12-20 17-31-16.png" alt=""><figcaption></figcaption></figure>



### Configuring the Ludwig NLU Engine



<figure><img src="../../../.gitbook/assets/Screenshot from 2024-12-20 19-24-42.png" alt=""><figcaption></figcaption></figure>

#### **Step 1: Set the Default NLU Helper**

* Navigate to “**Settings**” from the main menu.
* Select the “**Chatbot**” tab.
* Ensure that the “**Default NLU Helper**” is set to "**ludwig-nlu-helper**".

This ensures that Hexabot uses the Ludwig based NLU engine for processing intents and language detection.

#### **Step 2: Configure Ludwig NLU Engine Settings**

1. Navigate to “**Settings**” from the main menu.
2. Select the “**Ludwig NLU Engine**” tab.
3. Specify the Ludwig NLU engine's endpoint, API token and Probability Threshold. **A Probability Threshold** is the minimum probability required for a prediction to be accepted.



<figure><img src="../../../.gitbook/assets/Screenshot from 2024-12-20 19-15-41.png" alt=""><figcaption></figcaption></figure>

**Step 3: Test the Ludwig NLU Engine**

Navigate to the "**NLU**" from the main menu and then select the "**NLU Entities**" tab to add some entities and/or intent values.

{% content-ref url="../manage-nlu-entities.md" %}
[manage-nlu-entities.md](../manage-nlu-entities.md)
{% endcontent-ref %}

Use the **NLU training form** to test out some text and see if predictions are good.

<figure><img src="../../../.gitbook/assets/Screenshot from 2024-12-20 19-32-23.png" alt=""><figcaption></figcaption></figure>



Finally, you can use NLU Entities when configuring triggers in the blocks within the [Visual Editor](../../visual-editor/)

{% content-ref url="../../visual-editor/regular-blocks/" %}
[regular-blocks](../../visual-editor/regular-blocks/)
{% endcontent-ref %}

### Key Considerations

* &#x20;**Performance and Limitations:** The Ludwig NLU Engine supports inference using both Hugging Face models and locally trained models. Each prediction logs a confidence score to provide insight into its reliability. To get started, explore the two provided HuggingFace models, which support [intent detection](https://huggingface.co/Hexastack/intent-classifier-lstm) and [language classification](https://huggingface.co/Hexastack/language-classifier-cnn).
* **Extensibility:** The Ludwig NLU engine is designed with extensibility in mind, allowing users to train and leverage their own models independently of Hexabot.\
  By doing so, you can customize the engine to meet specific requirements while still seamlessly integrating it with Hexabot for enhanced functionality. \
  For detailed instructions on training your own models and integrating them with the engine, refer to the README file in the [original repository](https://github.com/Hexastack/hexabot-ludwig-nlu/).\
  You may also wish to try this [dataset](https://huggingface.co/datasets/Hexastack/hexabot-smalltalk-trilingual)  as a starting point for training your custom models. It is uploaded on HuggingFace.&#x20;

