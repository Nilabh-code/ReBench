import sys
from pathlib import Path

# Make benchmark/runner.py importable without packaging it.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
