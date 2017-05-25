import os
import pandas as pd
import pymongo
import json



def import_content(filepath):
    mng_client = pymongo.MongoClient('localhost', 27017)
    mng_db = mng_client['webtest'] # Replace mongo db name
    collection_name = 'opendata' # Replace mongo db collection name
    db_cm = mng_db[collection_name]
    cdir = os.path.dirname("C://liquefaction.json")
    file_res = os.path.join(cdir, filepath)

    data = pd.read_json(file_res)
    print(data)
    data_json = json.loads(data.to_json(orient='records'))
    db_cm.remove()
    db_cm.insert(data_json)

if __name__ == "__main__":
  filepath = "C://liquefaction.json"  # pass csv file path
  import_content(filepath)