FROM python:3.13-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY shared/ ./shared/
COPY worker/ ./worker/

ENV PYTHONPATH=/app

CMD ["python", "-m", "worker.worker"]
