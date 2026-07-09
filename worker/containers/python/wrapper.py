import subprocess
import resource
import sys

TESTEND = '------TESTEND------'
CODEEND = '------CODEEND------'
END = '------------\n'
TIMEOUT = 'Timeout'
TCERROR = 'Testcase Error'
SUCCESS = 'SUCCESS'

code = ''
while True:
    line = sys.stdin.readline()
    if line == END:
        break
    code += line

print(SUCCESS, flush=True)

with open('code.py', 'w') as f:
    f.write(code)

while True:

    testcase = ''

    print('Testcase recieved :', testcase)

    while True:
        line = sys.stdin.readline()
        if line == END:
            break

        testcase += line

    try:

        start_usage = resource.getrusage(resource.RUSAGE_CHILDREN)

        subprocess.run(
            [sys.executable, 'code.py'],
            input=testcase,
            timeout=3,
            text=True,
            stdout=subprocess.DEVNULL
        )
        
        end_usage = resource.getrusage(resource.RUSAGE_CHILDREN)

        cpu_time = (
            end_usage.ru_utime - start_usage.ru_utime
        ) + (
            end_usage.ru_stime - start_usage.ru_stime
        )

        print(cpu_time)

    except subprocess.TimeoutExpired as e:

        print(TIMEOUT)

    except subprocess.CalledProcessError as e:

        print(TCERROR)