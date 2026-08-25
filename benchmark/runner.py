#!/usr/bin/env python3
"""Measured ReBench runner for OpenAI-compatible chat-completions APIs."""
from __future__ import annotations

import argparse
import hashlib
import http.client
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

IMPLEMENTED_SUITES = {"performance"}
DECLARED_SUITES = {"performance", "test-writing", "refactoring", "codebase-qna", "bug-fixing"}
BENCHMARK_VERSION = "0.1.0"
DEFAULT_PROMPT = "Explain why reproducible benchmarks need pinned workloads in exactly three concise sentences."
RETRY_ATTEMPTS = 3
RETRY_BACKOFF_S = 1.5

# Fields that identify a run. Order is part of the contract and must stay in
# sync with scripts/run-id.mjs (parity is enforced by tests on both sides).
ID_FIELDS = [
    "model",
    "family",
    "modelRevision",
    "quantization",
    "hardware",
    "engine",
    "engineVersion",
    "promptTokens",
    "generatedTokens",
    "contributor",
    "timestamp",
]


class TrialError(RuntimeError):
    """The request completed but the data it produced cannot be a measurement."""


def command_text(command: list[str], fallback: str) -> str:
    try:
        return subprocess.check_output(command, text=True, stderr=subprocess.DEVNULL, timeout=3).strip() or fallback
    except (OSError, subprocess.SubprocessError):
        return fallback


def float_env(name: str, default: float) -> float:
    raw = os.getenv(name)
    if raw is None:
        return default
    try:
        return float(raw)
    except ValueError:
        print(f"warning: ignoring non-numeric {name}={raw!r}, using {default}", file=sys.stderr)
        return default


def hardware() -> dict[str, object]:
    gpu = command_text(["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader,nounits"], "")
    first_gpu = gpu.splitlines()[0] if gpu else ""
    if first_gpu:
        name, _, memory = first_gpu.partition(",")
        try:
            vram = float(memory.strip() or 0)
        except ValueError:
            vram = 0.0
        return {
            "hardware": name.strip(),
            "gpuVendor": "NVIDIA",
            "vram": vram,
            "ram": float(command_text(["awk", "/MemTotal/ {printf \"%.0f\", $2/1024/1024}", "/proc/meminfo"], "1")),
            "cpu": command_text(["uname", "-p"], "unknown-cpu"),
        }
    return {
        "hardware": os.getenv("REBENCH_HARDWARE", "CPU / unavailable GPU"),
        "gpuVendor": os.getenv("REBENCH_GPU_VENDOR", "CPU"),
        "vram": float_env("REBENCH_VRAM_GB", 0.0),
        "ram": max(float_env("REBENCH_RAM_GB", 1.0), 1.0),
        "cpu": os.getenv("REBENCH_CPU", command_text(["uname", "-p"], "unknown-cpu")),
    }


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Run a measured ReBench benchmark")
    p.add_argument("--base-url", default=os.getenv("REBENCH_BASE_URL"), required=not os.getenv("REBENCH_BASE_URL"))
    p.add_argument("--suite", default=os.getenv("REBENCH_SUITE", "performance"), choices=sorted(DECLARED_SUITES))
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
    return p.parse_args(argv)


def load_manifest(path: str, suite: str) -> dict[str, object]:
    try:
        manifest = json.loads(Path(path).read_text())
    except FileNotFoundError:
        raise SystemExit(f"manifest not found: {path} (pass --manifest benchmark/performance.json)")
    except json.JSONDecodeError as exc:
        raise SystemExit(f"manifest is not valid JSON: {exc}")
    if manifest.get("suite") != suite:
        raise SystemExit(f"manifest suite {manifest.get('suite')!r} does not match --suite {suite!r}")
    if not manifest.get("stream", False):
        raise SystemExit("ReBench performance manifest requires streaming")
    missing = [key for key in ("prompt", "maxTokens", "warmups", "repetitions") if key not in manifest]
    if missing:
        raise SystemExit(f"manifest is missing required keys: {', '.join(missing)}")
    return manifest


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
    chunks = 0
    bad_chunks = 0
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
                bad_chunks += 1
                continue
            chunks += 1
            usage.update(chunk.get("usage") or {})
            choice = (chunk.get("choices") or [{}])[0]
            delta = choice.get("delta") or {}
            text = delta.get("content") or ""
            if text and first_token is None:
                first_token = time.perf_counter()
            pieces.append(text)
    if chunks == 0:
        # A non-streaming server returns one JSON body: no `data:` lines ever
        # appear, and silently scoring that as TTFT == total latency would emit
        # a plausible-but-wrong record. Refuse instead.
        raise TrialError("endpoint returned no SSE chunks — is the server streaming? ReBench requires stream=true")
    if first_token is None:
        raise TrialError("endpoint streamed chunks but never produced any content tokens")
    finished = time.perf_counter()
    generated = int(usage.get("completion_tokens") or max(1, len("".join(pieces).split())))
    ttft_ms = (first_token - started) * 1000
    generation_ms = max((finished - first_token) * 1000, 0.001)
    return generated, ttft_ms, generation_ms, usage


TRANSIENT_ERRORS = (
    urllib.error.URLError,
    http.client.HTTPException,
    TimeoutError,
    ConnectionError,
    TrialError,
)


def with_retries(fn, attempts: int = RETRY_ATTEMPTS, what: str = "request"):
    delay = RETRY_BACKOFF_S
    for attempt in range(1, attempts + 1):
        try:
            return fn()
        except TRANSIENT_ERRORS as exc:
            if attempt == attempts:
                raise
            print(f"{what} failed (attempt {attempt}/{attempts}): {type(exc).__name__}; retrying in {delay:.0f}s", file=sys.stderr)
            time.sleep(delay)
            delay *= 2


def sanitize_error(exc: BaseException) -> str:
    # status.json may be shared; keep endpoint URLs, keys and paths out of it.
    return f"{type(exc).__name__}: benchmark {getattr(exc, 'what', 'request')} failed after retries"


def run_id(record: dict[str, object]) -> str:
    digest = hashlib.sha256("|".join(str(record[key]) for key in ID_FIELDS).encode()).hexdigest()[:6]
    return f"RUN-{str(record['timestamp'])[:10]}-{digest}"


def build_record(cfg: argparse.Namespace, hw: dict[str, object], trials: list[tuple[int, float, float, dict]], now: datetime) -> dict[str, object]:
    generated_values = [trial[0] for trial in trials]
    ttft_values = [trial[1] for trial in trials]
    generation_values = [trial[0] / (trial[2] / 1000) for trial in trials]

    provider_prompt_tokens = [int(trial[3]["prompt_tokens"]) for trial in trials if trial[3].get("prompt_tokens")]
    prompt_tokens = provider_prompt_tokens[0] if provider_prompt_tokens else max(1, len(cfg.prompt.split()))

    provider_prompt_ms = [float(trial[3]["prompt_ms"]) for trial in trials if trial[3].get("prompt_ms") is not None]
    prompt_seconds = (sum(provider_prompt_ms) / len(provider_prompt_ms) / 1000) if provider_prompt_ms else (sum(ttft_values) / len(ttft_values) / 1000)
    prompt_tps = prompt_tokens / max(prompt_seconds, 0.001)

    trial_records = [
        {
            "generatedTokens": trial[0],
            "ttft": round(trial[1], 3),
            "generationMs": round(trial[2], 3),
            "generationTPS": round(trial[0] / (trial[2] / 1000), 3),
        }
        for trial in trials
    ]
    record = {
        "model": cfg.model,
        "family": cfg.family,
        "modelRevision": cfg.model_revision,
        "quantization": cfg.quantization,
        **hw,
        "engine": os.getenv("REBENCH_ENGINE", "OpenAI-compatible API"),
        "engineVersion": os.getenv("REBENCH_ENGINE_VERSION", "unknown"),
        "benchmarkVersion": BENCHMARK_VERSION,
        "suite": cfg.suite,
        "promptTokens": prompt_tokens,
        "generatedTokens": round(sum(generated_values) / len(generated_values)),
        "promptTPS": round(prompt_tps, 3),
        "generationTPS": round(sum(generation_values) / len(generation_values), 3),
        "ttft": round(sum(ttft_values) / len(ttft_values), 3),
        "timingSource": "provider" if provider_prompt_ms else "estimated_from_ttft",
        "trials": trial_records,
        "score": 0,
        "contributor": cfg.contributor,
        "timestamp": now.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "gitCommit": cfg.git_commit,
        "status": "PENDING",
    }
    record["id"] = run_id(record)
    return record


def write_status(path: str, phase: str, **extra: object) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(json.dumps({"phase": phase, "updatedAt": datetime.now(timezone.utc).isoformat(), **extra}, indent=2) + "\n")
    print(f"[{phase}]", flush=True)


def main(argv: list[str] | None = None) -> int:
    cfg = parse_args(argv)
    if cfg.suite not in IMPLEMENTED_SUITES:
        raise SystemExit(
            f"suite {cfg.suite!r} is declared in suites.json but has no runner support yet "
            "(no task fixtures or graders are published). Only 'performance' runs are accepted."
        )
    if cfg.manifest:
        manifest = load_manifest(cfg.manifest, cfg.suite)
        cfg.prompt = str(manifest["prompt"])
        cfg.max_tokens = int(manifest["maxTokens"])
        cfg.warmups = int(manifest["warmups"])
        cfg.repetitions = int(manifest["repetitions"])
    if cfg.repetitions < 1 or cfg.warmups < 0:
        raise SystemExit("--repetitions must be >= 1 and --warmups must be >= 0")
    hw = hardware()
    url = endpoint_for(cfg.base_url)
    body = {"model": cfg.model, "messages": [{"role": "user", "content": cfg.prompt}], "temperature": 0, "max_tokens": cfg.max_tokens, "stream": True, "stream_options": {"include_usage": True}}
    try:
        write_status(cfg.status_file, "fingerprinting", hardware=hw)
        write_status(cfg.status_file, "warming_up", total=cfg.warmups + cfg.repetitions)
        for _ in range(cfg.warmups):
            with_retries(lambda: stream_trial(url, body, cfg.api_key), what="warmup request")
        trials: list[tuple[int, float, float, dict]] = []
        for index in range(cfg.repetitions):
            write_status(cfg.status_file, "measuring", repetition=index + 1, total=cfg.repetitions)
            trials.append(with_retries(lambda: stream_trial(url, body, cfg.api_key), what="measurement request"))
    except TRANSIENT_ERRORS as exc:
        write_status(cfg.status_file, "failed", error=sanitize_error(exc))
        print(f"benchmark request failed: {exc}", file=sys.stderr)
        return 1

    record = build_record(cfg, hw, trials, datetime.now(timezone.utc).replace(microsecond=0))
    output = Path(cfg.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(record, indent=2) + "\n")
    write_status(cfg.status_file, "complete", output=str(output), id=record["id"], repetitions=cfg.repetitions)
    summary = {
        "output": str(output),
        "id": record["id"],
        # The id doubles as the results/ filename; tell the contributor exactly where the file goes.
        "commitAs": f"results/{cfg.family}/{record['id']}.json",
        "generationTPS": record["generationTPS"],
        "ttft": record["ttft"],
        "repetitions": cfg.repetitions,
    }
    print(json.dumps(summary))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
