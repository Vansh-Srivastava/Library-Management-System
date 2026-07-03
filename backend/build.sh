#!/usr/bin/env bash
# Render build script. Referenced by render.yaml (buildCommand).
# Runs on every deploy: install deps, collect static files, apply migrations.
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
