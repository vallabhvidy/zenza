import requests

payload = {
    "code": "print('hello')",
    "language": "python",
    "input_schema": {
        "input": []
    },
    "x_var": {
        "type": "int",
        "name": "n",
        "min": "1",
        "max": "10000"
    }
}

r = requests.post("http://localhost:8000/run_request", json=payload)
print("Submit:", r.json())
req_id = r.json()["request_id"]

r = requests.post(f"http://localhost:8000/run/{req_id}", stream=True)
for line in r.iter_lines():
    print(line.decode('utf-8'))
