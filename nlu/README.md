# hexabot-nlu
## Overview
This repository contains a Natural Language Understanding (NLU) engine built using Ludwig AI, a high-level machine learning framework. Ludwig simplifies the process of training and serving machine learning models, enabling rapid development without extensive coding.
## Features
- Easy configuration using YAML files.
- Supports multi-class classification, text extraction, and intent recognition.
## Prerequisites 
- Python 3.8 or higher
- Ludwig AI
- GPU (optional but recommended for faster training)
- Docker
## Local Setup
### Installation 
#### Create a Virtual Environment 
`python3 -m venv venv`
 `source venv/bin/activate`
#### Install Dependencies
`pip install -r requirements.txt`
### Training
`ludwig experiment --config /src/config.yaml
                 --dataset /data/train.csv
                 --output_directory /src/results`
### Inference 
`ludwig predict
      --model_path /src/results/experiment_run_0/model
      --dataset /data/predict.csv
      --output_directory /src/predictions`
### Visualizations
`ludwig visualize --visualization learning_curves
      --ground_truth_metadata /src/results/experiment_run_0/model/training_set_metadata.json
      --training_statistics /src/results/experiment_run_0/training_statistics.json
      --file_format png
      --output_directory /src/results/visualizations`
### Serving
`ludwig serve --model_path /src/results/experiment_run_0/model`

## Dockerized Environment 
### Training
The model's name is set as an environment variable. Please modify it accordingly.
`docker compose -f docker-compose.train.yml up` 
### Inference 
`docker compose -f docker-compose.predict.yml up` 
### Visualizations
`docker compose -f docker-compose.visualize.yml up` 
### Serving
`docker compose -f docker-compose.serve.yml up` 
