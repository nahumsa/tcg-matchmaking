# Track Specification: Migrate from pip to uv

## Overview
This track involves migrating the Python backend dependency management from standard `pip` and `requirements.txt` to `uv`. This will improve dependency resolution speed, provide a reproducible lockfile (`uv.lock`), and modernize the project's configuration using `pyproject.toml`.

## Functional Requirements
- **Initialize uv Project:** Create a `pyproject.toml` file in the root directory.
- **Dependency Migration:**
    - Parse existing `requirements.txt`.
    - Add core dependencies (`fastapi`, `uvicorn`, `sqlalchemy`, `psycopg2-binary`, `alembic`, `pydantic-settings`) to the main project dependencies.
    - Add development dependencies (`pytest`, `pytest-cov`, `httpx`) to a separate `dev` dependency group.
- **Lockfile Generation:** Run `uv lock` to generate a `uv.lock` file.
- **Environment Management:** Use `uv` to manage the virtual environment, replacing the manual `python -m venv venv` approach.
- **Documentation Update:**
    - Update `README.md` to use `uv sync`, `uv run`, and `uv add` commands.
- **Docker Update:** If a `Dockerfile` exists, update it to use `uv` for faster, more reliable image builds.

## Non-Functional Requirements
- **Performance:** Significant reduction in dependency installation and environment setup time.
- **Reproducibility:** Ensuring all environments (dev, CI, prod) use the exact same dependency versions via `uv.lock`.

## Acceptance Criteria
- [ ] `pyproject.toml` and `uv.lock` files are present in the root directory.
- [ ] `requirements.txt` is removed.
- [ ] All backend tests pass when running with `uv run pytest`.
- [ ] `README.md` instructions are updated and verified.
- [ ] The `venv/` directory is managed by `uv` or recreated using `uv`.

## Out of Scope
- Migrating the frontend dependency management (npm/yarn/pnpm).
- Updating Python version unless required by `uv` constraints.
