# Shared Flask extensions (kept separate to avoid circular imports)
import os

from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

# shortcut: in-memory storage is per-process; set RATELIMIT_STORAGE_URI=redis://... when running >1 instance
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["300 per minute"],
    storage_uri=os.environ.get("RATELIMIT_STORAGE_URI", "memory://"),
)
