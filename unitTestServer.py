# qnaSeries = [
#     {
#         query:"query{  restaurants {    id    title  }}",
#         expectedResult:""

#     },
#     {

#     },
#     {

#     }
# ]


# for qna in qnaSeries:
#     request.post(url, qna["q"])
#     //TODO: compare to qna["a"]
#     print("PASSED step....")

import json
import requests

SERVER_URL = "http://takearea.me:4000/"
JSON_FILE_PATH = "cacheServer.json"

def run_query(query): # A simple function to use requests.post to make the API call. Note the json= section.
    request = requests.post(SERVER_URL, json={'query': query})
    if request.status_code == 200:
        return request.json()
    else:
        raise Exception("Query failed to run by returning code of {}. {}".format(request.status_code, query))


def load_json(file_path):
    # get json from file
    fi = open(file_path, 'r')
    data = json.load(fi);
    return data;

def compareTest(expectedResult, requestResult):
    return expectedResult.__str__() == requestResult.__str__()

def main():
    qnaSeries = load_json(JSON_FILE_PATH)
    #print(qnaSeries)
    passTest = 0;
    for index, item in enumerate(qnaSeries):
        if item.get('query') and item.get('query'):
            query, expectedResult = item["query"], item["expectedResult"];
            #print(f"index {index}\n query: {query} \n result: {expectedResult}")
            requestResult = run_query(query)
            if compareTest(expectedResult, requestResult):
                passTest += 1
            else:
                print(f"The number {index + 1} test is FAILED!")
        else:
            print("Undefined test!")

    print(f"{passTest} PASSED!")
    print(f"{len(qnaSeries)-passTest} FAILED!")

if (__name__=="__main__"):
    main()
