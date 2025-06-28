FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir "pydantic[email]"

# Create directories with proper permissions
RUN mkdir -p /app/data /app/media && \
    chmod -R 777 /app/data /app/media

# Copy the rest of the application
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8080
ENV DATABASE_URL="sqlite+aiosqlite:///./data/data.db"
ENV HOST=0.0.0.0

# Expose the port
EXPOSE 8080

# Run the application
CMD exec uvicorn main:app --host $HOST --port $PORT 