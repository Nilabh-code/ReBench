#!/usr/bin/env python3
"""Small, transparent ReBench v0 runner for OpenAI-compatible APIs."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

SUITES = {"performance", "test-writing", "refactoring", "codebase-qna", "bug-fixing"}
from pathlib import Path

BENCHMARK_VERSION = "0.1.0"
DEFAULT_PROMPT = "Explain why reproducible benchmarks need pinned workloads in exactly three concise sentences."


def args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Run a measured ReBench smoke benchmark")
    p.add_argument("--base-url", default=os.getenv("REBENCH_BASE_URL"), required=not os.getenv("REBENCH_BASE_URL"))
    p.add_argument("--suite", default=os.getenv("REBENCH_SUITE", "performance"), choices=sorted(SUITES))
    p.add_argument("--model", default=os.getenv("REBENCH_MODEL"), required=not os.getenv("REBENCH_MODEL"))
    p.add_argument("--family", default=os.getenv("REBENCH_FAMILY", "unclassified"))
    p.add_argument("--quantization", default=os.getenv("REBENCH_QUANTIZATION", "unknown"))
    p.add_argument("--api-key", default=os.getenv("REBENCH_API_KEY", ""))
    p.add_argument("--contributor", default=os.getenv("REBENCH_CONTRIBUTOR", "unknown"))
    p.add_argument("--model-revision", default=os.getenv("REBENCH_MODEL_REVISION", "0000000"))
    p.add_argument("--git-commit", default=os.getenv("REBENCH_GIT_COMMIT", "0000000"))
    p.add_argument("--prompt", default=DEFAULT_PROMPT)
    p.add_argument("--max-tokens", type=int, default=128)
    p.add_argument("--output", default="/output/run.json")
    return p.parse_args()


def post(url: str, body: dict, key: str) -> tuple[dict, float]:
    payload = json.dumps(body).encode()
    headers = {"Content-Type": "application/json"}
    if key:
        headers["Authorization"] = f"Bearer {key}"
    request = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    started = time.perf_counter()
    with urllib.request.urlopen(request, timeout=300) as response:
        data = json.loads(response.read())
    return data, (time.perf_counter() - started) * 1000


def main() -> int:
    cfg = args()
    base = cfg.base_url.rstrip("/")
    if base.endswith("/chat/completions"):
        endpoint = base
    else:
        endpoint = f"{base}/chat/completions"
    body = {
        "model": cfg.model,
        "messages": [{"role": "user", "content": cfg.prompt}],
        "temperature": 0,
        "max_tokens": cfg.max_tokens,
        "stream": False,
    }
    try:
        result, latency_ms = post(endpoint, body, cfg.api_key)
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
        print(f"benchmark request failed: {exc}", file=sys.stderr)
        return 1

    usage = result.get("usage") or {}
    prompt_tokens = int(usage.get("prompt_tokens") or max(1, len(cfg.prompt.split())))
    generated_tokens = int(usage.get("completion_tokens") or max(1, len(str(result.get("choices", [{}])[0].get("message", {}).get("content", "")).split())))
    prompt_tps = prompt_tokens / max(latency_ms / 1000, 0.001)
    generation_tps = generated_tokens / max(latency_ms / 1000, 0.001)
    now = datetime.now(timezone.utc).replace(microsecond=0)
    record = {
        "model": cfg.model,
        "family": cfg.family,
        "modelRevision": cfg.model_revision,
        "quantization": cfg.quantization,
        "hardware": os.getenv("REBENCH_HARDWARE", "user-reported"),
        "gpuVendor": os.getenv("REBENCH_GPU_VENDOR", "CPU"),
        "vram": float(os.getenv("REBENCH_VRAM_GB", "0")),
        "ram": float(os.getenv("REBENCH_RAM_GB", "1")),
        "cpu": os.getenv("REBENCH_CPU", "user-reported"),
        "engine": os.getenv("REBENCH_ENGINE", "OpenAI-compatible API"),
        "engineVersion": os.getenv("REBENCH_ENGINE_VERSION", "unknown"),
        "benchmarkVersion": BENCHMARK_VERSION,
        "suite": cfg.suite,
        "promptTokens": prompt_tokens,
        "generatedTokens": generated_tokens,
        "promptTPS": round(prompt_tps, 3),
        "generationTPS": round(generation_tps, 3),
        "ttft": round(latency_ms, 3),
        "score": 0,
        "contributor": cfg.contributor,
        "timestamp": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "gitCommit": cfg.git_commit,
        "status": "PENDING",
    }
    key_fields = ["model", "family", "modelRevision", "quantization", "hardware", "engine", "engineVersion", "promptTokens", "generatedTokens", "contributor", "timestamp"]
    digest = hashlib.sha256("|".join(str(record[key]) for key in key_fields).encode()).hexdigest()[:6]
    record["id"] = f"RUN-{now:%Y-%m-%d}-{digest}"
    output = Path(cfg.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(record, indent=2) + "\n")
    print(json.dumps({"output": str(output), "id": record["id"], "generationTPS": record["generationTPS"], "ttft": record["ttft"]}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
