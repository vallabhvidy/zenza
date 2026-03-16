import socket

ADDR = '/tmp/mysocket'

server = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
server.bind(ADDR)
server.listen()

while True:
    conn, addr = server.accept()
    print('Connected : ', addr)

    data = conn.recv(1024)
    print("Received:", data.decode())

    conn.send(b"Yooooooooo")

    conn.close()