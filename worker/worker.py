import redis
import json
import time
from shared.models.code import Code
from worker.run_request import RunRequest
from shared.queue_manager import QueueManager, r
from worker.factory import worker_factory
from worker.searching import resolve
import shared.tools as tools
import worker.validation as validation

def process_job(job: dict):
    job_id = job["job_id"]
    code_data = Code(**job["code_data"])
    
    print(f"[WORKER] Starting job {job_id}...")
    QueueManager.update_job(job_id, "RUNNING")
    
    ContainerClass = worker_factory.get_container_class(code_data.language)
    container = ContainerClass(code_data.code)
    
    run_request = RunRequest(job_id, container, code_data, True)
    
    try:
        x_min = validation.valid_lower_limit(run_request)
        if x_min == -1:
            raise Exception("Lower limit of x or testcase format is invalid...")
            
        x_max = validation.valid_upper_limit(run_request)
        if x_max == -1:
            raise Exception("Upper limit for x is too large...")
            
        run_request.code.x_var.min = str(x_min)
        run_request.code.x_var.max = str(x_max)
        
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
            
        if run_request.active:
            QueueManager.update_job(job_id, "COMPLETED", results=results)
            print(f"[WORKER] Job {job_id} completed successfully.")
        else:
            QueueManager.update_job(job_id, "STOPPED", results=results)
            print(f"[WORKER] Job {job_id} was stopped by user.")
            
    except Exception as e:
        print(f"[WORKER] Job {job_id} failed: {e}")
        QueueManager.update_job(job_id, "FAILED", error=str(e))
    finally:
        container.close()

def main():
    print("[WORKER] Worker is online and waiting for jobs...")
    while True:
        try:
            result = r.brpop("jobs_queue", timeout=5)
            if result:
                _, job_data = result
                job = json.loads(job_data)
                process_job(job)
        except Exception as e:
            print(f"[WORKER] Queue listener error: {e}")
            time.sleep(1)

if __name__ == "__main__":
    main()
