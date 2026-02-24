# Use a slim Python 3.12 image
FROM python:3.12-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install uv
ADD https://astral.sh/uv/install.sh /uv-install.sh
RUN sh /uv-install.sh && rm /uv-install.sh
ENV PATH="/root/.local/bin/:$PATH"

# Set working directory to project root
WORKDIR /app

# Copy dependency files
COPY backend/pyproject.toml backend/uv.lock ./backend/

# Install dependencies using uv
RUN uv sync --project ./backend --no-install-project --no-dev

# Copy application code and alembic
COPY backend/app/ ./backend/app/
COPY alembic/ ./alembic/
COPY alembic.ini ./

# Expose port
EXPOSE 8000

# Set PYTHONPATH to root so 'backend.app' works
ENV PYTHONPATH="/app"

# Run the FastAPI server
CMD ["uv", "run", "--project", "./backend", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
