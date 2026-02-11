# Start from python 3.9 slim
FROM python:3.9-slim

# Set environment variables for dlib compilation
ENV CMAKE_ARGS="-DDLIB_USE_CUDA=0 -DDLIB_USE_BLAS=0 -DDLIB_USE_LAPACK=0"
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    cmake \
    libgl1-mesa-glx \
    libsm6 \
    libxext6 \
    libxrender-dev \
    tesseract-ocr \
    python3-dev \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Start command
CMD ["uvicorn", "src.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
