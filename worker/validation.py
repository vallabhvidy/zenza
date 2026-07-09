from worker.searching import binary_search
from worker.run_request import RunRequest

def valid_lower_limit(run_request: RunRequest):
    print('[VALIDATE] validating lower limit of x variable...')

    x_var = run_request.code.x_var
    container = run_request.container
    input_schema = run_request.code.input_schema

    x_min = int(x_var.min)
    context = {x_var.name : x_min}
    output = container.run(input_schema.generate(context) + '\n')

    print('[VALIDATE] validated lower limit, status :', output['status'])

    if output['status'] != 'OK':
        return -1
    
    return x_min

def valid_upper_limit(run_request: RunRequest):
    print('[VALIDATE] validating upper limit of x variable...')

    x_var = run_request.code.x_var
    container = run_request.container
    input_schema = run_request.code.input_schema
    search = run_request.code.search

    if search:
        print('[VALIDATE] search is enabled...')
        return binary_search(run_request)

    x_max = int(x_var.max)

    context = {x_var.name : x_max}
    output = container.run(input_schema.generate(context) + '\n')

    if output['status'] != 'OK':
        print('[VALIDATE] current upper limit does not work...')
        return -1
    
    return x_max
