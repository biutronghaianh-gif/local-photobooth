import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
root_dir = os.path.dirname(parent_dir)

for path in [current_dir, parent_dir, root_dir]:
    if path not in sys.path:
        sys.path.insert(0, path)

try:
    from src.main import app
except ImportError:
    try:
        from api.src.main import app
    except ImportError:
        from backend.src.main import app

__all__ = ["app"]
