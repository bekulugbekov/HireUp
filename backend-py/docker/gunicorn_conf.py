"""Gunicorn production configuration.

Workers default to `cpu_count * 2 + 1`, overridable via env. We restart
workers after `max_requests` to bound memory growth, and use the
Uvicorn worker class so FastAPI's async event loop runs unmodified.
"""

from __future__ import annotations

import multiprocessing
import os

bind = f"0.0.0.0:{os.getenv('APP_PORT', '8000')}"

workers = int(os.getenv("GUNICORN_WORKERS", multiprocessing.cpu_count() * 2 + 1))
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = int(os.getenv("GUNICORN_WORKER_CONNECTIONS", 1000))

# Restart workers periodically so a slow leak never becomes an outage.
max_requests = int(os.getenv("GUNICORN_MAX_REQUESTS", 1000))
max_requests_jitter = int(os.getenv("GUNICORN_MAX_REQUESTS_JITTER", 50))

timeout = int(os.getenv("GUNICORN_TIMEOUT", 60))
graceful_timeout = int(os.getenv("GUNICORN_GRACEFUL_TIMEOUT", 30))
keepalive = int(os.getenv("GUNICORN_KEEPALIVE", 5))

accesslog = "-"
errorlog = "-"
loglevel = os.getenv("LOG_LEVEL", "info").lower()

# Preserve client IP through Nginx / load balancer
forwarded_allow_ips = os.getenv("GUNICORN_FORWARDED_ALLOW_IPS", "*")
proxy_protocol = False

# Useful for distributed tracing later
proc_name = "hireup-api"
