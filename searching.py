from models.run_request import RunRequest

def binary_search(run_request: RunRequest):
    print('[SEARCHING] doing binary search to determine x_max...')

    x_var = run_request.code.x_var
    container = run_request.container
    input_schema = run_request.code.input_schema

    # binary search to figure out the optimal
    # maximum limit of 'n' (input variable).
    l: int = x_var.min
    h: int = max(1, x_var.max)

    last_valid: int = -1

    while h <= 10**9 and run_request.active:
        print('[EXPSEARCH] trying :', h)

        context = {x_var.name : h}
        output = container.run(input_schema.generate(context) + '\n')

        if output['status'] != 'OK':
            break
        
        last_valid = h
        h *= 2
    
    print('[COMPLETE] exp search is complete...')
    print('[EXPSEARCH] h :', h)
    print('[EXPSEARCH] last valid :', last_valid)

    if last_valid == -1:
        print('[EXPSEARCH] no valid upper limit found. returning...')
        return -1

    l = last_valid
    x_max = -1

    while l <= h and run_request.active:

        mid: int = l + (h - l) // 2

        print('[BINSEARCH] current mid :', mid)

        context = {x_var.name: mid}
        output = container.run(input_schema.generate(context) + '\n')

        if output['status'] != 'OK':
            h = mid - 1
        else:
            x_max = mid
            l = mid + 1

    print('[COMPLETE] binary search is complete, determined x_max :', x_max)

    return x_max