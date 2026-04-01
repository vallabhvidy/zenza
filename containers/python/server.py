import socket
import subprocess
import sys
import json
import resource

PORT = sys.argv[1]
ADDR = f'/sockets/{PORT}'

HEADER  = 64
FORMAT  = 'utf-8'
TIMEOUT = 1

TIMEOUT_ERROR  = json.dumps({"time": 0, "memory": 0, "status": "TLE"})
TESTCASE_ERROR = json.dumps({"time": 0, "memory": 0, "status": "RE"})
DICONNECT_MESSAGE = '!DISCONNECT'

def receive(conn, length):
    message = b''
    while len(message) < length:
        message += conn.recv(length - len(message))
        if not message:
            raise Exception('[ERROR] socket closed ig...?')

    return message.decode(FORMAT)

def get_header(message):
    message_length = str(len(message)).encode(FORMAT)
    message_length += b' ' * (HEADER - len(message_length))
    return message_length

def send(conn: socket.socket, message: str):
    header = get_header(message)
    conn.send(header)
    conn.send(message.encode(FORMAT))

print('[STARTING] container is starting...')

server = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
server.bind(ADDR)
server.listen()

print('[STARTING] container started...')
print('[LISTENING] container listening on port :', PORT)

conn, addr = server.accept()

print('[ACCEPT] recieved connection from address :', addr)

code_length = receive(conn, HEADER)
code_length = int(code_length)
code = receive(conn, code_length)

print('[CODE] code recieved from host...')
print('[CODE] length of code :', code_length)

with open('code.py', 'w') as f:
    f.write(code)

command_using_gnu_time = ['/usr/bin/time', '-f', '{"time": %e, "memory": %M, "status": "OK"}', '-o', 'output.json', sys.executable, 'code.py']
command_using_time_module = [sys.executable, 'code.py']

def measure_using_gnu_time() -> dict:
    print('[RUNNING] running code with testcase...')

    subprocess.run(
        command_using_gnu_time,
        input=testcase,
        timeout=TIMEOUT,
        text=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=True
    )
    
    print('[FINISH] finished running code with testcase...')

    output = {
        "time": 0,
        "memory": 0,
        "status": "OK"
    }

    with open('output.json', 'r') as f:
        output = json.loads(f.read())

    output['time'] *= 1000 # for converting to milliseconds

    return output

def measure_using_resource_module() -> dict:
    print('[RUNNING] running code with testcase...')

    start_usage = resource.getrusage(resource.RUSAGE_CHILDREN)

    subprocess.run(
        command_using_time_module,
        input=testcase,
        timeout=TIMEOUT,
        text=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=True
    )

    end_usage = resource.getrusage(resource.RUSAGE_CHILDREN)

    memory_in_kb = resource.getrusage(resource.RUSAGE_CHILDREN).ru_maxrss
    cpu_time_in_ms = ((
        end_usage.ru_utime - start_usage.ru_utime
    ) + (
        end_usage.ru_stime - start_usage.ru_stime
    )) * 1000
    
    print('[FINISH] finished running code with testcase...')

    output = {
        "time": cpu_time_in_ms,
        "memory": memory_in_kb,
        "status": "OK"
    }

    return output

while True:
    testcase_length = int(receive(conn, HEADER))
    testcase = receive(conn, testcase_length)

    if testcase == DICONNECT_MESSAGE:
        break

    print('[TESTCASE] testcase recieved from host...')
    print('[TESTCASE] length of testcase :', testcase_length)

    try:
        output = measure_using_resource_module()

        print('[TIME] time for testcase :', output['time'])
        print('[MEMORY] memory for testcase :', output['memory'])

        send(conn, json.dumps(output))

    except subprocess.TimeoutExpired as e:
        print('[TIMEOUT] running testcase is taking too long...')
        send(conn, TIMEOUT_ERROR)

    except subprocess.CalledProcessError as e:
        print('[TCERROR] format of testcase seems to be invalid...')
        send(conn, TESTCASE_ERROR)

print('[DISCONNECT] container is disconnecting...')
conn.close()


