#!/bin/sh
set -eu
alembic upgrade head
exec uvicorn app.principal:aplicacao --host 0.0.0.0 --port 8000

