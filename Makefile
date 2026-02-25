# Makefile for TCG Matchmaking System

# Variables
UV = uv
PYTHON = $(UV) run
BACKEND_DIR = backend
FRONTEND_DIR = frontend
ALEMBIC = $(PYTHON) --project $(BACKEND_DIR) alembic
UVICORN = $(PYTHON) --project $(BACKEND_DIR) uvicorn

.PHONY: help setup db-up db-migrate db-revision backend-dev frontend-dev dev test lint clean docker-up docker-down

# Default target
help:
	@echo "Available commands:"
	@echo "  setup           - Install backend and frontend dependencies"
	@echo "  db-up           - Start the database container (PostgreSQL)"
	@echo "  db-migrate      - Run alembic database migrations"
	@echo "  db-revision msg="..." - Create a new alembic migration revision"
	@echo "  backend-dev     - Start the backend FastAPI server (hot-reload)"
	@echo "  frontend-dev    - Start the frontend Vite server"
	@echo "  dev             - Start both backend and frontend in parallel"
	@echo "  test            - Run both backend and frontend tests"
	@echo "  lint            - Run backend and frontend linting"
	@echo "  clean           - Remove virtual environments, node_modules, and caches"
	@echo "  docker-up       - Start the entire system using Docker Compose"
	@echo "  docker-down     - Stop and remove Docker Compose containers"

# Setup dependencies
setup:
	@echo "Installing backend dependencies..."
	cd $(BACKEND_DIR) && $(UV) sync
	@echo "Installing frontend dependencies..."
	cd $(FRONTEND_DIR) && npm install

# Database management
db-up:
	docker compose up -d db

db-migrate:
	$(ALEMBIC) upgrade head

db-revision:
	@if [ -z "$(msg)" ]; then echo "Error: Missing msg parameter. Use: make db-revision msg="your message""; exit 1; fi
	$(ALEMBIC) revision --autogenerate -m "$(msg)"

# Development servers
backend-dev:
	PYTHONPATH=. $(UVICORN) backend.app.main:app --host 0.0.0.0 --port 8000 --reload

frontend-dev:
	cd $(FRONTEND_DIR) && npm run dev

# Run both in parallel
# Using & and wait to run both in one terminal window
dev:
	@echo "Starting development environment..."
	@$(MAKE) -j 2 backend-dev frontend-dev

# Testing and Linting
test:
	@echo "Running backend tests with coverage..."
	PYTHONPATH=. $(PYTHON) --project $(BACKEND_DIR) pytest --cov=backend/app $(BACKEND_DIR)/tests
	@echo "Running frontend tests..."
	cd $(FRONTEND_DIR) && npm test

lint:
	@echo "Linting backend (ruff)..."
	$(PYTHON) --project $(BACKEND_DIR) ruff check .
	@echo "Linting frontend (eslint)..."
	cd $(FRONTEND_DIR) && npm run lint

# Cleanup
clean:
	rm -rf $(BACKEND_DIR)/.venv
	rm -rf $(FRONTEND_DIR)/node_modules
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	find . -type d -name ".ruff_cache" -exec rm -rf {} +
	@echo "Cleaned up environments and caches."

# Docker Compose commands
docker-up:
	docker compose up --build

docker-down:
	docker compose down
