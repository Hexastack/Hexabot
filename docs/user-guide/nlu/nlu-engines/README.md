# NLU Engines

The NLU Engine is the core component of Hexabot’s natural language understanding pipeline, responsible for detecting intents, entities, and other attributes from user inputs. Hexabot supports multiple NLU Engines to cater to different levels of expertise and use cases.

### LLM NLU Engine

Leverages Large Language Models (LLMs) such as Ollama, Gemini, or ChatGPT to detect intents and language without requiring custom training. This is the default NLU engine which is ideal for those looking for a ready-to-use NLU solution without requiring prior AI expertise.

**Benefits:**

* No need to train your own models.
* Quick setup and instant results for supported intents

**Limitations:**

* Does not provide a confidence score (e.g., probability of accuracy).
* Performance may vary for lesser-known languages and dialects.
* Primarily effective for widely spoken languages like English, French, etc.

### Ludwig NLU Engine

Uses [Ludwig](https://ludwig.ai/latest/), a low-code AI framework, to help you build custom AI models with minimal coding. It supports modern architectures like BERT, LSTM, and RNN. This is a good option for developers or teams looking to create customizable models quickly without diving deep into coding.

**Benefits:**

* Requires little to no coding; you configure models via YAML or JSON files.
* Accessible for junior to intermediate AI practitioners.

**Limitations:**

* Requires some understanding of AI concepts to configure effectively.

### TensorFlow NLU Engine

A Python boilerplate that we built ourselves is provided to facilitate the development of TensorFlow-based models. This could be suitable for experienced data scientists who want full control over their AI pipeline.

**Benefits:**

* Gives complete control over the model design and training process.
* Supports advanced customization for experienced data scientists.

**Limitations:**

* Requires strong expertise in machine learning and TensorFlow.
* More time-intensive to develop and maintain.

### Building Your Own NLU Engine

Hexabot’s architecture allows you to integrate custom NLU engines by following these steps:

**1. Build a Service (API):**

* Develop an inference service that performs intent detection, entity recognition, or other NLU tasks.
* The service should expose an API endpoint that accepts input text and returns predictions.

**2. Create a Helper Extension:**

* Implement a helper extension in Hexabot to call the custom NLU service.
* The extension should handle the integration, sending input to the API and processing predictions.

**3. Use Existing Examples:**

* Refer to the source code of existing NLU engines (LLM, Ludwig, TensorFlow) for guidance.
* Source code is available on Hexabot’s GitHub repository.

### Summary

Hexabot’s NLU Engine supports a range of solutions, from plug-and-play LLM-based inference to fully customizable TensorFlow models. Whether you are a novice or an expert, there’s an option tailored to your needs. Additionally, Hexabot’s open design empowers developers to build and integrate custom engines, expanding the possibilities of natural language understanding in your conversational AI projects.
