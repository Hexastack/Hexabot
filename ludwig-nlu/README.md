# hexabot-ludwig-nlu
## Overview
This repository contains a **Natural Language Understanding (NLU)** engine developed using **Ludwig AI**, a high-level, declarative machine learning framework. Ludwig streamlines the process of training and serving machine learning models, enabling rapid prototyping and development without requiring extensive programming skills. For more details, please refer to https://ludwig.ai/latest/. 

The **Hexabot Ludwig NLU** engine is designed to process and analyze text input, extracting key information such as intent, entities, and sentiment to facilitate downstream tasks like chatbot interactions. 

This project is ideal for developers, data scientists, and organizations looking to build efficient and scalable NLU capabilities for chatbots, virtual assistants, or other intelligent systems.

## Features
- **Simplified Configuration:** Configure and customize models effortlessly using YAML files, eliminating the need for complex coding.
- **Scalable and Flexible:** Easily adaptable to various domains and use cases, ensuring efficient performance across diverse datasets and requirements.
- **Versatile Task Support:** Capable of handling a wide range of NLU tasks, including multi-class classification, slot filling, and intent recognition.

## Prerequisites 
- Python 3.8 or higher
- Ludwig AI
- GPU (optional but recommended for faster training)
- Docker

## Environment Variables
The repository uses environment variables to configure training and serving processes. Two example `.env` files are provided:
- `.env.train.example:` Used for training models.
- `.env.serve.example:` Used for model serving and inference

## Local Setup
### Installation 

#### Create a Virtual Environment 

Set up your virtual evironment by running the following commands: 

```bash 
python3 -m venv venv
source venv/bin/activate
```

#### Install Dependencies

Install the necessary dependencies by running the following command:

```bash
pip install -r requirements.txt
```

### Training

Train your own model locally using the following command:

```bash
ludwig experiment --config /src/config.yaml
                 --dataset /data/train.csv
                 --output_directory /results
```
### Inference 

Test out your trained model using the following command. Please remember to adjust the path to your model accordingly
by modifying the `model_path` argument in the command below.

```bash
ludwig predict
      --model_path /results/experiment_run_0/model
      --dataset /data/predict.csv
      --output_directory /predictions
```

### Visualizations

Visualize key metrics for your trained model using the following command. Please remember to adjust the path to your model accordingly
by modifying the `training_statistics` argument in the command below.

```bash
ludwig visualize --visualization learning_curves
      --ground_truth_metadata /results/experiment_run_0/model/training_set_metadata.json
      --training_statistics /results/experiment_run_0/training_statistics.json
      --file_format png
      --output_directory /results/visualizations
```

### Serving

Set up a serve API locally using the following command. Please remember to adjust the path to your model accordingly
by modifying the `model_path` argument in the command below.

```bash
ludwig serve --model_path /results/experiment_run_0/model
```

## Dockerized Environment 

### Training
The model's name is set as an environment variable. Please modify it accordingly. Remember to adjust the path to your dataset aswell.

```bash
docker compose -f docker-compose.train.yml up
```

### Inference 

Use the following command to test your trained model in a dockerized environment.

```bash
docker compose -f docker-compose.predict.yml up
```

### Visualizations

Visualize key metrics for your trained model in a dockerized environment using the following command.

```bash
docker compose -f docker-compose.visualize.yml up
```

### Serving

Set up a serve API in a dockerized environment using the following command. Please note that we're currently downloading models from **HuggingFace** for inference. Serving multiple models trained by the user in a single API instance will be added in the future.

```bash
docker compose -f docker-compose.serve.yml up
```
## Uploading Models to HuggingFace

You can upload your trained models to the Hugging Face Hub to make them publicly accessible or to share them with collaborators. The Hugging Face Command Line Interface (CLI) simplifies the process.

### Setup

Set up a **SSH** key for Huggingface first. For further instructions, please refer to https://huggingface.co/docs/hub/security-git-ssh 

### Steps 

#### Create a Repository 
Create a new repository using HuggingFace's CLI. 

```bash
huggingface-cli repo create <repo-name>
```
#### Clone your repository 
Clone your newly created repository using the following command 

```bash
git clone git@hf.co:<username>/<repo-name>.git
cd <repo-name>
```

#### Track Large Files with Git LFS

Set up **Git LFS** (Large File Storage) to manage large files (e.g., model weights).

```bash
git lfs install
git lfs track "model/model_weights"
```

#### Push and Commit
Copy all your model files to the cloned repository directory:

```bash
git add .
git commit -m "Upload trained model with weights"
git push
```
