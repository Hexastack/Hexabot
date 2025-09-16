# Ludwig NLU Engine

The Ludwig NLU Engine is a robust Natural Language Understanding (NLU) solution built using [Ludwig AI](https://ludwig.ai/), a high-level, declarative machine learning framework. This engine simplifies the process of extracting intents, entities, and other language features by leveraging Ludwig’s intuitive design and powerful machine learning capabilities. It also enables you to use models deployed on [HuggingFace](https://huggingface.co) or your own locally trained models for inference.

## Setting up the Ludwig NLU Engine

* Install the Hexabot CLI running this command&#x20;

```bash
npm install -g hexabot-cli
```

* Create your Hexabot project using this Ludwig custom template:&#x20;

{% code overflow="wrap" %}
```bash
hexabot create my-chatbot --template Hexastack/hexabot-template-ludwig
```
{% endcode %}

<figure><img src="../../../.gitbook/assets/Screenshot from 2024-12-20 17-31-16.png" alt=""><figcaption></figcaption></figure>

* Navigate to your project directory and initialize it using the following commands. You can customize your project configuration in `my-chatbot/docker/.env` file:

```bash
hexabot init
```

```bash
npm i
```

{% hint style="info" %}
Update the `HF_AUTH_TOKEN` in the `.env` file within the `docker` folder to use models from Hugging Face. For guidance on generating a personal token, refer to the [Hugging Face documentation](https://huggingface.co/docs/hub/security) &#x20;
{% endhint %}

* Kickstart your newly created chatbot by running:&#x20;

```bash
hexabot dev --services ludwig-nlu
```

## Configuring the Ludwig NLU Engine

<figure><img src="../../../.gitbook/assets/Screenshot from 2024-12-20 19-24-42.png" alt=""><figcaption></figcaption></figure>

### **Step 1: Set the Default NLU Helper**

This ensures that Hexabot uses the Ludwig based NLU engine for processing intents and language detection.

* Navigate to “**Settings**” from the main menu.
* Select the “**Chatbot**” tab.
* Ensure that the “**Default NLU Helper**” is set to "**ludwig-nlu-helper**".

### **Step 2: Configure Ludwig NLU Engine Settings**

1. Navigate to “**Settings**” from the main menu.
2. Select the “**Ludwig NLU Engine**” tab.
3. Update NLU Engine Settings :
   1. The Ludwig NLU engine is already pre-configured to connect with the Ludwig NLU API provided in the template. You only need to update the **Ludwig NLU engine's endpoint** and **API token** if you are not using the default setup.
   2. A Probability Threshold is also available, it’s set by default to 0.1, this value is the minimum probability required for a prediction to be accepted. Be sure to adjust this threshold based on the specific model you are using and your desired balance of precision and recall.

<figure><img src="../../../.gitbook/assets/Screenshot from 2024-12-20 19-15-41.png" alt=""><figcaption></figcaption></figure>

### **Understanding Ludwig for Hexabot**

While Hexabot simplifies the integration, understanding Ludwig's core concepts is beneficial if you want to build custom models. Ludwig is a declarative machine learning framework where you define your models and training through a configuration file using YAML or JSON. Ludwig handles the complexity and coding details of your configuration.

Here’s a brief overview of how you might use Ludwig in conjunction with Hexabot:

* **Defining a Model Architecture:** Instead of coding a model from scratch, you define a model architecture using a high-level configuration. You might define different layers of a neural network, define a text encoder and other model specifications.
* **Training Models:** Ludwig uses your training data and the configuration you provide to train the model, generating a model that you can then host and use for inference in Hexabot, locally or using a cloud based model.
* **HuggingFace Integration:** You can also directly utilize models from HuggingFace by referencing their names in the Ludwig configuration. This makes using the state-of-the-art models very simple for experimentation.

For in-depth understanding on how to use Ludwig, please refer to its official documentation: [https://ludwig.ai](https://www.google.com/url?sa=E\&q=https%3A%2F%2Fludwig.ai%2Flatest%2F).

{% hint style="info" %}
The Ludwig NLU Engine supports inference using both Hugging Face models and locally trained models. Each prediction logs a confidence score to provide insight into its reliability. **The Ludwig NLU engine in the Hexabot starter template is pre-configured to use two Hugging Face models developed by the Hexabot team that demonstrates** [intent detection](https://huggingface.co/Hexastack/intent-classifier-lstm) and [language classification](https://huggingface.co/Hexastack/language-classifier-cnn)**. These models serve as an example to help you get started. Keep in mind that for real use cases, you may need to define and train your own models based on your dataset to better suit your needs**.\
\
For detailed instructions on training your own models and integrating them with the engine, refer to the README file in the [original repository](https://github.com/Hexastack/hexabot-ludwig-nlu/). You may also wish to try this [dataset](https://huggingface.co/datasets/Hexastack/hexabot-smalltalk-trilingual) as a starting point for training your custom models.
{% endhint %}

### **Step 3: Test the Ludwig NLU Engine**

Navigate to the "**NLU**" from the main menu and then select the "**NLU Entities**" tab to add some entities and/or intent values. Check the [manage-nlu-entities.md](../manage-nlu-entities.md "mention") section in the docs for more information on how to add and manage your NLU entities :

{% content-ref url="../manage-nlu-entities.md" %}
[manage-nlu-entities.md](../manage-nlu-entities.md)
{% endcontent-ref %}

Use the **NLU training tool** to test out some text against the NLU intent you just added and see if predictions are good.

<figure><img src="../../../.gitbook/assets/Screenshot from 2024-12-20 19-32-23.png" alt=""><figcaption></figcaption></figure>

Finally, you can use NLU Entities when configuring triggers in the blocks within the [Visual Editor](../../visual-editor/). You can check the [regular-blocks](../../visual-editor/regular-blocks/ "mention") section in the documentation to help understand how to trigger blocks using NLU intents.

The Ludwig NLU Engine offers a balance between easy configuration and powerful customization. By using pre-trained models from the default setup or training custom models, you have all the tools to build the required NLU logic for your use case. Remember to test and adjust your settings to leverage its capabilities to the fullest.
