import redis
import json
import time
import os
import logging
from shared.models.code import Code
from worker.run_request import RunRequest
from shared.queue_manager import QueueManager, r
from worker.factory import worker_factory
from worker.searching import resolve
import shared.tools as tools
import worker.validation as validation

logging.basicConfig(
    level=logging.INFO,
    format='[%(levelname)s] %(name)s - %(message)s'
)
logger = logging.getLogger("worker")

QUEUE_NAME = os.getenv("QUEUE_NAME", "jobs_queue")

def process_job(job: dict):
    job_id = job["job_id"]
    code_data = Code(**job["code_data"])
    
    logger.info(f"Starting job {job_id}...")
    QueueManager.update_job(job_id, "RUNNING")
    
    ContainerClass = worker_factory.get_container_class(code_data.language)
    container = ContainerClass(code_data.code)
    
    run_request = RunRequest(job_id, container, code_data, True)
    
    try:
        x_min = validation.valid_lower_limit(run_request)
        if x_min == -1:
            raise Exception("Lower limit of x or testcase format is invalid...")
            
        run_request.code.x_var.min = str(x_min)
        
        x_min_val = resolve(run_request.code.x_var.min, {})
        x_max_val = resolve(run_request.code.x_var.max, {})
        
        results = []
        for n in tools.exprange(x_min_val, x_max_val, factor=1.3):
            job_status = QueueManager.get_job_status(job_id)
            if not job_status or job_status.get("status") == "STOPPED":
                run_request.active = False
                break
                
            output = tools.ao5(
                lambda N : container.run(run_request.code.input_schema.generate({run_request.code.x_var.name: int(N)}) + "\n"),
                n
            )
            results.append(output)
            
            QueueManager.update_job(job_id, "RUNNING", results=results)
            
            if output['status'] != 'OK':
                break
            
        if run_request.active:
            QueueManager.update_job(job_id, "COMPLETED", results=results)
            logger.info(f"Job {job_id} completed successfully.")
        else:
            QueueManager.update_job(job_id, "STOPPED", results=results)
            logger.info(f"Job {job_id} was stopped by user.")
            
    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}", exc_info=True)
        QueueManager.update_job(job_id, "FAILED", error=str(e))
    finally:
        container.close()

def main():
    logger.info("Worker is online and waiting for jobs...")
    while True:
        try:
            with open("/tmp/worker_heartbeat", "w") as f:
                f.write(str(time.time()))
            result = r.brpop(QUEUE_NAME, timeout=5)
            if result:
                _, job_data = result
                job = json.loads(job_data)
                process_job(job)
        except Exception as e:
            logger.error(f"Queue listener error: {e}", exc_info=True)
            time.sleep(1)

if __name__ == "__main__":
    main()
