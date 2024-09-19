import functools
import json
from transformers import TFBertModel, AutoTokenizer
from keras.layers import Dropout, Dense
from sys import platform

if platform == "darwin":
    from keras.optimizers.legacy import Adam
else:
    from keras.optimizers import Adam

from keras.losses import SparseCategoricalCrossentropy
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

BERT_MODEL_BY_LANGUAGE = {
    'en': "bert-base-cased",
    'fr': "dbmdz/bert-base-french-europeana-cased",
}


@tfbp.default_export
class SlotFiller(tfbp.Model):
    default_hparams = {
        "language": "",
        "num_epochs": 2,
        "dropout_prob": 0.1,
        "slot_num_labels": 40
    }
    data_loader: JISFDL

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Init data loader
        self.data_loader = JISFDL(**kwargs)

        # Load Tokenizer from transformers
        # We will use a pretrained bert model bert-base-cased for both Tokenizer and our classifier.
        bert_model_name = BERT_MODEL_BY_LANGUAGE[self.hparams.language or "en"]

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

        # two outputs, one for slots, another for intents
        # we have to fine tune for both
        losses = SparseCategoricalCrossentropy()

        metrics = [SparseCategoricalAccuracy("accuracy")]

        # Compile model
        self.compile(optimizer=opt, loss=losses, metrics=metrics)

        x = {"input_ids": encoded_texts["input_ids"], "token_type_ids": encoded_texts["token_type_ids"],
             "attention_mask": encoded_texts["attention_mask"]}

        super().fit(
            x, encoded_slots, epochs=self.hparams.num_epochs, batch_size=32, shuffle=True)

        # Persist the model
        self.extra_params["slot_names"] = slot_names

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
        text = self.data_loader.get_prediction_data()

        info = self.get_prediction(text)

        print(self.summary())
        print("Text : " + text)
        print(json.dumps(info, indent=2))

        return json.dumps(info, indent=2)
    
    def get_slots_prediction(self, text: str, inputs, slot_probas):
        slot_probas_np = slot_probas.numpy()
        # Get the indices of the maximum values
        slot_ids = slot_probas_np.argmax(axis=-1)[0, :]

        # get all slot names and add to out_dict as keys
        out_dict = {}
        predicted_slots = set([self.extra_params["slot_names"][s]
                            for s in slot_ids if s != 0])
        for ps in predicted_slots:
            out_dict[ps] = []
        
        # retrieving the tokenization that was used in the predictions
        tokens = self.tokenizer.convert_ids_to_tokens(inputs["input_ids"][0])

        # We'd like to eliminate all special tokens from our output
        special_tokens = self.tokenizer.special_tokens_map.values()

        for token, slot_id in zip(tokens, slot_ids):
            if token in special_tokens:
                continue
            # add all to out_dict
            slot_name = self.extra_params["slot_names"][slot_id]

            if slot_name == "<PAD>":
                continue

            # collect tokens
            collected_tokens = [token]
            idx = tokens.index(token)

            # see if it starts with ##
            # then it belongs to the previous token
            if token.startswith("##"):
                # check if the token already exists or not
                if tokens[idx - 1] not in out_dict[slot_name]:
                    collected_tokens.insert(0, tokens[idx - 1])

            # add collected tokens to slots
            out_dict[slot_name].extend(collected_tokens)

        slot_names_to_ids = {value: key for key, value in enumerate(
            self.extra_params["slot_names"])}

        entities = []
        # process out_dict
        for slot_name in out_dict:
            slot_id = slot_names_to_ids[slot_name]
            slot_tokens = out_dict[slot_name]

            slot_value = self.tokenizer.convert_tokens_to_string(
                slot_tokens).strip()

            entity = {
                "entity": slot_name,
                "value": slot_value,
                "start": text.find(slot_value),
                "end":  text.find(slot_value) + len(slot_value),
                "confidence": 0,
            }

            # The confidence of a slot is the average confidence of tokens in that slot.
            indices = [tokens.index(token) for token in slot_tokens]
            if len(slot_tokens) > 0:
                total = functools.reduce(
                    lambda proba1, proba2: proba1+proba2, slot_probas_np[0, indices, slot_id], 0)
                entity["confidence"] = total / len(slot_tokens)
            else:
                entity["confidence"] = 0

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
