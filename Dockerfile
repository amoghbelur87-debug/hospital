FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend_py directory and inference.py
COPY backend_py/ ./backend_py/
COPY inference.py .

# Expose port
EXPOSE 7860

# Start the inference server
CMD ["python", "inference.py"]