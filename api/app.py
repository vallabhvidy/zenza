from fastapi import FastAPI, HTTPException
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from shared.models.code import Code
from shared.queue_manager import QueueManager, r
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

# API Section

@app.get("/health")
def health():
    return {"status": "OK"}
    
@app.post("/run_request", response_class=JSONResponse)
def run_request(code: Code):
    print(f'[REQUEST] got request for code of length = {len(code.code)}')
    
    request_id = str(uuid.uuid4())
    
    payload = {
        "job_id": request_id,
        "code_data": code.model_dump()
    }

    queue_name = f"jobs_queue_{code.language}"
    QueueManager.enqueue_job(request_id, payload, queue_name=queue_name)

    return { 'request_id' : request_id }

@app.post('/run/{request_id}')
def run(request_id: str):
    job_status = QueueManager.get_job_status(request_id)

    if not job_status:
        raise HTTPException(
            status_code=404,
            detail={
                'type': 'REQUEST_NOT_FOUND',
                'message': 'request before running code...'
            }
        )

    def event_generator():
        pubsub = r.pubsub()
        pubsub.subscribe(f"channel:{request_id}")
        
        current_status = QueueManager.get_job_status(request_id)
        if current_status:
            yield json.dumps({"type": "status", "status": current_status.get("status", "QUEUED")}) + "\n"
            
            if current_status.get("status") in ["COMPLETED", "FAILED", "STOPPED"]:
                results = json.loads(current_status.get("results", "[]"))
                for res in results:
                    yield json.dumps(res) + "\n"
                return

        for message in pubsub.listen():
            if message["type"] == "message":
                data = json.loads(message["data"])
                yield json.dumps({"type": "status", "status": data["status"]}) + "\n"
                if data.get("results"):
                    yield json.dumps(data["results"][-1]) + "\n"
                if data["status"] in ["COMPLETED", "FAILED", "STOPPED"]:
                    break
    
    return StreamingResponse(
        event_generator(),
        media_type="application/x-ndjson"
    )

@app.post('/stop/{request_id}')
def stop(request_id: str):
    job_status = QueueManager.get_job_status(request_id)
    if job_status:
        QueueManager.update_job(request_id, "STOPPED")
        return {"message": "Stopped successfully."}
    else:
        raise HTTPException(
            status_code=404,
            detail={
                'type': 'REQUEST_NOT_FOUND',
                'message': 'request before stopping code...'
            }
        )

# Frontend static asset routes
@app.get("/", response_class=HTMLResponse)
def read_root():
    try:
        with open("api/frontend/index.html", "r") as f:
            return f.read()
    except FileNotFoundError:
        return HTMLResponse("<h2>Zenza Frontend index.html not found. Please ensure it exists in the 'api/frontend' directory.</h2>", status_code=404)

@app.get("/style.css")
def read_css():
    from fastapi import Response
    try:
        with open("api/frontend/style.css", "r") as f:
            return Response(content=f.read(), media_type="text/css")
    except FileNotFoundError:
        return Response(status_code=404)

@app.get("/app.js")
def read_js():
    from fastapi import Response
    try:
        with open("api/frontend/app.js", "r") as f:
            return Response(content=f.read(), media_type="application/javascript")
    except FileNotFoundError:
        return Response(status_code=404)
