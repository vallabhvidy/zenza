from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from containers.containerize import containers
from models.code import Code
from models.run_request import RunRequest
import tools
import validation
import uuid
import json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

active_users: dict[str, RunRequest] = {}

def deactivate_user(run_request: RunRequest):
    run_request.active = False
    run_request.container.close()
    active_users.pop(run_request.request_id, None)

def generate_results(run_request: RunRequest):
    x_var = run_request.code.x_var
    container = run_request.container
    input_schema = run_request.code.input_schema

    from searching import resolve

    x_min = resolve(x_var.min, {})
    x_max = resolve(x_var.max, {})

    for n in tools.exprange(x_min, x_max, factor=1.3):
        if not run_request.active:
            break
        
        output = tools.ao5(
            lambda N : container.run(input_schema.generate({x_var.name: int(N)}) + "\n"),
            n
        )
        # output = container.run(input_schema.generate({x_var.name: n}) + "\n")
        # output['n'] = n

        yield json.dumps(output) + '\n'

    deactivate_user(run_request)

def validate_limits(run_request: RunRequest):
    x_min = validation.valid_lower_limit(run_request)
    if x_min == -1:
        print('[ERROR] lower limit of x or testcase format is invalid...')
        deactivate_user(run_request)
        raise HTTPException(
            status_code=400,
            detail={
                'type': 'LIMIT_EXCEEDED',
                'message': 'lower limit for x or testcase format is invalid...'
            }
        )
    
    print('[VALIDATE] lower limit of x variable decided...')

    x_max = validation.valid_upper_limit(run_request)
    if x_max == -1:
        print('[ERROR] upper limit to x is invalid...')
        deactivate_user(run_request)
        raise HTTPException(
            status_code=400,
            detail={
                'type': 'LIMIT_EXCEEDED',
                'message': 'upper limit for x is too large...'
            }
        )
    
    print('[VALIDATE] upper limit of x variable decided...')
    
    return x_min, x_max

# API Section

@app.get("/", response_class=HTMLResponse)
def home():
    with open("index.html") as f:
        return f.read()
    
@app.post("/run_request", response_class=JSONResponse)
def run_request(code: Code):
    print(f'[REQUEST] got request for code of length = {len(code.code)}')
    
    request_id = str(uuid.uuid4())
    container = containers[code.language](code.code)

    run_request = RunRequest(request_id, container, code, True)

    active_users[request_id] = run_request

    return { 'request_id' : request_id }

@app.post('/run/{request_id}')
def run(request_id: str):

    if (active_users.get(request_id, -1) == -1):
        raise HTTPException(
            status_code=404,
            detail={
                'type': 'REQUEST_NOT_FOUND',
                'message': 'request before running code...'
            }
        )

    run_request = active_users[request_id]

    x_min, x_max = validate_limits(run_request)

    run_request.code.x_var.min = str(x_min)
    run_request.code.x_var.max = str(x_max)
    
    return StreamingResponse(
        generate_results(run_request),
        media_type="application/x-ndjson"
    )

@app.post('/stop/{request_id}')
def stop(request_id: str):
    if (active_users.get(request_id, -1) != -1):
        active_users[request_id].active = False