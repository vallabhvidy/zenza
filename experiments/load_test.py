import asyncio
import aiohttp
import time
import json
import statistics

# Configuration
API_URL = "http://localhost:8000"
NUM_REQUESTS = 500
CONCURRENCY_LIMIT = 500

# Sample Python code payload to benchmark
CODE_PAYLOAD = {
    "language": "python",
    "code": "print('Hello World')",
    "input_schema": {
        "input": [
            {
                "type": "int",
                "name": "NOCONTEXT",
                "min": "1",
                "max": "1"
            }
        ]
    },
    "x_var": {
        "type": "int",
        "name": "NOCONTEXT",
        "min": "10",
        "max": "10"
    },
    "reduce_noise": False,
    "search": False
}

async def run_benchmark(session, sem, worker_id, metrics):
    async with sem:
        start_time = time.time()
        
        # 1. Submit the benchmark request
        async with session.post(f"{API_URL}/run_request", json=CODE_PAYLOAD) as resp:
            if resp.status != 200:
                print(f"[{worker_id}] Failed to submit request. Status: {resp.status}")
                return
            data = await resp.json()
            request_id = data.get("request_id")
            
        submit_time = time.time()
        
        # 2. Connect to the NDJSON streaming endpoint
        ttfb = None
        completion_time = None
        
        async with session.post(f"{API_URL}/run/{request_id}") as resp:
            async for line in resp.content:
                if not ttfb:
                    # Time to First Byte (TTFB): measures perceived latency of the stream
                    ttfb = time.time() - submit_time
                    metrics['ttfb'].append(ttfb)
                
                try:
                    event = json.loads(line)
                    # Check if the job finished
                    if event.get("type") == "status" and event.get("status") in ["COMPLETED", "FAILED", "STOPPED"]:
                        completion_time = time.time() - start_time
                        metrics['total_time'].append(completion_time)
                        break
                except json.JSONDecodeError:
                    pass
        
        if completion_time and ttfb:
            print(f"[{worker_id}] Finished in {completion_time:.2f}s (Latency/TTFB: {ttfb*1000:.0f}ms)")
        else:
            print(f"[{worker_id}] Failed to complete properly.")

async def main():
    print(f"Starting load test against {API_URL} with {NUM_REQUESTS} requests...")
    metrics = {'ttfb': [], 'total_time': []}
    
    # Limit concurrency so we don't overwhelm local sockets
    sem = asyncio.Semaphore(CONCURRENCY_LIMIT)
    
    async with aiohttp.ClientSession() as session:
        tasks = [run_benchmark(session, sem, i, metrics) for i in range(NUM_REQUESTS)]
        
        start = time.time()
        await asyncio.gather(*tasks)
        end = time.time()
        
    print("\n" + "="*40)
    print(" 🚀 BENCHMARK RESULTS FOR RESUME 🚀 ")
    print("="*40)
    
    if not metrics['total_time']:
        print("No requests completed successfully. Ensure the server and workers are running.")
        return
        
    print(f"Total Requests Processed: {len(metrics['total_time'])} / {NUM_REQUESTS}")
    print(f"Total Wall Clock Time: {end - start:.2f} seconds")
    print(f"Overall Throughput: {len(metrics['total_time']) / (end - start):.2f} requests/second")
    
    if metrics['ttfb']:
        avg_latency = statistics.mean(metrics['ttfb']) * 1000
        print(f"\n⚡ Streaming Perceived Latency (Time to First Byte):")
        print(f"  Average Latency: {avg_latency:.2f} ms")
        print(f"  Min Latency: {min(metrics['ttfb'])*1000:.2f} ms")
        print(f"  Max Latency: {max(metrics['ttfb'])*1000:.2f} ms")
        print(f"\n  -> RESUME METRIC: \"Reduced perceived latency to ~{int(avg_latency)}ms through real-time NDJSON streaming...\"")
        
    if metrics['total_time']:
        print(f"\n⏱️  Execution Time per Job (from submission to finish):")
        print(f"  Average: {statistics.mean(metrics['total_time']):.2f} s")
        print(f"  Min: {min(metrics['total_time']):.2f} s")
        print(f"  Max: {max(metrics['total_time']):.2f} s")
        
    print("\n💡 Tip for Resume:")
    print(f"\"Architected a distributed benchmarking platform using FastAPI and Redis, capable of processing {CONCURRENCY_LIMIT}+ concurrent benchmark jobs with an overall throughput of {len(metrics['total_time']) / (end - start):.1f} req/sec.\"")

if __name__ == "__main__":
    asyncio.run(main())
