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

SERVER_URL = "http://takearea.me:4002/"
# JSON_FILE_PATH = "cacheServer.json"
JSON_FILE_PATH = "/media/hxtruong/Data/CodeLynX/graphql-cache-server/ExtractLogs/result.json"

# def run_query(query, variables, headers): # A simple function to use requests.post to make the API call. Note the json= section.
#     request = requests.post(SERVER_URL, json={'query': query, 'variables': variables}, headers=headers)
#     if request.status_code == 200:
#         return request.json()
#     else:
#         raise Exception("Query failed to run by returning code of {}. {}".format(request.status_code, query))

def run_query(query, variables): # A simple function to use requests.post to make the API call. Note the json= section.
    request = requests.post(SERVER_URL, json={'query': query, 'variables': variables})
    if request.status_code == 200:
        return request.json()
    else:
        raise Exception("Query failed to run by returning code of {}. {}".format(request.status_code, query))

# def run_query(query): # A simple function to use requests.post to make the API call. Note the json= section.
#     request = requests.post(SERVER_URL, json={'query': query})
#     if request.status_code == 200:
#         return request.json()
#     else:
#         raise Exception("Query failed to run by returning code of {}. {}".format(request.status_code, query))

def load_json(file_path):
    # get json from file
    fi = open(file_path, 'r')
    data = json.load(fi);
    return data;

def compareTest(expectedResult, requestResult):
    print( expectedResult.__str__())
    print(requestResult.__str__())
    return expectedResult.__str__() == requestResult.__str__()

def displayDiff(expectedResult, requestResult):
    print("##### Expected result #####\n")
    print(json.dumps(expectedResult, indent=3))
    print("\n##### Request result #####\n")
    print(json.dumps(requestResult, indent=3))
    print('\n')

def main():
    # qnaSeries = json.loads(JSON_FILE_PATH)
    with open(JSON_FILE_PATH) as f:
        qnaSeries = json.load(f)
  
    passTest = 0;
    for index, item in enumerate(qnaSeries):      
        # raise Exception(f"{item}")
      
        if index == 3:
            log = json.loads(item["logs"])
            # print(log)
            queryInfo = json.loads(log["query"])
            expectedResult = json.loads(log["result"])
            query = queryInfo["query"]
            variables = queryInfo["variables"]
            typeQuery = log["type"]
            timeQuery = log["time"]
          
            # print(f"Query: {query}\nResult: {expectedResult}")
      
            requestResult = run_query(query, variables)
            if compareTest(expectedResult, requestResult):
                passTest += 1
            else:
                print(f"The number {index + 1} test is FAILED!")
                print("The Query: {0}\nThe variables: {1}".format(query, variables))
                displayDiff(expectedResult, requestResult)

    

    print(f"{passTest} PASSED!")
    print(f"{len(qnaSeries)-passTest} FAILED!")

if (__name__=="__main__"):
    main()
