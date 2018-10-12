import sys
import subprocess
import timeit

DEFAULT_FILE_NAME = "unitTestServer.py"
DEFAULT_NUMBER_TEST = 10

def runParallel(fileName, numberRun):
    combineCmds = ""
    for i in range(numberRun):
        combineCmds+= " & python " + fileName
    result = subprocess.call('python ' + fileName + combineCmds)

# Run test parrelle
def main():
    start = timeit.default_timer()

    cmds = sys.argv
    if len(cmds)> 3:
        fileName = ""
        numberRun = 10
        for i in range(len(cmds)):
            if cmds[i] == "--file" or cmds[i] == "-f":
                fileName = cmds[i+1]
            if cmds[i] == "--number" or cmds[i] == "-n":
                numberRun = cmds[i+1]
        runParallel(fileName, numberRun)
    else:
        runParallel(DEFAULT_FILE_NAME, DEFAULT_NUMBER_TEST)

    stop = timeit.default_timer()

    print('Total time run: ', stop - start)

if __name__ == "__main__":
    main()
