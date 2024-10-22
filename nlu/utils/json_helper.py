import os
import json

class JsonHelper:
    data_folder: str

    def __init__(self, model:str = "intent_classifier"):
        self.data_folder=os.path.join("data",model)

    def read_dataset_json_file(self, filename):
        file_path = os.path.join(self.data_folder, filename)
        if os.path.exists(file_path):

            with open(file_path, "r", encoding="utf-8") as json_file:
                data = json.load(json_file)
                return data
        else:
            raise FileNotFoundError("No file found with that path!")
        
    def write_dataset_json_file(self, data: dict, file: str, indent: int = 2):
        """converts a dictionary to a JSON file"""
        with open(os.path.join(self.data_folder, file), "w", encoding="utf-8") as outfile:
            outfile.write(json.dumps(data, indent=indent))