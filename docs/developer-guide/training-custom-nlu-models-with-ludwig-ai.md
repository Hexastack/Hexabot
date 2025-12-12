---
icon: head-side-gear
---

# Training custom NLU Models with Ludwig AI

[Ludwig AI](https://ludwig.ai/) is a powerful, low-code machine learning framework that simplifies the process of building and training AI models. Hexabot leverages Ludwig AI to offer a customizable and robust NLU Engine. This page will guide you through the process of training your own Natural Language Understanding (NLU) models using Ludwig AI, which you can then integrate into your Hexabot chatbot.

### Introduction to Ludwig AI for Hexabot NLU

The Hexabot Ludwig NLU Engine allows you to use custom NLU models for intent detection, entity recognition, and more, without writing extensive code. Ludwig AI's declarative approach uses configuration files (YAML) to define your model architecture and training process. This makes it accessible for users with varying levels of AI expertise to create tailored NLU solutions for their Hexabot projects.

### Training Your NLU Models: Two Approaches

Hexabot offers two primary approaches for training your Ludwig AI NLU models:

1. **Local Setup:** This method involves cloning the [Hexabot Ludwig NLU repository](https://github.com/Hexastack/hexabot-ludwig-nlu) locally, setting up a Python virtual environment, and training the models directly on your machine. This approach is suitable for users who prefer hands-on control and local development.
2. **Dockerized Environment:** This approach utilizes Docker containers to create an isolated and reproducible training environment. It simplifies dependency management and ensures consistency across different systems. This method is recommended for users who value ease of setup and portability.

Choose the approach that best suits your technical preferences and environment. The following sections will detail the setup and training process for both methods.

### Prerequisites

Before you begin training your Ludwig AI models, ensure you have the following prerequisites installed and set up:

* **Python:** Python 3.8 or higher is required.
* **Ludwig AI:** Install Ludwig AI following the instructions on the [official Ludwig AI website](https://ludwig.ai/latest/).
* **GPU (Optional but recommended):** While not mandatory, using a GPU will significantly speed up the training process, especially for complex models and large datasets.
* **Docker (Optional):** Docker is required if you intend to use the Dockerized training environment.

### Local Setup for Training

To train your Ludwig models locally, follow these steps to set up your environment:

#### 1. Clone the Repository

First, clone the Hexabot Ludwig NLU engine repository from GitHub:

```bash
git clone https://github.com/Hexastack/hexabot-ludwig-nlu.git
cd hexabot-ludwig-nlu
```

#### 2. Create a Virtual Environment

It's recommended to work within a virtual environment to isolate project dependencies. Open your terminal and run the following commands:

```bash
python3 -m venv venv
source venv/bin/activate  # On Linux/macOS
# venv\Scripts\activate  # On Windows
```

#### 3. Install Dependencies

Navigate to the root directory of your Ludwig NLU engine project (where the `requirements.txt` file is located) and install the necessary Python packages:

```bash
pip install -r requirements.txt
```

### Training Models Locally

Once your environment is set up, you can train your NLU models using the Ludwig CLI.

1.  **Prepare your Training Data:** Ludwig AI supports various data formats, including CSV, JSON, Parquet, and more. For this example, we will focus on CSV format. See the [Ludwig documentation on supported dataset formats](https://ludwig.ai/latest/user_guide/datasets/supported_formats/) for a comprehensive list and details.

    \
    **CSV Training Data Example:**

    Your CSV training data should be structured with columns representing your input features (e.g., utterance for user text) and output features (e.g., intent for the detected intent). Here's an example structure for intent classification:



    ```csv
    utterance,intent
    "What's the weather like today?",weather_inquiry
    "Book a flight to Paris",book_flight
    "Set an alarm for 7 AM",set_alarm
    "Tell me a joke",tell_joke
    "Order a pizza",order_food
    ```

    \
    In this example:

    * The utterance column contains the user input text.
    * The intent column specifies the corresponding intent label for each utterance.

    You can expand this structure to include columns for entities or other relevant features, depending on your NLU tasks. Ensure your CSV file is saved in the `/data/train.csv` path, or adjust the path in the training command accordingly.
2. **Configure your Model:** Ludwig models are configured using YAML files. The example configuration file is located at `/src/config.yaml`. You will need to adjust this configuration file to define your model architecture, input features (text data), and output features (intents, entities). Refer to the [Ludwig documentation](https://ludwig.ai/latest/configuration/) for detailed information on configuration options.
3.  **Run the Training Command:** Execute the following command in your terminal to start the training process: \
    Adjust the paths to `--config`, `--dataset`, and `--output_directory` according to your project structure and data locations.

    ```bash
    ludwig experiment --config /src/config.yaml \
                     --dataset /data/train.csv \
                     --output_directory /results
    ```

    * `--config /src/config.yaml`: Specifies the path to your Ludwig configuration file.
    * `--dataset /data/train.csv`: Specifies the path to your training dataset.
    * `--output_directory /results`: Defines the directory where Ludwig will save the training results, including the trained model.

### Dockerized Training

For a more isolated and reproducible training environment, you can use Docker.

1.  **Build and Run the Docker Container:** Navigate to the root of your Ludwig NLU engine project. Ensure you have Docker installed and running. Use the following command to start the training process within a Docker container:

    ```bash
    docker compose -f docker-compose.train.yml up
    ```

    * This command uses the `docker-compose.train.yml` file (provided in the repository) to build and run a Docker container pre-configured for Ludwig training.
    * **Environment Variables:** The model's name and dataset paths are typically configured via environment variables within the `docker-compose.train.yml` file or a `.env.train` file (example provided as `.env.train.example`). Make sure to adjust these environment variables to match your desired model name and dataset location.
2. **Monitor Training:** Docker will run the training process in the container. You can monitor the logs using `docker compose logs -f` to track the training progress.

### Using Your Trained Models

Once the training process is complete, Ludwig will save the trained model in the specified output directory (e.g., `/results/experiment_run_0/model`).

You can then use this trained model for:

* **Inference (Prediction):** Test your model with new data using the `ludwig predict` command as shown in the README to evaluate its performance.
* **Serving (API):** Set up a local or cloud-based API using `ludwig serve` or Dockerized serving options ( `docker-compose.serve-local.yml` or `docker-compose.serve-hf.yml`) to make your NLU model accessible to Hexabot for real-time intent and entity detection.

Detailed instructions on integrating your trained Ludwig model with Hexabot, including configuring the Ludwig NLU Engine settings in the Hexabot UI and using the Ludwig Helper extension, can be found in other sections of the Hexabot documentation.

### Uploading Models to Hugging Face (Optional)

Sharing your trained models on the Hugging Face Hub can be beneficial for collaboration, deployment, and making your models publicly accessible.

1. **Hugging Face Setup:**
   * **Create a Hugging Face Account:** If you don't have one, sign up for a free account on [Hugging Face](https://huggingface.co/).
   * **Set up SSH Key:** Configure an SSH key for your Hugging Face account as described in the [Hugging Face documentation](https://huggingface.co/docs/hub/security-git-ssh). This is required for pushing models to the Hub via Git.
2. **Upload Steps:**
   *   **Create a Repository:** Use the Hugging Face CLI to create a new repository for your model:

       ```bash
       huggingface-cli repo create <your-repo-name>
       ```

       Replace `<your-repo-name>` with your desired repository name (e.g., `hexabot-intent-model`).
   *   **Clone the Repository:** Clone the newly created repository to your local machine:

       ```bash
       git clone git@hf.co:<your-username>/<your-repo-name>.git
       cd <your-repo-name>
       ```

       Replace `<your-username>` and `<your-repo-name>` with your Hugging Face username and repository name.
   *   **Track Large Files (Git LFS):** Initialize Git LFS and track the model weights files (typically located in the `model/model_weights` directory within your Ludwig output):

       ```bash
       git lfs install
       git lfs track "model/model_weights"
       ```
   * **Copy Model Files:** Copy the contents of your trained model directory (e.g., `/results/experiment_run_0/model`) into the cloned repository directory.
   *   **Commit and Push:** Add the files, commit your changes, and push them to the Hugging Face Hub:

       ```bash
       git add .
       git commit -m "Upload trained Ludwig NLU model"
       git push
       ```

Your trained Ludwig NLU model is now uploaded to your Hugging Face repository, ready to be used and shared! You can then reference this model in your Hexabot Ludwig NLU Engine configuration (e.g., in the `config.yaml` or via environment variables) to use your custom-trained model for your chatbot.

#### Next Steps: Integrating with Hexabot

Now that you have learned how to train your custom NLU models using Ludwig AI, the next step is to integrate these models into your Hexabot chatbot. To understand how to configure the Ludwig NLU Engine within Hexabot and utilize your trained models for intent and entity recognition in your chatbot flows, please refer to the [Ludwig NLU Engine](../user-guide/nlu/nlu-engines/ludwig-nlu-engine.md) page in the Hexabot User Guide. This page provides detailed instructions on setting up and using the Ludwig NLU Engine within your Hexabot project.
