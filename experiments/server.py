import socket

PORT = 5050
HOST = '127.0.0.1'
ADDR = (HOST, PORT)

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(ADDR)
server.listen()

while True:
    conn, addr = server.accept()
    print('Connected : ', addr)

    data = conn.recv(1024)
    print("Received:", data.decode())

    conn.send(b"Yooooooooo")

    conn.close()