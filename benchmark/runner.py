#!/usr/bin/env python3
"""Measured ReBench runner for OpenAI-compatible chat-completions APIs."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SUITES = {"performance", "test-writing", "refactoring", "codebase-qna", "bug-fixing"}
BENCHMARK_VERSION = "0.1.0"
DEFAULT_PROMPT = "Explain why reproducible benchmarks need pinned workloads in exactly three concise sentences."


def command_text(command: list[str], fallback: str) -> str:
    try:
        return subprocess.check_output(command, text=True, stderr=subprocess.DEVNULL, timeout=3).strip() or fallback
    except (OSError, subprocess.SubprocessError):
        return fallback


def hardware() -> dict[str, object]:
    gpu = command_text(["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader,nounits"], "")
    if gpu:
        name, _, memory = gpu.partition(",")
        return {
            "hardware": name.strip(),
            "gpuVendor": "NVIDIA",
            "vram": float(memory.strip() or 0),
            "ram": float(command_text(["awk", "/MemTotal/ {printf \"%.0f\", $2/1024/1024}", "/proc/meminfo"], "1")),
            "cpu": command_text(["uname", "-p"], "unknown-cpu"),
        }
    return {
        "hardware": os.getenv("REBENCH_HARDWARE", "CPU / unavailable GPU"),
        "gpuVendor": os.getenv("REBENCH_GPU_VENDOR", "CPU"),
        "vram": float(os.getenv("REBENCH_VRAM_GB", "0")),
        "ram": float(os.getenv("REBENCH_RAM_GB", "1")),
        "cpu": os.getenv("REBENCH_CPU", command_text(["uname", "-p"], "unknown-cpu")),
    }


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Run a measured ReBench benchmark")
    p.add_argument("--base-url", default=os.getenv("REBENCH_BASE_URL"), required=not os.getenv("REBENCH_BASE_URL"))
    p.add_argument("--suite", default=os.getenv("REBENCH_SUITE", "performance"), choices=sorted(SUITES))
    p.add_argument("--model", default=os.getenv("REBENCH_MODEL"), required=not os.getenv("REBENCH_MODEL"))
    p.add_argument("--family", default=os.getenv("REBENCH_FAMILY", "unclassified"))
    p.add_argument("--quantization", default=os.getenv("REBENCH_QUANTIZATION", "unknown"))
    p.add_argument("--api-key", default=os.getenv("REBENCH_API_KEY", ""))
    p.add_argument("--contributor", default=os.getenv("REBENCH_CONTRIBUTOR", "unknown"))
    p.add_argument("--model-revision", default=os.getenv("REBENCH_MODEL_REVISION", "0000000"))
    p.add_argument("--git-commit", default=os.getenv("REBENCH_GIT_COMMIT", "0000000"))
    p.add_argument("--manifest", default=os.getenv("REBENCH_MANIFEST", "/app/performance.json"), help="Pinned JSON workload manifest")
    p.add_argument("--prompt", default=DEFAULT_PROMPT)
    p.add_argument("--max-tokens", type=int, default=128)
    p.add_argument("--warmups", type=int, default=1)
    p.add_argument("--repetitions", type=int, default=3)
    p.add_argument("--output", default="/output/run.json")
    p.add_argument("--status-file", default="/output/status.json")
    return p.parse_args()


def endpoint_for(base: str) -> str:
    base = base.rstrip("/")
    return base if base.endswith("/chat/completions") else f"{base}/chat/completions"


def headers(key: str) -> dict[str, str]:
    result = {"Content-Type": "application/json", "Accept": "text/event-stream"}
    if key:
        result["Authorization"] = f"Bearer {key}"
    return result


def stream_trial(url: str, body: dict, key: str) -> tuple[int, float, float, dict]:
    request = urllib.request.Request(url, data=json.dumps(body).encode(), headers=headers(key), method="POST")
    started = time.perf_counter()
    first_token: float | None = None
    pieces: list[str] = []
    usage: dict = {}
    with urllib.request.urlopen(request, timeout=300) as response:
        for raw in response:
            line = raw.decode("utf-8", errors="replace").strip()
            if not line.startswith("data:"):
                continue
            payload = line[5:].strip()
            if payload == "[DONE]":
                break
            try:
                chunk = json.loads(payload)
            except json.JSONDecodeError:
                continue
            usage.update(chunk.get("usage") or {})
            choice = (chunk.get("choices") or [{}])[0]
            delta = choice.get("delta") or {}
            text = delta.get("content") or ""
            if text and first_token is None:
                first_token = time.perf_counter()
            pieces.append(text)
    finished = time.perf_counter()
    if first_token is None:
        first_token = finished
    generated = int(usage.get("completion_tokens") or max(1, len("".join(pieces).split())))
    ttft_ms = (first_token - started) * 1000
    generation_ms = max((finished - first_token) * 1000, 0.001)
    return generated, ttft_ms, generation_ms, usage


def write_status(path: str, phase: str, **extra: object) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps({"phase": phase, "updatedAt": datetime.now(timezone.utc).isoformat(), **extra}, indent=2) + "\n")
    print(f"[{phase}]", flush=True)


def main() -> int:
    cfg = parse_args()
    if cfg.manifest:
        manifest = json.loads(Path(cfg.manifest).read_text())
        if manifest.get("suite") != cfg.suite:
            raise SystemExit("manifest suite does not match --suite")
        cfg.prompt = manifest["prompt"]
        cfg.max_tokens = int(manifest["maxTokens"])
        cfg.warmups = int(manifest["warmups"])
        cfg.repetitions = int(manifest["repetitions"])
        if not manifest.get("stream", False):
            raise SystemExit("ReBench performance manifest requires streaming")
    if cfg.repetitions < 1 or cfg.warmups < 0:
        raise SystemExit("--repetitions must be >= 1 and --warmups must be >= 0")
    hw = hardware()
    url = endpoint_for(cfg.base_url)
    body = {"model": cfg.model, "messages": [{"role": "user", "content": cfg.prompt}], "temperature": 0, "max_tokens": cfg.max_tokens, "stream": True, "stream_options": {"include_usage": True}}
    prompt_tokens = max(1, len(cfg.prompt.split()))
    try:
        write_status(cfg.status_file, "fingerprinting", hardware=hw)
        write_status(cfg.status_file, "warming_up", total=cfg.warmups + cfg.repetitions)
        for _ in range(cfg.warmups):
            stream_trial(url, body, cfg.api_key)
        trials: list[tuple[int, float, float, dict]] = []
        for index in range(cfg.repetitions):
            write_status(cfg.status_file, "measuring", repetition=index + 1, total=cfg.repetitions)
            trials.append(stream_trial(url, body, cfg.api_key))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
        write_status(cfg.status_file, "failed", error=str(exc))
        print(f"benchmark request failed: {exc}", file=sys.stderr)
        return 1

    generated_values = [trial[0] for trial in trials]
    ttft_values = [trial[1] for trial in trials]
    generation_values = [trial[0] / (trial[2] / 1000) for trial in trials]
    provider_prompt_ms = [float(trial[3]["prompt_ms"]) for trial in trials if trial[3].get("prompt_ms") is not None]
    prompt_seconds = (sum(provider_prompt_ms) / len(provider_prompt_ms) / 1000) if provider_prompt_ms else (sum(ttft_values) / len(ttft_values) / 1000)
    prompt_tps = prompt_tokens / max(prompt_seconds, 0.001)
    trial_records = [{"generatedTokens": trial[0], "ttft": round(trial[1], 3), "generationMs": round(trial[2], 3), "generationTPS": round(trial[0] / (trial[2] / 1000), 3)} for trial in trials]
    prompt_timing_source = "provider" if provider_prompt_ms else "estimated_from_ttft"
    now = datetime.now(timezone.utc).replace(microsecond=0)
    record = {"model": cfg.model, "family": cfg.family, "modelRevision": cfg.model_revision, "quantization": cfg.quantization, **hw, "engine": os.getenv("REBENCH_ENGINE", "OpenAI-compatible API"), "engineVersion": os.getenv("REBENCH_ENGINE_VERSION", "unknown"), "benchmarkVersion": BENCHMARK_VERSION, "suite": cfg.suite, "promptTokens": prompt_tokens, "generatedTokens": round(sum(generated_values) / len(generated_values)), "promptTPS": round(prompt_tps, 3), "generationTPS": round(sum(generation_values) / len(generation_values), 3), "ttft": round(sum(ttft_values) / len(ttft_values), 3), "timingSource": prompt_timing_source, "trials": trial_records, "score": 0, "contributor": cfg.contributor, "timestamp": now.strftime("%Y-%m-%dT%H:%M:%SZ"), "gitCommit": cfg.git_commit, "status": "PENDING"}
    fields = ["model", "family", "modelRevision", "quantization", "hardware", "engine", "engineVersion", "promptTokens", "generatedTokens", "contributor", "timestamp"]
    digest = hashlib.sha256("|".join(str(record[key]) for key in fields).encode()).hexdigest()[:6]
    record["id"] = f"RUN-{now:%Y-%m-%d}-{digest}"
    output = Path(cfg.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(record, indent=2) + "\n")
    write_status(cfg.status_file, "complete", output=str(output), id=record["id"], repetitions=cfg.repetitions)
    print(json.dumps({"output": str(output), "id": record["id"], "generationTPS": record["generationTPS"], "ttft": record["ttft"], "repetitions": cfg.repetitions}))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
