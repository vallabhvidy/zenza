import redis
import json
from typing import Optional

r = redis.Redis(host='localhost', port=6379, db=0)

class QueueManager:
    @staticmethod
    def enqueue_job(job_id: str, payload: dict) -> None:
        r.hset(f"job:{job_id}", mapping={
            "status": "QUEUED",
            "results": json.dumps([])
        })
        
        r.rpush("jobs_queue", json.dumps(payload))

    @staticmethod
    def get_job_status(job_id: str) -> Optional[dict]:
        data = r.hgetall(f"job:{job_id}")
        if not data:
            return None
        return {k.decode('utf-8'): v.decode('utf-8') for k, v in data.items()}

    @staticmethod
    def update_job(job_id: str, status: str, results: list = None, error: str = None) -> None:
        mapping = {"status": status}
        if results is not None:
            mapping["results"] = json.dumps(results)
        if error is not None:
            mapping["error"] = error or ""
            
        r.hset(f"job:{job_id}", mapping=mapping)
        
        r.publish(f"channel:{job_id}", json.dumps({
            "status": status,
            "results": results or [],
            "error": error or ""
        }))
