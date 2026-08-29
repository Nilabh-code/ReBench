"""Tests for benchmark/runner.py.

Run with: python3 -m pytest benchmark/tests/
"""
from __future__ import annotations

import json
import urllib.error
from pathlib import Path

import pytest

import mock_server
import runner

REPO = Path(__file__).resolve().parents[2]
MANIFEST = REPO / "benchmark" / "performance.json"


@pytest.fixture(scope="module")
def base_url():
    server = mock_server.serve(0)
    yield "http://127.0.0.1:%d/v1" % server.server_address[1]
    server.shutdown()


def argv_for(base_url: str, tmp_path: Path, model: str = "mock-model", extra=None) -> list[str]:
    args = [
        "--base-url", base_url,
        "--model", model,
        "--family", "mock",
        "--contributor", "ci-bot",
        "--model-revision", "0000000",
        "--git-commit", "0000000",
        "--manifest", str(MANIFEST),
        "--output", str(tmp_path / "run.json"),
        "--status-file", str(tmp_path / "status.json"),
    ]
    return args + (extra or [])


# ------------------------------------------------------------------ pure units


def test_endpoint_for_appends_chat_completions():
    assert runner.endpoint_for("http://x:1/v1") == "http://x:1/v1/chat/completions"
    assert runner.endpoint_for("http://x:1/v1/") == "http://x:1/v1/chat/completions"
    kept = "http://x:1/v1/chat/completions"
    assert runner.endpoint_for(kept) == kept


def test_float_env_rejects_garbage(monkeypatch):
    monkeypatch.setenv("REBENCH_VRAM_GB", "sixteen")
    assert runner.float_env("REBENCH_VRAM_GB", 0.0) == 0.0
    monkeypatch.setenv("REBENCH_VRAM_GB", "24.5")
    assert runner.float_env("REBENCH_VRAM_GB", 0.0) == 24.5
    monkeypatch.delenv("REBENCH_VRAM_GB")
    assert runner.float_env("REBENCH_VRAM_GB", 3.0) == 3.0


def test_hardware_env_fallback(monkeypatch):
    monkeypatch.setattr(runner, "command_text", lambda cmd, fallback: "")
    monkeypatch.setenv("REBENCH_HARDWARE", "RTX 3090")
    monkeypatch.setenv("REBENCH_GPU_VENDOR", "NVIDIA")
    monkeypatch.setenv("REBENCH_VRAM_GB", "24")
    monkeypatch.setenv("REBENCH_RAM_GB", "64")
    monkeypatch.setenv("REBENCH_CPU", "5950X")
    hw = runner.hardware()
    assert hw["hardware"] == "RTX 3090"
    assert hw["gpuVendor"] == "NVIDIA"
    assert hw["vram"] == 24.0
    assert hw["ram"] == 64.0
    assert hw["cpu"] == "5950X"


def test_hardware_ignores_bad_env_numbers(monkeypatch):
    monkeypatch.setattr(runner, "command_text", lambda cmd, fallback: "")
    monkeypatch.setenv("REBENCH_HARDWARE", "RTX 3090")
    monkeypatch.setenv("REBENCH_GPU_VENDOR", "NVIDIA")
    monkeypatch.setenv("REBENCH_VRAM_GB", "not-a-number")
    monkeypatch.setenv("REBENCH_RAM_GB", "")
    monkeypatch.setenv("REBENCH_CPU", "5950X")
    hw = runner.hardware()
    assert hw["vram"] == 0.0
    assert hw["ram"] >= 1.0


def test_hardware_takes_first_gpu_line(monkeypatch):
    outputs = {
        "nvidia-smi": "RTX 4090, 24564\nRTX 4090, 24564",
    }

    def fake_command(command, fallback):
        if command and command[0] in outputs:
            return outputs[command[0]]
        if command and command[0] == "awk":
            return "64"
        if command and command[0] == "uname":
            return "x86_64"
        return fallback

    monkeypatch.setattr(runner, "command_text", fake_command)
    hw = runner.hardware()
    assert hw["hardware"] == "RTX 4090"
    assert hw["vram"] == 24564.0 / 1024
    assert hw["gpuVendor"] == "NVIDIA"


# ------------------------------------------------------------- id and record


PARITY_RECORD = {
    "model": "parity-model",
    "family": "parity",
    "modelRevision": "abc1234",
    "quantization": "Q4_K_M",
    "hardware": "NVIDIA RTX 4090",
    "engine": "llama.cpp",
    "engineVersion": "b1234",
    "promptTokens": 100,
    "generatedTokens": 128,
    "contributor": "nilabh",
    "timestamp": "2026-08-25T10:00:00Z",
}


def test_run_id_matches_javascript_vectors():
    # Vectors shared with scripts/run-id.test.mjs: the content-addressed id
    # contract must hold across both implementations.
    assert runner.run_id(dict(PARITY_RECORD)) == "RUN-2026-08-25-34013b"
    changed = dict(PARITY_RECORD, promptTokens=101)
    assert runner.run_id(changed) == "RUN-2026-08-25-eea1b5"


def test_run_id_covers_every_key_field():
    for key in runner.ID_FIELDS:
        mutated = dict(PARITY_RECORD)
        mutated[key] = str(mutated[key]) + "-x" if isinstance(mutated[key], str) else mutated[key] + 1
        assert runner.run_id(mutated) != runner.run_id(dict(PARITY_RECORD)), key


class _Cfg:
    pass


def make_cfg(**over):
    cfg = _Cfg()
    cfg.model = "mock-model"
    cfg.family = "mock"
    cfg.model_revision = "0000000"
    cfg.quantization = "q4"
    cfg.prompt = "a b c d e f g h i j k l m n o p"
    cfg.contributor = "ci-bot"
    cfg.git_commit = "0000000"
    cfg.suite = "performance"
    for key, value in over.items():
        setattr(cfg, key, value)
    return cfg


def test_build_record_prefers_provider_prompt_tokens():
    from datetime import datetime, timezone

    trials = [(12, 400.0, 800.0, {"prompt_tokens": 99})] * 3
    now = datetime(2026, 8, 25, tzinfo=timezone.utc)
    record = runner.build_record(make_cfg(), {"hardware": "h", "gpuVendor": "CPU", "vram": 0.0, "ram": 16.0, "cpu": "c"}, trials, now)
    assert record["promptTokens"] == 99
    assert record["id"] == runner.run_id(record)
    assert record["status"] == "PENDING"
    assert record["timestamp"] == "2026-08-25T00:00:00Z"


def test_build_record_falls_back_to_word_count():
    from datetime import datetime, timezone

    trials = [(12, 400.0, 800.0, {})] * 3
    record = runner.build_record(make_cfg(), {"hardware": "h", "gpuVendor": "CPU", "vram": 0.0, "ram": 16.0, "cpu": "c"}, trials, datetime(2026, 8, 25, tzinfo=timezone.utc))
    assert record["promptTokens"] == 16
    assert record["timingSource"] == "estimated_from_ttft"


# -------------------------------------------------------------------- trials


def test_stream_trial_normal(base_url):
    body = {"model": "mock-model", "stream": True}
    generated, ttft_ms, generation_ms, usage = runner.stream_trial(runner.endpoint_for(base_url), body, "")
    assert generated == 12  # completion_tokens from the usage chunk
    assert ttft_ms > 0
    assert generation_ms > 0
    assert usage.get("prompt_tokens") == 24


def test_stream_trial_refuses_non_streaming_response(base_url):
    body = {"model": "mock-nosse-model", "stream": True}
    with pytest.raises(runner.TrialError, match="no SSE chunks"):
        runner.stream_trial(runner.endpoint_for(base_url), body, "")


def test_stream_trial_without_usage_counts_words(base_url):
    body = {"model": "mock-nousage-model", "stream": True}
    generated, _, _, usage = runner.stream_trial(runner.endpoint_for(base_url), body, "")
    assert "completion_tokens" not in usage
    assert generated == 12  # 12 content chunks, one word each


def test_stream_trial_accepts_reasoning_only_stream(base_url):
    body = {"model": "mock-reasoning-model", "stream": True}
    generated, _, _, usage = runner.stream_trial(runner.endpoint_for(base_url), body, "")
    assert generated == 12
    assert usage["completion_tokens"] == 12


def test_model_metadata_extracts_quant_and_context():
    payload = {"data": [{"id": "ornith", "quant": "Q5_K_M", "context_length": 262144, "max_context_length": 8192}]}
    metadata = runner.model_metadata(payload, "ornith")
    assert metadata == {"quantization": "Q5_K_M", "contextLength": 8192}


def test_with_retries_recovers_from_transient_failures(base_url, monkeypatch):
    monkeypatch.setattr(runner, "RETRY_BACKOFF_S", 0.01)
    body = {"model": "mock-flaky-model", "stream": True}
    generated, _, _, _ = runner.with_retries(
        lambda: runner.stream_trial(runner.endpoint_for(base_url), body, ""),
        attempts=3,
        what="flaky test request",
    )
    assert generated == 12


def test_with_retries_gives_up_after_attempts(monkeypatch):
    monkeypatch.setattr(runner, "RETRY_BACKOFF_S", 0.01)
    calls = {"n": 0}

    def always_fail():
        calls["n"] += 1
        raise TimeoutError("nope")

    with pytest.raises(TimeoutError):
        runner.with_retries(always_fail, attempts=3, what="test")
    assert calls["n"] == 3


def test_sanitize_error_hides_urls_and_paths():
    exc = urllib.error.HTTPError(
        "https://internal.host:9999/v1/chat/completions?api_key=topsecret", 500, "Server Error", {}, None
    )
    message = runner.sanitize_error(exc)
    assert "internal.host" not in message
    assert "api_key" not in message
    assert "HTTPError" in message


# ------------------------------------------------------------------ manifest


def test_load_manifest_missing_file(tmp_path):
    with pytest.raises(SystemExit, match="manifest not found"):
        runner.load_manifest(str(tmp_path / "missing.json"), "performance")


def test_load_manifest_suite_mismatch(tmp_path):
    path = tmp_path / "m.json"
    path.write_text(json.dumps({"suite": "other", "stream": True, "prompt": "p", "maxTokens": 8, "warmups": 0, "repetitions": 1}))
    with pytest.raises(SystemExit, match="does not match"):
        runner.load_manifest(str(path), "performance")


def test_load_manifest_requires_stream(tmp_path):
    path = tmp_path / "m.json"
    path.write_text(json.dumps({"suite": "performance", "stream": False, "prompt": "p", "maxTokens": 8, "warmups": 0, "repetitions": 1}))
    with pytest.raises(SystemExit, match="streaming"):
        runner.load_manifest(str(path), "performance")


def test_load_manifest_missing_keys(tmp_path):
    path = tmp_path / "m.json"
    path.write_text(json.dumps({"suite": "performance", "stream": True}))
    with pytest.raises(SystemExit, match="missing required keys"):
        runner.load_manifest(str(path), "performance")


# ---------------------------------------------------------------------- main


def test_main_end_to_end(base_url, tmp_path):
    argv = argv_for(base_url, tmp_path, extra=["--api-key", "sekrit-key"])
    assert runner.main(argv) == 0
    record = json.loads((tmp_path / "run.json").read_text())
    assert record["id"].startswith("RUN-")
    assert record["status"] == "PENDING"
    assert len(record["trials"]) == 3  # pinned by the manifest
    assert record["promptTokens"] == 24  # from the mock usage chunk
    blob = (tmp_path / "run.json").read_text() + (tmp_path / "status.json").read_text()
    assert "sekrit-key" not in blob  # redaction by design
    status = json.loads((tmp_path / "status.json").read_text())
    assert status["phase"] == "complete"
    assert status["id"] == record["id"]


def test_main_refuses_unimplemented_suite(base_url, tmp_path):
    argv = argv_for(base_url, tmp_path, extra=["--suite", "bug-fixing"])
    with pytest.raises(SystemExit, match="no runner support"):
        runner.main(argv)


def test_main_failure_writes_sanitized_status(tmp_path, monkeypatch):
    monkeypatch.setattr(runner, "RETRY_ATTEMPTS", 2)
    monkeypatch.setattr(runner, "RETRY_BACKOFF_S", 0.01)
    argv = argv_for(
        "http://127.0.0.1:9/v1",
        tmp_path,
        extra=["--manifest", "", "--warmups", "0", "--repetitions", "1", "--api-key", "sekrit-key"],
    )
    assert runner.main(argv) == 1
    status = json.loads((tmp_path / "status.json").read_text())
    assert status["phase"] == "failed"
    assert "sekrit-key" not in status.get("error", "")
    assert "127.0.0.1" not in status.get("error", "")
