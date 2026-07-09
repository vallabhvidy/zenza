from typing import Dict, Any
from sympy import sympify

def exprange(start: int, end: int, factor: float = 2):
    n: int = start
    while n <= end:
        yield n
        n = max(n + 1, int(n * factor))

def ao5(run, N: int):
    if N-2 <= 0:
        return run(N)
    
    vals = []
    for i in range(1, 5):
        if N-i > 0:
            vals.append(N-i)
        vals.append(N+i)

    times = []
    
    for n in vals:
        output = run(n)

        if output['status'] != 'OK':
            return output
        
        times.append((output['time'], output['memory'], n,))

    times.sort()

    t = times[1:-1]
    ts = [i[0] for i in t]
    ms = [i[1] for i in t]
    ns = [i[2] for i in t]

    result = {
        'time': sum(ts) / len(ts),
        'memory': sum(ms) / len(ms),
        'n': sum(ns) / len(ns),
        'status': 'OK'
    }

    return result

def resolve(exp: str, context: Dict[str, Any]) -> int:
    try:
        return int(exp)
    except ValueError:
        try:
            return int(float(exp))
        except ValueError:
            pass

    result = sympify(exp, locals=context)

    if isinstance(result, int) or isinstance(result, float) or result.is_integer is True:
        return int(result)
    
    raise ValueError("Expression provided cannot be evaluated...")
