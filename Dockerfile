FROM python:3.10-slim
WORKDIR /app
COPY main.py .
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*
RUN pip install --no-cache-dir fastapi uvicorn langchain-ollama pydantic argparse
EXPOSE 8000
CMD ["python", "main.py", "--model", "llama3:8b", "--port", "8000"]