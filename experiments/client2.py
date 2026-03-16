import socket

ADDR = '/tmp/mysocket'

client = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
client.connect(ADDR)

client.send('Yo server'.encode('utf-8'))
msg = client.recv(1024).decode('utf-8')

print(msg)