FROM python:3.9-slim

# Allow statements and log messages to immediately appear in the logs
ENV PYTHONUNBUFFERED True

# Create and change to the app directory.
WORKDIR /app

# Copy local code to the container image.
COPY requirements.txt .

# Install production dependencies.
RUN pip install --no-cache-dir -r requirements.txt

# Copy local code to the container image.
COPY . .

# Set environment variable for the port
ENV PORT 8080

# Run the web service on container startup using gunicorn with uvicorn workers
CMD exec uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 1 --timeout-keep-alive 75 