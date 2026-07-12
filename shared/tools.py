from typing import Dict, Any
from sympy import sympify
from collections.abc import Iterator, Generator

# legacy
def exprange(start: int, end: int, factor: float = 2) -> Iterator[int]:
    n: int = start
    while n <= end:
        yield n
        n = max(n + 1, int(n * factor))

def adaptive_range(start: int, end: int) -> Generator[int, float, None]:
    n = start
    prev_time_ms = 0.0
    
    last_time_ms = yield n
    if last_time_ms is None:
        last_time_ms = 0.0
        
    prev_time_ms = last_time_ms
    n += 1
    
    while n <= end:
        last_time_ms = yield n
        if last_time_ms is None:
            last_time_ms = 0.0
            
        ratio = 1.0
        if prev_time_ms > 0:
            ratio = last_time_ms / prev_time_ms
            
        if last_time_ms >= 500.0:
            factor = 1.0
        elif ratio > 1.1 and last_time_ms > 10.0:
            factor = 1.05
        elif last_time_ms < 10.0:
            factor = 2.0
        elif last_time_ms < 50.0:
            factor = 1.4
        elif last_time_ms < 200.0:
            factor = 1.15
        else:
            factor = 1.05
            
        prev_time_ms = last_time_ms
        n = max(n + 1, int(n * factor) if factor > 1.0 else n + 1)

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
        'n': int(sum(ns) / len(ns)),
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
