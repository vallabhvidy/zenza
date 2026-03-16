import socket

def get_header(message):
    message_length = str(len(message)).encode(FORMAT)
    message_length += b' ' * (HEADER - len(message_length))
    return message_length

ADDR = '/tmp/sockets/test'
FORMAT = 'utf-8'
HEADER = 64

client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
client.connect(ADDR)

code = ''

with open('experiments/test2.py', 'r') as f:
    code = f.read()

code_length = get_header(code)

client.send(code_length)
client.send(code.encode(FORMAT))

testcase = '5'
testcase_length = get_header(testcase)

client.send(testcase_length)
client.send(testcase.encode(FORMAT))

time = client.recv(1024).decode(FORMAT)
print(time)

disconnect = '!DISCONNECT'
disconnect_length = get_header(disconnect)
client.send(disconnect_length)
client.send(disconnect.encode(FORMAT))

client.close()