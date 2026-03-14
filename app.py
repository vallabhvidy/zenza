from fastapi import FastAPI
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from containers.containerize import containers
from models.code import Code
import logging
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8501"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

stop_streaming = False

def generate_results(container, input_schema, x_var):

    global stop_streaming

    x_min = x_var.min
    x_max = x_var.max

    # binary search to figure out the optimal
    # maximum limit of 'n' (input variable).
    l: int = 0
    h: int = x_max
    x_max = -1

    while l <= h and not stop_streaming:

        mid: int = l + (h - l) // 2

        context = {x_var.name: mid}
        time = container.run(input_schema.generate(context) + "\n")

        if time == -1:
            h = mid - 1
        else:
            x_max = mid
            l = mid + 1


    # run the code for different 'n' and stream
    for n in (int(i) for i in range(x_min, x_max, max(1, (x_max - x_min) // 1000))):

        if stop_streaming:
            break

        context = {x_var.name: n}
        
        t = container.run(input_schema.generate(context) + "\n")

        data = {
            "n": n,
            "output": "",
            "time": t
        }

        yield json.dumps(data) + "\n"

    container.close()
    stop_streaming = False

# API Section

@app.get("/", response_class=HTMLResponse)
def home():
    with open("index.html") as f:
        return f.read()

@app.post('/run')
def run(code: Code):
    logging.info(msg=f'got request for code = {code.code}')
    
    container = containers[code.language](code.code)
    
    return StreamingResponse(
        generate_results(container, code.input_schema, code.x_var),
        media_type="application/x-ndjson"
    )

@app.post('/stop')
def stop():
    global stop_streaming
    stop_streaming = True