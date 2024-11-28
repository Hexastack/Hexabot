from typing import Dict, List, Union
import tensorflow as tf
import json
import numpy as np
from transformers import PreTrainedTokenizerFast, PreTrainedTokenizer


import boilerplate as tfbp
from utils.json_helper import JsonHelper


class JointRawData(object):
    id: str
    intent: str
    positions: Dict[str, List[int]]
    slots: Dict[str, str]
    text: str

    def __init__(self, id, intent, positions, slots, text):
        self.id = id
        self.intent = intent
        self.positions = positions
        self.slots = slots
        self.text = text

    def __repr__(self):
        return str(json.dumps(self.__dict__, indent=2))  # type: ignore
##
# JISFDL : Joint Intent and Slot Filling Model Data Loader
##


class JISFDL(tfbp.DataLoader):

    def encode_texts(self, texts: List[str], tokenizer: Union[PreTrainedTokenizer, PreTrainedTokenizerFast]):
        # https://huggingface.co/transformers/preprocessing.html
        return tokenizer(texts, padding=True, truncation=True, return_tensors="tf")

    def encode_intents(self, intents, intent_map) -> tf.Tensor:
        """Map to train_data values"""
        encoded = []
        for i in intents:
            encoded.append(intent_map[i])
        # convert to tf tensor
        return tf.convert_to_tensor(encoded, dtype="int32")

    def get_slot_from_token(self, token: str, slot_dict: Dict[str, str]):
        """ this function maps a token to its slot label"""
        # each token either belongs to a slot or has a null slot
        for slot_label, value in slot_dict.items():
            if token in value:
                return slot_label
        return None

    def encode_slots(self, tokenizer: Union[PreTrainedTokenizer, PreTrainedTokenizerFast],
                     all_slots: List[Dict[str, str]], all_texts: List[str],
                     slot_map: Dict[str, int],  max_len: int):

        encoded_slots = np.zeros(
            shape=(len(all_texts), max_len), dtype=np.int32)
        # each slot is assigned to the tokenized sentence instead of the raw text
        # so that mapping a token to its slots is easier since we can use our bert tokenizer.
        for idx, slot_names in enumerate(all_slots):
            for slot_name, slot_text in slot_names.items():
                slot_names[slot_name] = tokenizer.tokenize(slot_text)
            # we now assign the sentence's slot dictionary to its index in all_slots .
            all_slots[idx] = slot_names

        for idx, text in enumerate(all_texts):
            enc = []  # for this idx, to be added at the end to encoded_slots

            # for each text, we retrieve all the slots with the
            # words in that slot.
            slot_names = all_slots[idx]

            # we tokenize our input text to match the tokens in the slot dictionary
            tokens = tokenizer.tokenize(text)

            for token in tokens:
                # each token is matched to its individual label
                token_slot_name = self.get_slot_from_token(token, slot_names)
                # if the token has no label, we give the null label <PAD>
                # the label is then appended to the labels of the current text
                if token_slot_name:
                    enc.append(slot_map[token_slot_name])
                else:
                    enc.append(0)

            # now add to encoded_slots
            # the first and the last elements
            # in encoded text are special characters
            encoded_slots[idx, 1:len(enc)+1] = enc

        return encoded_slots

    def get_synonym_map(self):
        helper = JsonHelper()
        helper.read_dataset_json_file('train.json')
        data = helper.read_dataset_json_file('train.json')
        synonyms = data["entity_synonyms"]
        synonym_map = {}
        for entry in synonyms:
            value = entry["value"]
            for synonym in entry["synonyms"]:
                synonym_map[synonym] = value    
        return synonym_map 
    
    def parse_dataset_intents(self, data):

        intents = []
        k = 0

        # Filter examples by language
        lang = self.hparams.language
        all_examples = data["common_examples"]

        if not bool(lang):
            examples = all_examples
        else:
            examples = filter(lambda exp: any(e['entity'] == 'language' and e['value'] == lang for e in exp['entities']), all_examples)

        # Parse raw data
        for exp in examples:
            text = exp["text"].lower()
            intent = exp["intent"]
            entities = exp["entities"]

            # Filter out language entities
            slot_entities = filter(
                lambda e: e["entity"] != "language", entities)
            slots = {}
            for e in slot_entities: 
            # Create slots with entity values and resolve synonyms
                if "start" in e and "end" in e and isinstance(e["start"], int) and isinstance(e["end"], int):
                    original_value = text[e["start"]:e["end"]]
                    entity_value = e["value"]
                    if entity_value != original_value:
                        entity_value = original_value.lower()
                    slots[e["entity"]] = entity_value
                else:
                    continue
            positions = [[e.get("start", -1), e.get("end", -1)]
                         for e in slot_entities]

            temp = JointRawData(k, intent, positions, slots, text)
            k += 1
            intents.append(temp)

        return intents

    def __call__(self, tokenizer: Union[PreTrainedTokenizer, PreTrainedTokenizerFast], model_params = None):
        # I have already transformed the train and test datasets to the new format using
        # the transform to new hidden method.

        helper = JsonHelper()

        if self.method in ["fit", "train"]:
            dataset = helper.read_dataset_json_file('train.json')
            train_data = self.parse_dataset_intents(dataset)
            return self._transform_dataset(train_data, tokenizer)
        elif self.method in ["evaluate"]:
            dataset = helper.read_dataset_json_file('test.json')
            test_data = self.parse_dataset_intents(dataset)
            return self._transform_dataset(test_data, tokenizer, model_params)
        else:
            raise ValueError("Unknown method!")

    def _transform_dataset(self, dataset: List[JointRawData], tokenizer: Union[PreTrainedTokenizer, PreTrainedTokenizerFast], model_params = None):
        # We have to encode the texts using the tokenizer to create tensors for training
        # the classifier.
        texts = [d.text for d in dataset]
        encoded_texts = self.encode_texts(texts, tokenizer)
        # Map intents, load from the model (evaluate), recompute from dataset otherwise (train)
        intents = [d.intent for d in dataset]
        if not model_params:
            intent_names = list(set(intents))
            # Map slots, load from the model (evaluate), recompute from dataset otherwise (train)
            slot_names = set()
            for td in dataset:
                slots = td.slots
                for slot in slots:
                    slot_names.add(slot)
            slot_names = list(slot_names)
            # To pad all the texts to the same length, the tokenizer will use special characters.
            # To handle those we need to add <PAD> to slots_names. It can be some other symbol as well.
            slot_names.insert(0, "<PAD>")
        else:
            if "intent_names" in model_params:
                intent_names = model_params["intent_names"]
            else:
                intent_names = None
            
            if "slot_names" in model_params:
                slot_names = model_params["slot_names"]
            else:
                slot_names = None

        if intent_names:
            intent_map = dict()  # Dict : intent -> index
            for idx, ui in enumerate(intent_names):
                intent_map[ui] = idx
        else:
            intent_map = None

        # Encode intents
        if intent_map:
            encoded_intents = self.encode_intents(intents, intent_map)
        else:
            encoded_intents = None

        if slot_names:
            slot_map: Dict[str, int] = dict()  # slot -> index
            for idx, us in enumerate(slot_names):
                slot_map[us] = idx
        else:
            slot_map = None

        # Encode slots
        # Text : Add a tune to my elrow Guest List
        # {'music_item': 'tune', 'playlist_owner': 'my', 'playlist': 'elrow Guest List'}
        # [ 0  0  0 18  0 26 12 12 12 12  0  0  0  0  0  0  0  0  0  0  0  0  0  0
        #   0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0  0]
        max_len = len(encoded_texts["input_ids"][0])  # type: ignore
        all_slots = [td.slots for td in dataset]
        all_texts = [td.text for td in dataset]
        
        if slot_map:
            encoded_slots = self.encode_slots(tokenizer,
                                          all_slots, all_texts, slot_map, max_len)
        else:
            encoded_slots = None

        return encoded_texts, encoded_intents, encoded_slots, intent_names, slot_names


    def encode_text(self, text: str, tokenizer: Union[PreTrainedTokenizer, PreTrainedTokenizerFast]):
        return self.encode_texts([text], tokenizer)
