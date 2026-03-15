import socket
import subprocess
import sys
import resource

PORT = 6666
HOST = '0.0.0.0'
ADDR = (HOST, PORT)

HEADER  = 64
FORMAT  = 'utf-8'
TIMEOUT = 3

TIMEOUT_ERROR  = '!TIMEOUT'
TESTCASE_ERROR = '!TCERROR'
DICONNECT_MESSAGE = '!DISCONNECT'

def receive(conn, length):
    message = ''
    while len(message) < length:
        message = conn.recv(length).decode(FORMAT)

    return message

print('[STARTING] container is starting...')

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
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

while True:
    testcase_length = int(receive(conn, HEADER))
    testcase = receive(conn, testcase_length)

    if testcase == DICONNECT_MESSAGE:
        break

    print('[TESTCASE] testcase recieved from host...')
    print('[TESTCASE] length of testcase :', testcase_length)

    try:
        print('[RUNNING] running code with testcase...')

        start_usage = resource.getrusage(resource.RUSAGE_CHILDREN)

        subprocess.run(
            [sys.executable, 'code.py'],
            input=testcase,
            timeout=TIMEOUT,
            text=True,
            stdout=subprocess.DEVNULL
        )
        
        end_usage = resource.getrusage(resource.RUSAGE_CHILDREN)

        print('[FINISH] finished running code with testcase...')

        cpu_time = (
            end_usage.ru_utime - start_usage.ru_utime
        ) + (
            end_usage.ru_stime - start_usage.ru_stime
        )

        print('[TIME] time for testcase :', cpu_time)

        conn.send(str(cpu_time).encode(FORMAT))

    except subprocess.TimeoutExpired as e:
        print('[TIMEOUT] running testcase is taking too long...')
        conn.send(TIMEOUT_ERROR.encode(FORMAT))

    except subprocess.CalledProcessError as e:
        print('[TCERROR] format of testcase seems to be invalid...')
        conn.send(TESTCASE_ERROR.encode(FORMAT))

print('[DISCONNECT] container is disconnecting...')
conn.close()


