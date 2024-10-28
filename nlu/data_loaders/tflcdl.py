from sklearn.calibration import LabelEncoder
import boilerplate as tfbp
from sklearn.preprocessing import OneHotEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
import re
import numpy as np
from typing import Any, Tuple, Dict, List
import os
import joblib

from utils.json_helper import JsonHelper

# TFLC (Term Frequency based Language Classifier) Data Loader


class TFLCDL(tfbp.DataLoader):
    default_hparams: Dict[str, Any] = {"ngram_range": (3, 3), "test_size": .2}
    # We need to store the fitted preprocessing objects so that we can transform the
    # test and predict sets properly.
    _save_dir: str
    tfidf: TfidfVectorizer
    one_hot_encoder: OneHotEncoder
    label_encoder: LabelEncoder
    language_names: List[str]
    json_helper: JsonHelper

    def __init__(self, method=None, save_dir=None, **hparams):
        super().__init__(method, **hparams)

        self.json_helper = JsonHelper("tflc")
        self._save_dir = save_dir

        # We will opt for a TF-IDF representation of the data as the frequency of word
        # roots should give us a good idea about which language we're dealing with.
        if method == "fit":
            self.tfidf = TfidfVectorizer(analyzer="char_wb",
                            ngram_range=tuple(self.hparams.ngram_range))
        else:
            if self._save_dir is not None and os.path.isfile(os.path.join(self._save_dir, "tfidf_vectorizer.joblib")):
                self.tfidf = joblib.load(os.path.join(self._save_dir, 'tfidf_vectorizer.joblib'))
            else:
                raise ValueError(f'Unable to load tfidf in {self._save_dir} ')

    def strip_numbers(self, text: str):
        return re.sub(r'[0-9]{2,}', '', text.lower())

    def get_texts_and_languages(self, dataset: List[dict]):
        """ Extracts the text and the language label from the text's JSON object"""
        texts = []
        languages = []

        for item in dataset:
            # An item is a JSON object that has text, entities among its keys.
            language = ""
            entities: List[dict] = item.get("entities", [])
            # There can only be at most 1 language for a single piece of text.
            # The entity we choose has to have "language as the name like this
            # { "name":"language","value":"fr","start":-1,"end":-1 }
            language_entities = list(filter(lambda entity: "language" in entity.values(),
                                            entities))
            if language_entities:
                language = language_entities[0]["value"]
            # Numbers and capital letters don't provide information about the language
            # so it's better to not have them.
            if language:
                text = self.strip_numbers(item["text"])
                texts.append(text)
                languages.append(language)

        return texts, languages

    def preprocess_train_dataset(self) -> Tuple[np.ndarray, np.ndarray]:
        """Preprocessing the training set and fitting the proprocess steps in the process"""

        json = self.json_helper.read_dataset_json_file("train.json")
        dataset = json["common_examples"]

        # If a sentence has a language label, we include it in our dataset
        # Otherwise, we discard it.
        texts, languages = self.get_texts_and_languages(dataset)

        encoded_texts = np.array(self.tfidf.fit_transform(texts).toarray())

        # Encoding language labels as integers
        self.label_encoder = LabelEncoder()
        integer_encoded = np.array(
            self.label_encoder.fit_transform(languages)).reshape(-1, 1)
        self.language_names = list(self.label_encoder.classes_)
        # Encoding integers to one hot vectors
        self.one_hot_encoder = OneHotEncoder(
            sparse=False, handle_unknown="error")
        encoded_languages = self.one_hot_encoder.fit_transform(integer_encoded)

        # Saving the fitted tfidf vectorizer
        joblib.dump(self.tfidf, os.path.join(self._save_dir, 'tfidf_vectorizer.joblib'))

        # We return the training data in the format of the model input
        return encoded_texts, encoded_languages

    def __call__(self) -> Tuple[np.ndarray, np.ndarray, List[str]]:

        # Regardless of the method, we're required to fit our preprocessing to the training data
        if self.method == "fit":
            encoded_texts, encoded_languages = self.preprocess_train_dataset()
            return encoded_texts, encoded_languages, self.language_names
        elif self.method == "evaluate":
            dataset = self.json_helper.read_dataset_json_file("test.json")
            # We transform the test data.
            texts, languages = self.get_texts_and_languages(
                dataset["common_examples"])
            # Encoding text using TF-IDF.
            encoded_texts = np.array(self.tfidf.transform(
                texts).toarray())  # type: ignore
            # Encoding language labels as integers
            self.label_encoder = LabelEncoder()
            # Transforming the language labels.
            integer_encoded = self.label_encoder.fit_transform(
                languages).reshape(-1, 1)  # type:ignore
            # Encoding integers to one hot vectors
            self.one_hot_encoder = OneHotEncoder(
                sparse=False, handle_unknown="error")
            encoded_languages = np.array(self.one_hot_encoder.fit_transform(
                integer_encoded))
            return encoded_texts, encoded_languages
        else:
            raise ValueError("Unknown method!")

    def encode_text(self, text: str):
        sanitized_text = self.strip_numbers(text)
        return self.tfidf.transform([sanitized_text]).toarray() # type: ignore
