from .json_helper import JsonHelper

"""
Transform data set from Rasa structure to a compliant one

How to use: 
from utils.jisf_data_mapper import JisfDataMapper


mapper = JisfDataMapper()

#mapper.transform_to_new("train.json")
mapper.transform_to_new("test.json")
"""

class JisfDataMapper(object):

    def transform_to_new(self, filename: str, reverse: bool = False):
        """this method allows for changing a file's data format."""
        helper=JsonHelper()

        data = helper.read_dataset_json_file(filename)
        copy_file = "copy of "+filename

        # we create a copy of the old data format
        helper.write_dataset_json_file(data, copy_file)

        # alternatively, we could use this method in the opposite direction
        if not reverse:
            data = self.old_to_new(data)
        else:
            data = self.new_to_old(data)

        helper.write_dataset_json_file(data, filename)

    def old_to_new(self,data:dict):
        converted_data=dict()
        converted_data["common_examples"]=[]
        all_intents=set()
        all_slots=dict()
        for k in data.keys():
            common_example=dict()

            #text and intent are the same in both formats
            common_example["text"]=data[k]["text"]
            common_example["intent"]=data[k]["intent"]
            common_example["entities"]=[]
            all_intents.add(common_example["intent"])

            #for every entity, we get its corresponding value as well as the index of its 
            #start and finish
            for slot in data[k]["slots"].keys():
                all_slots[slot]=all_slots.get(slot,set())
                entity=dict()
                entity["entity"]=slot
                entity["value"]=data[k]["slots"][slot]
                all_slots[slot].add(entity["value"])
                entity["start"],entity["end"]=tuple(data[k]["positions"][slot])
                common_example["entities"].append(entity)
            converted_data["common_examples"].append(common_example)

        #lookup tables store all the intents as well as all the slot values seen in the dataset
        converted_data["lookup_tables"]=[]
        all_slots["intent"]=all_intents
        for name,value in all_slots.items():
            converted_data["lookup_tables"].append({"name":name,"elements":list(value)})

        #regex features and entity synonyms will remain empty for now
        converted_data["regex_features"]=[]
        converted_data["entity_synonyms"]=[]

        return converted_data

    def new_to_old(self,data:dict):

        old_data=dict()
        dataset=data["common_examples"]

        #for each piece of text, we make a JSON object.
        for i in range(len(dataset)):
            item=dict()
            item["text"]=dataset[i]["text"]
            item["intent"]=dataset[i]["intent"]
            item["slots"]=dict()
            item["positions"]=dict()
            for entity in dataset[i]["entities"]:
                item["slots"][entity["entity"]]=entity["value"]
                item["positions"][entity["entity"]]=[entity["start"],entity["end"]]
            old_data[i]=item
        
        return old_data
