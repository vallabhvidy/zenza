import socket

def get_send_length(message):
    message_length = str(len(message)).encode(FORMAT)
    message_length += b' ' * (HEADER - len(message_length))
    return message_length

HOST = "127.0.0.1"
PORT = 6666
FORMAT = 'utf-8'
HEADER = 64

client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
client.connect((HOST, PORT))

code = ''

with open('experiments/test2.py', 'r') as f:
    code = f.read()

code_length = get_send_length(code)

client.send(code_length)
client.send(code.encode(FORMAT))

testcase = '5'
testcase_length = get_send_length(testcase)

client.send(testcase_length)
client.send(testcase.encode(FORMAT))

disconnect = '!DISCONNECT'
disconnect_length = get_send_length(disconnect)
client.send(disconnect_length)
client.send(disconnect.encode(FORMAT))

client.close()