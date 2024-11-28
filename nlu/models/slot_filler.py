import os
import functools
import json
import re
from transformers import TFBertModel, AutoTokenizer
from keras.layers import Dropout, Dense
from sys import platform

if platform == "darwin":
    from keras.optimizers.legacy import Adam
else:
    from keras.optimizers import Adam

from focal_loss import SparseCategoricalFocalLoss
from keras.metrics import SparseCategoricalAccuracy
import numpy as np

from data_loaders.jisfdl import JISFDL

from sklearn.metrics import classification_report


import boilerplate as tfbp

##
# Slot filling with BERT
# This notebook is based on the paper BERT for Joint Intent Classification and Slot Filling by Chen et al. (2019),
# https://arxiv.org/abs/1902.10909 but on a different dataset made for a class project.
#
# Ideas were also taken from https://github.com/monologg/JointBERT, which is a PyTorch implementation of
# the paper with the original dataset.
##

@tfbp.default_export
class SlotFiller(tfbp.Model):
    default_hparams = {
        "language": "",
        "num_epochs": 2,
        "dropout_prob": 0.1,
        "slot_num_labels": 40,
        "gamma": 2.0
    }
    data_loader: JISFDL

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Init data loader
        self.data_loader = JISFDL(**kwargs)

        # Load Tokenizer from transformers
        # We will use a pretrained bert model bert-base-cased for both Tokenizer and our classifier.
        
        # Read the environment variable
        bert_model_by_language_json = os.getenv('BERT_MODEL_BY_LANGUAGE_JSON')

        # Check if the environment variable is set
        if not bert_model_by_language_json:
            raise ValueError("The BERT_MODEL_BY_LANGUAGE_JSON environment variable is not set.")

        # Parse the JSON string into a Python dictionary
        try:
            bert_models = json.loads(bert_model_by_language_json)
        except json.JSONDecodeError as e:
            raise ValueError(f"Failed to parse BERT_MODEL_BY_LANGUAGE_JSON: {e}")

        # Ensure the parsed JSON is a dictionary
        if not isinstance(bert_models, dict):
            raise ValueError("The BERT_MODEL_BY_LANGUAGE_JSON must be a valid JSON object (dictionary).")

        # Retrieve the BERT model name for the specified language
        language = getattr(self.hparams, 'language', "en")
        try:
            bert_model_name = bert_models[language]
        except KeyError as e:
            raise ValueError(f"No BERT model is available for the provided language '{language}': {e}")

        self.tokenizer = AutoTokenizer.from_pretrained(
            bert_model_name, use_fast=False)
        self.bert = TFBertModel.from_pretrained(bert_model_name)

        self.dropout = Dropout(self.hparams.dropout_prob)
        self.slot_classifier = Dense(self.hparams.slot_num_labels,
                                     name="slot_classifier", activation="softmax")


    def call(self, inputs, **kwargs):
        trained_bert = self.bert(inputs, **kwargs)
        sequence_output = trained_bert.last_hidden_state

        # sequence_output will be used for slot_filling
        sequence_output = self.dropout(sequence_output,
                                       training=kwargs.get("training", False))
        slot_probas = self.slot_classifier(sequence_output)

        return slot_probas

    @tfbp.runnable
    def fit(self):
        """Training"""
        encoded_texts, encoded_intents, encoded_slots, intent_names, slot_names = self.data_loader(
            self.tokenizer)

        if self.hparams.slot_num_labels != len(slot_names):
            raise ValueError(
                f"Hyperparam slot_num_labels mismatch, should be : {len(slot_names)}"
            )

        # Hyperparams, Optimizer and Loss function
        opt = Adam(learning_rate=3e-5, epsilon=1e-08)
  
        losses = SparseCategoricalFocalLoss(gamma=self.hparams.gamma)
    
        metrics = [SparseCategoricalAccuracy("accuracy")]

        # Compile model
        self.compile(optimizer=opt, loss=losses, metrics=metrics)

        x = {"input_ids": encoded_texts["input_ids"], "token_type_ids": encoded_texts["token_type_ids"],
             "attention_mask": encoded_texts["attention_mask"]}

        super().fit(
            x, encoded_slots, epochs=self.hparams.num_epochs, batch_size=32, shuffle=True)

        # Persist the model
        self.extra_params["slot_names"] = slot_names
        self.extra_params["synonym_map"] = self.data_loader.get_synonym_map()
        self.save()

    @tfbp.runnable
    def evaluate(self):
        """Evaluation"""
        # Load test data
        # Assuming your data loader can return test data when mode='test' is specified
        encoded_texts, _, encoded_slots, _, slot_names = self.data_loader(
            self.tokenizer, self.extra_params)

        # Get predictions
        predictions = self(encoded_texts)
        predicted_slot_ids = np.argmax(predictions, axis=-1)  # Shape: (batch_size, sequence_length)

        true_labels = encoded_slots.flatten()
        pred_labels = predicted_slot_ids.flatten()

        # Filter out padding tokens (assuming padding label id is 0)
        mask = true_labels != 0
        filtered_true_labels = true_labels[mask]
        filtered_pred_labels = pred_labels[mask]

        # Adjust labels to start from 0 (since padding label 0 is removed)
        filtered_true_labels -= 1
        filtered_pred_labels -= 1

        # Get slot names excluding padding
        slot_names_no_pad = self.extra_params["slot_names"][1:]  # Exclude padding label


        report = classification_report(
            filtered_true_labels,
            filtered_pred_labels,
            target_names=slot_names_no_pad,
            zero_division=0
        )

        print(report)

        # Optionally, you can return the report as a string or dictionary
        return report

    @tfbp.runnable
    def predict(self):
        while True:
            text = input("Provide text: ")
            info = self.get_prediction(text.lower())

            print(self.summary())
            print("Text : " + text)
            print(info)
            
            # Optionally, provide a way to exit the loop
            if input("Try again? (y/n): ").lower() != 'y':
                break

    def get_slots_prediction(self, text: str, inputs, slot_probas):
        slot_probas_np = slot_probas.numpy()
        # Get the indices of the maximum values
        slot_ids = slot_probas_np.argmax(axis=-1)[0, :]

        # Initialize the output dictionary
        out_dict = {}
        predicted_slots = set([self.extra_params["slot_names"][s] for s in slot_ids if s != 0])
        for ps in predicted_slots:
            out_dict[ps] = []

        tokens = self.tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])

        # Special tokens to exclude
        special_tokens = set(self.tokenizer.special_tokens_map.values())

        idx = 0  # Initialize index explicitly for token tracking
        while idx < len(tokens):
            token = tokens[idx]
            slot_id = slot_ids[idx]

            # Get slot name
            slot_name = self.extra_params["slot_names"][slot_id]
            if slot_name == "<PAD>":
                idx += 1
                continue

            # Collect tokens for the current slot
            collected_tokens = []

            # Handle regular tokens and sub-tokens
            if not token.startswith("##"):
                collected_tokens = [token]
            else:
                # Collect sub-tokens
                while idx > 0 and tokens[idx - 1].startswith("##"):
                    idx -= 1
                    collected_tokens.insert(0, tokens[idx])
                collected_tokens.append(token)

            # Handle subsequent sub-tokens
            while idx + 1 < len(tokens) and tokens[idx + 1].startswith("##"):
                idx += 1
                collected_tokens.append(tokens[idx])

            # Add collected tokens to the appropriate slot
            if slot_name in out_dict:
                out_dict[slot_name].extend(collected_tokens)

            idx += 1  # Move to the next token

        # Map slot names to IDs
        slot_names_to_ids = {value: key for key, value in enumerate(self.extra_params["slot_names"])}

        # Create entities from the out_dict
        entities = []
        for slot_name, slot_tokens in out_dict.items():
            slot_id = slot_names_to_ids[slot_name]

            # Convert tokens to string
            slot_value = self.tokenizer.convert_tokens_to_string(slot_tokens).strip()
            slot_value = re.sub(r'\s+', '', slot_value)            

            # Ensure the slot value exists in the text (avoid -1 for start index)
            start_idx = text.find(slot_value)
            if start_idx == -1:
                print(f"Skipping entity for '{slot_name}' because '{slot_value}' was not found in text.")
                continue  # Skip this entity if not found in text

            # Post Processing 
            synonym_map = self.extra_params["synonym_map"]
            final_slot_value = synonym_map.get(slot_value)
            if final_slot_value is None: 
                final_slot_value = slot_value

            # Calculate entity start and end indices
            entity = {
                "entity": slot_name,
                "value": final_slot_value,
                "start": start_idx,
                "end": start_idx + len(slot_value),
                "confidence": 0,
            }

            # Calculate confidence as the average of token probabilities
            indices = [tokens.index(token) for token in slot_tokens]
            if slot_tokens:
                total_confidence = sum(slot_probas_np[0, idx, slot_id] for idx in indices)
                entity["confidence"] = total_confidence / len(slot_tokens)
            entities.append(entity)

        return entities


    def get_prediction(self, text: str):
        inputs = self.data_loader.encode_text(text, self.tokenizer)
        slot_probas = self(inputs)  # type: ignore

        entities = []
        if slot_probas is not None:
            entities = self.get_slots_prediction(text, inputs, slot_probas)

        return {
            "text": text,
            "entities": entities,
        }
