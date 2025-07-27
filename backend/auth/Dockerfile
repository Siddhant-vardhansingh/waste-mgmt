FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y git

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

RUN pip install --no-cache-dir pre-commit black flake8

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
