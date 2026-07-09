from socket import socket

HEADER = 64
FORMAT = 'utf-8'
TIMEOUT_ERROR  = '!TIMEOUT'
TESTCASE_ERROR = '!TCERROR'
DICONNECT_MESSAGE = '!DISCONNECT'

def get_header(message):
    message_length = str(len(message)).encode(FORMAT)
    message_length += b' ' * (HEADER - len(message_length))
    return message_length

def send(conn: socket, message: str):
    header = get_header(message)
    conn.send(header)
    conn.send(message.encode(FORMAT))

def receive(conn: socket, length: int):
    message = b''
    while len(message) < length:
        message += conn.recv(length - len(message))
        if not message:
            raise Exception('[ERROR] socket closed ig...?')

    return message.decode(FORMAT)
    