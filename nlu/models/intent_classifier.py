import json
import math
from typing import Tuple, Dict, List
from numpy import ndarray
import tensorflow as tf
from transformers import TFBertModel, AutoTokenizer, BatchEncoding
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

import boilerplate as tfbp

##
# Intent Classification with BERT
# This code is based on the paper BERT for Joint Intent Classification and Slot Filling by Chen et al. (2019),
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
class IntentClassifier(tfbp.Model):
    default_hparams = {
        "language": "",
        "num_epochs": 2,
        "dropout_prob": 0.1,
        "intent_num_labels": 7,
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
        self.intent_classifier = Dense(self.hparams.intent_num_labels,
                                       name="intent_classifier", activation="softmax")


    def call(self, inputs, **kwargs):
        trained_bert = self.bert(inputs, **kwargs)
        pooled_output = trained_bert.pooler_output
        
        # pooled_output for intent classification
        pooled_output = self.dropout(pooled_output,
                                     training=kwargs.get("training", False))
        intent_probas = self.intent_classifier(pooled_output)

        return intent_probas

    def load_data(self, data_loader) -> Tuple[BatchEncoding, tf.Tensor, ndarray, int, int]:
        return data_loader(self.tokenizer)

    def get_metrics_by_intent(self, intent_probas: List[float], encoded_intents: tf.Tensor) -> Dict[str, dict]:
        """evaluating every intent individually"""
        intent_names = self.extra_params["intent_names"]  # type: ignore
        count = {}
        scores = {}
        data_size = len(intent_probas)

        # The confidence gets computed as the average probability predicted in each intent
        for probas, actual_intent in zip(intent_probas, encoded_intents):
            intent_name = intent_names[actual_intent]
            # We sum and then divide by the number of texts in the intent.
            count[intent_name] = count.get(intent_name, 0)+1
            scores[intent_name] = scores.get(intent_name, {})
            scores[intent_name]["intent_confidence"] = scores[intent_name].get("intent_confidence", 0)\
                + probas[actual_intent]
            scores[intent_name]["loss"] = scores[intent_name].get("loss", 0)\
                - math.log2(probas[actual_intent])

        for intent_name in count.keys():
            scores[intent_name]["frequency"] = count[intent_name]/data_size
            scores[intent_name]["intent_confidence"] /= count[intent_name]
            scores[intent_name]["loss"] /= count[intent_name]

        return scores

    def aggregate_metric(self, scores, key):
        """Group the intent metrics into a global evaluation"""
        return np.sum([(scores[intent]["frequency"] * scores[intent][key]) for intent in scores.keys()])

    def format_scores(self, scores: Dict[str, dict]):
        for intent in scores.keys():
            for metric, score in scores[intent].items():
                # we will only take 4 decimals.
                scores[intent][metric] = "{:.4f}".format(score)
        return scores

    @tfbp.runnable
    def fit(self):
        """Training"""
        encoded_texts, encoded_intents, encoded_slots, intent_names, slot_names = self.data_loader(
            self.tokenizer)

        if self.hparams.intent_num_labels != len(intent_names):
            raise ValueError(
                f"Hyperparam intent_num_labels mismatch, should be : {len(intent_names)}"
            )

        # Hyperparams, Optimizer and Loss function
        opt = Adam(learning_rate=3e-5, epsilon=1e-08)

        losses = SparseCategoricalCrossentropy()

        metrics = [SparseCategoricalAccuracy("accuracy")]

        # Compile model
        self.compile(optimizer=opt, loss=losses, metrics=metrics)

        x = {"input_ids": encoded_texts["input_ids"], "token_type_ids": encoded_texts["token_type_ids"],
             "attention_mask": encoded_texts["attention_mask"]}

        super().fit(
            x, encoded_intents, epochs=self.hparams.num_epochs, batch_size=32, shuffle=True)

        # Persist the model
        self.extra_params["intent_names"] = intent_names

        self.save()

    @tfbp.runnable
    def evaluate(self):
        encoded_texts, encoded_intents, _, _, _ = self.data_loader(
            self.tokenizer, self.extra_params)

        metrics = [SparseCategoricalAccuracy("accuracy")]
        self.compile(metrics=metrics)

        intent_probas = self(encoded_texts)  # type: ignore
        
        scores = self.get_metrics_by_intent(intent_probas, encoded_intents)

        overall_score = {}
        overall_score["intent_confidence"] = self.aggregate_metric(
            scores, "intent_confidence")
        overall_score["loss"] = self.aggregate_metric(scores, "loss")

        scores["Overall Scores"] = overall_score
        scores = self.format_scores(scores)

        print("\nScores per intent:")
        for intent, score in scores.items():
            print("{}: {}".format(intent, score))

        return scores

    @tfbp.runnable
    def predict(self):
        text = self.data_loader.get_prediction_data()

        info = self.get_prediction(text)

        print(self.summary())
        print("Text : " + text)
        print(json.dumps(info, indent=2))

        return json.dumps(info, indent=2)

    def get_prediction(self, text: str):
        inputs = self.data_loader.encode_text(text, self.tokenizer)
        intent_probas = self(inputs)  # type: ignore

        intent_probas_np = intent_probas.numpy()
        
        # Get the indices of the maximum values
        intent_id = intent_probas_np.argmax(axis=-1)[0]
        
        # get the confidences for each intent
        intent_confidences = intent_probas_np[0]

        return {
            "text": text,
            "intent": {"name": self.extra_params["intent_names"][intent_id],
                       "confidence": float(intent_confidences[intent_id])},
        }
