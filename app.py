from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from containers.containerize import containers
from models.code import Code
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

streaming = False

def binary_search(container, input_schema, x_var):
    print('[SEARCHING] doing binary search to determine x_max...')

    # binary search to figure out the optimal
    # maximum limit of 'n' (input variable).
    l: int = x_var.min
    h: int = max(1, x_var.min)

    last_valid: int = -1

    while h <= 10**18 and streaming:
        print('[EXPSEARCH] trying :', h)

        context = {x_var.name : h}
        time = container.run(input_schema.generate(context) + '\n')

        if time == -1:
            break
        
        last_valid = h
        h *= 2
    
    print('[COMPLETE] exp search is complete...')
    print('[EXPSEARCH] h :', h)
    print('[EXPSEARCH] last valid :', last_valid)

    l = last_valid
    x_max = -1

    while l <= h and streaming:

        mid: int = l + (h - l) // 2

        print('[BINSEARCH] current mid :', mid)

        context = {x_var.name: mid}
        time = container.run(input_schema.generate(context) + '\n')

        if time == -1:
            h = mid - 1
        else:
            x_max = mid
            l = mid + 1

    print('[COMPLETE] binary search is complete, determined x_max :', x_max)

    return x_max

def validate_limits(container, input_schema, x_var, search):
    print('[VALIDATE] validating upper limit of x variable...')

    if search:
        print('[VALIDATE] search is enabled...')
        return binary_search(container, input_schema, x_var)

    x_max = x_var.max

    context = {x_var.name : x_max}
    time = container.run(input_schema.generate(context) + '\n')

    print('[VALIDATE] current upper limit does not work...')

    if time == -1:
        return -1
    else:
        return x_max

def generate_results(container, input_schema, x_var):

    global streaming

    x_min = x_var.min
    x_max = x_var.max

    # run the code for different 'n' and stream
    for n in (int(i) for i in range(x_min, x_max, max(1, (x_max - x_min) // 1000))):

        if not streaming:
            break

        context = {x_var.name: n}
        
        t = container.run(input_schema.generate(context) + "\n")

        data = {
            "n": n,
            "time": t
        }

        yield json.dumps(data) + "\n"

    container.close()
    streaming = False

# API Section

@app.get("/", response_class=HTMLResponse)
def home():
    with open("index.html") as f:
        return f.read()

@app.post('/run')
def run(code: Code):
    print(f'[REQUEST] got request for code = {code.code}')
    
    container = containers[code.language](code.code)

    global streaming
    streaming = True

    x_max = validate_limits(container, code.input_schema, code.x_var, code.search)
    if x_max == -1:
        print('[ERROR] upper limit to x is invalid...')
        container.close()
        raise HTTPException(
            status_code=400,
            detail={
                'type': 'LIMIT_EXCEEDED',
                'message': 'upper limit for x is too large...'
            }
        )
    
    print('[VALIDATE] upper limit of x variable decided...')
    
    code.x_var.max = x_max
    
    return StreamingResponse(
        generate_results(container, code.input_schema, code.x_var),
        media_type="application/x-ndjson"
    )

@app.post('/stop')
def stop():
    global streaming
    streaming = False