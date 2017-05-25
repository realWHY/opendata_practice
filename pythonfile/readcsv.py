import os
import pandas as pd
import pymongo
import json
import codecs



def import_content(filepath):
    mng_client = pymongo.MongoClient('localhost', 27017)
    mng_db = mng_client['rateme'] # Replace mongo db name
    collection_name = 'opendata' # Replace mongo db collection name
    db_cm = mng_db[collection_name]
    cdir = os.path.dirname("C://liquefaction.json")
    file_res = os.path.join(cdir, filepath)
    data = pd.read_json(codecs.open(file_res, 'r', 'utf-8'))
    #data = pd.read_json(file_res)
    
    data_json = json.loads(data.to_json(orient='records'))
    print(data_json)
    db_cm.remove()
    db_cm.insert(data_json)

if __name__ == "__main__":
  filepath = "C://liquefaction.json"  # pass csv file path
  import_content(filepath)