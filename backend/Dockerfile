FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app ./app
COPY training ./training
COPY migrations ./migrations
COPY seed_demo.py ./seed_demo.py
ENV DB_PATH=/data/screenings.db MODEL_PATH=/data/model.json
EXPOSE 8000
CMD ["uvicorn","app.main:app","--host","0.0.0.0","--port","8000"]
