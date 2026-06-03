#!/bin/bash
set -e
cd "$(dirname "$0")"

# Install deps if needed
pip install -r requirements.txt --quiet

# Start FastAPI service
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
