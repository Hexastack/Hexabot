# Tensorflow NLU Engine

The Tensorflow NLU Engine is a Natural Language Understanding (NLU) solution built using [Tensorflow](https://www.tensorflow.org/api_docs), an end-to-end platform for machine learning. This engine seamlessly integrates with models hosted on [HuggingFace](https://huggingface.co), enabling robust and scalable NLU capabilities.

## Setting up the Tensorflow NLU Engine

* Install the Hexabot CLI running this command&#x20;

```bash
npm install -g hexabot-cli
```

* Create your Hexabot project using this Ludwig custom template:&#x20;

```bash
hexabot create my-chatbot --template Hexastack/hexabot-template-tensorflow
```

<figure><img src="../../../.gitbook/assets/Screenshot from 2024-12-20 17-31-16.png" alt=""><figcaption></figcaption></figure>

* Navigate to your project directory and initialize it using the following commands. You can customize your project configuration in `my-chatbot/docker/.env` file:

```bash
hexabot init
```

```bash
npm i
```

* Kickstart your newly created chatbot by running:&#x20;

```bash
hexabot dev --services nlu,ollama
```

## Configuring the Tensorflow NLU Engine

<figure><img src="../../../.gitbook/assets/Screenshot from 2025-01-03 17-28-53.png" alt=""><figcaption></figcaption></figure>

### **Step 1: Set the Default NLU Helper**

This ensures that Hexabot uses the Tensorflow based NLU engine for processing intents and language detection.

* Navigate to “**Settings**” from the main menu.
* Select the “**Chatbot**” tab.
* Ensure that the “**Default NLU Helper**” is set to "**tensorflow-nlu-helper**".

### **Step 2: Configure Ludwig NLU Engine Settings**

1. Navigate to “**Settings**” from the main menu
2. Select the “**Tensorflow NLU Engine**” tab.
3. Update NLU Engine Settings:
   1. The Tensorflow NLU engine is already pre-configured to connect with the Tensorflow based NLU API provided in the template. You only need to update the **Tensorflow NLU engine's endpoint** and **API token** if you are not using the default setup.
   2. A Confidence Threshold is also available, it’s set by default to 0.1, this value is the minimum probability required for a prediction to be accepted. Be sure to adjust this threshold based on the specific model you are using and your desired balance of precision and recall.

<figure><img src="../../../.gitbook/assets/Screenshot from 2025-01-03 15-18-03.png" alt=""><figcaption></figcaption></figure>

### **Step 3: Test the Tensorflow NLU Engine**

Navigate to the "**NLU**" from the main menu and then select the "**NLU Entities**" tab to add some entities and/or intent values. Check the [manage-nlu-entities.md](../manage-nlu-entities.md "mention") section in the docs for more information on how to add and manage your NLU entities :

{% content-ref url="../manage-nlu-entities.md" %}
[manage-nlu-entities.md](../manage-nlu-entities.md)
{% endcontent-ref %}

Use the **NLU training tool** to test out some text against the NLU intent you just added and see if predictions are good.

<figure><img src="../../../.gitbook/assets/Screenshot from 2025-01-03 15-22-35.png" alt=""><figcaption></figcaption></figure>

Finally, you can use NLU Entities when configuring triggers in the blocks within the [Visual Editor](../../visual-editor/). You can check the [regular-blocks](../../visual-editor/regular-blocks/ "mention") section in the documentation to help understand how to trigger blocks using NLU intents.

### Key Considerations

While the TensorFlow NLU Engine provides robust capabilities for running inference on TensorFlow-based models deployed on HuggingFace, it comes with certain limitations. The engine is not designed to be extensible, meaning users cannot modify the pre-existing models or customize their internal logic. This lack of flexibility may require careful selection of models to ensure they meet the specific requirements of your application. It is ideal for scenarios where the focus is on leveraging pre-trained models without the need for further adaptation.
