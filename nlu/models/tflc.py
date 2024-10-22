import tensorflow as tf
from sys import platform

if platform == "darwin":
    from keras.optimizers.legacy import Adam
else:
    from keras.optimizers import Adam

from keras import layers, Sequential, regularizers
import numpy as np
from typing import Any, Dict, Tuple
from data_loaders.tflcdl import TFLCDL

import boilerplate as tfbp


def mapify(keys: list, values: list) -> dict:
    return dict(zip(keys, values))


def format_float(values: np.ndarray, precision: int = 5, padding: int = 5) -> list:
    return [np.format_float_positional(v, precision=precision, pad_right=padding,
                                       min_digits=padding) for v in values]


# TFLC (Term Frequency based Language Classifier)

@tfbp.default_export
class TFLC(tfbp.Model):
    default_hparams: Dict[str, Any] = {
        "layer_sizes": [32, 2],
        "num_epochs": 70,
        "kernel_regularizer": 1e-4,
        "bias_regularizer": 1e-4,
        "dropout_proba": .2,
        "learning_rate": 1e-3
    }
    data_loader: TFLCDL

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Init data loader
        self.data_loader = TFLCDL(save_dir=self._save_dir, **kwargs)

        # Init layers
        self.forward = Sequential()

        # Dropout layer to avoid overfitting
        self.forward.add(layers.Dropout(self.hparams.dropout_proba))

        # Hidden feed forward layers
        for hidden_size in self.hparams.layer_sizes[:-1]:
            self.forward.add(layers.Dense(hidden_size, activation=tf.nn.sigmoid,
                                          kernel_regularizer=regularizers.L2(
                                              self.hparams.kernel_regularizer),
                                          bias_regularizer=regularizers.L2(self.hparams.bias_regularizer)))

        # Output layer
        self.forward.add(layers.Dense(self.hparams.layer_sizes[-1], activation=tf.nn.softmax,
                                      kernel_regularizer=regularizers.L2(
                                          self.hparams.kernel_regularizer),
                                      bias_regularizer=regularizers.L2(self.hparams.bias_regularizer)))

        self.loss = tf.losses.categorical_crossentropy
        self.optimizer = Adam(self.hparams.learning_rate)

    def call(self, x: tf.Tensor):
        return self.forward(x)

    @tfbp.runnable
    def fit(self):
        # getting our training data
        X_train, y_train, languages = self.data_loader()
        self.compile(self.optimizer, self.loss)
        # fitting the model to the data
        super().fit(
            x=X_train,
            y=y_train,
            # validation_split=0.1,
            epochs=self.hparams.num_epochs,
            shuffle=True)

        self.extra_params["languages"] = languages

        # Save the model
        self.save()

    @tfbp.runnable
    def evaluate(self):
        languages = list(self.extra_params['languages'])
        # loading the test set
        X_test, y_test = self.data_loader()
        y_pred = super().predict(X_test)

        self.calculate_metrics(y_test, y_pred, languages)

    def preprocess_text(self, text):
        # The predict file contains a single JSON object whose only key is text.
        stripped_text = self.strip_numbers(text)
        encoded_text = np.array(self.tfidf.transform(
            [stripped_text]).toarray())  # type: ignore
        return np.array([stripped_text]), encoded_text

    @tfbp.runnable
    def predict(self):
        languages = list(self.extra_params['languages'])
        input_provided = input("Provide text: ")
        text, encoded_text = self.preprocess_text(input_provided)
        # converting a one hot output to language index
        probas = super().predict(encoded_text)
        predictions = np.argmax(probas, axis=1)

        results = []
        for idx, prediction in enumerate(predictions):
            print('The sentence "{}" is in {}.'.format(
                text[idx], languages[prediction].upper()))
            results.append({'text': text[idx], 'language': prediction})
        return results

    def get_prediction(self, text: str):
        languages = self.extra_params["languages"]
        encoded_text = self.data_loader.encode_text(text)
        probas = super().predict(encoded_text)
        predictions = np.argmax(probas, axis=1)
        prediction_id = predictions[0]
        return {
            'entity': "language",
            'value': languages[prediction_id],
            'confidence': float(probas[0][prediction_id])
        }

    def calculate_metrics(self, y_true: np.ndarray, y_pred: np.ndarray, languages: list,
                          formatting: int = 5) -> Tuple[np.float64, dict, dict, dict]:

        argm = np.argmax(y_pred, axis=1)
        actual_pred = [i == argm[j] for j in range(
            y_pred.shape[0]) for i in range(y_pred.shape[1])]
        actual_pred = np.array(actual_pred).reshape(-1, y_true.shape[1])

        # we use these to compute the metrics
        true_positives = (np.logical_and(
            actual_pred == y_true, y_true)).sum(axis=0)
        actual_positives = y_true.sum(axis=0)
        positive_preds = actual_pred.sum(axis=0)

        # our chosen metrics are recall, precision, accuracy and F1 score
        recall = (true_positives/actual_positives).T
        precision = (true_positives/positive_preds).T
        f1_score = (2*recall*precision/(recall+precision)).T

        # converting our other metrics into a map (dict)
        recall = mapify(languages, format_float(recall, padding=formatting))
        precision = mapify(languages, format_float(
            precision, padding=formatting))
        f1_score = mapify(languages, format_float(
            f1_score, padding=formatting))

        # from one hot vectors to the language index
        y_pred = np.array(np.argmax(y_pred, axis=1))
        y_true = np.argmax(y_true, axis=1)
        accuracy = (y_pred == y_true).mean()

        print("accuracy: {}".format(
            np.format_float_positional(accuracy, formatting)))
        print("recall:\n{}".format(recall))
        print("precision:\n{}".format(precision))
        print("F1 score:\n{}".format(f1_score))

        return (accuracy, recall, precision, f1_score)
