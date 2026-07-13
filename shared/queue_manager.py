import redis
import json
from typing import Optional
from shared.config import settings

if settings.REDIS_URL:
    r = redis.from_url(settings.REDIS_URL, db=0)
else:
    r = redis.Redis(host=settings.REDIS_HOST, port=settings.REDIS_PORT, db=0)

class QueueManager:
    @staticmethod
    def enqueue_job(job_id: str, payload: dict, queue_name: str = "jobs_queue") -> None:
        r.hset(f"job:{job_id}", mapping={
            "status": "QUEUED",
            "results": json.dumps([])
        })
        
        r.rpush(queue_name, json.dumps(payload))

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
