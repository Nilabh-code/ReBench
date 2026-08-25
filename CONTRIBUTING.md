# Contributing a benchmark run

ReBench is a database of *measured* inference runs. There is no form, no
account, no server: you run the pinned workload on your own hardware, open a
pull request with one JSON file, and CI does the rest.

**Coordinate with the community on Discord:** https://discord.gg/rpsxH4Ss7k
That is where rigs are compared, reproductions are arranged, and results get
verified.

## Requirements

- Docker
- A running **OpenAI-compatible** inference endpoint (llama.cpp `llama-server`,
  vLLM, Ollama with OpenAI compat, LM Studio, ...). Any model, any quant.
- ~5 minutes

## 1. Start your inference server

llama.cpp example:

```sh
llama-server -m your-model-q4_k_m.gguf --port 8000 -ngl 99
```

## 2. Run the benchmark

```sh
docker build -t rebench-runner benchmark/

docker run --rm --network host --user "$(id -u):$(id -g)" \
  -v "$PWD/out:/output" \
  -e REBENCH_ENGINE="llama.cpp" \
  -e REBENCH_ENGINE_VERSION="$(llama-server --version 2>&1 | head -1)" \
  rebench-runner \
  --base-url http://127.0.0.1:8000/v1 \
  --model qwen3-8b \
  --family qwen3 \
  --quantization q4_k_m \
  --contributor your-github-handle \
  --model-revision <weights revision hash> \
  --git-commit "$(git -C . rev-parse --short HEAD 2>/dev/null || echo 0000000)" \
  --output /output/run.json \
  --status-file /output/status.json
```

The runner performs 1 warmup + 3 measured repetitions with a pinned prompt and
sampling parameters (see `benchmark/performance.json`) and writes
`out/run.json`. The prompt is fixed by the manifest and cannot be edited
per-run — that is the point.

Hardware (GPU, VRAM, RAM, CPU) is fingerprinted automatically when
`nvidia-smi` is available; otherwise pass `REBENCH_HARDWARE`,
`REBENCH_GPU_VENDOR`, `REBENCH_VRAM_GB`, `REBENCH_RAM_GB`, `REBENCH_CPU`.

## 3. Validate before you PR

```sh
npm install
node scripts/validate-record.mjs out/run.json
```

This runs the exact same schema + cross-field checks CI applies. It also tells
you the exact path to commit to: `results/<family>/<RUN-id>.json` (the run id
doubles as the filename — do not rename, do not hand-edit the file).

## 4. Open the pull request

```sh
mkdir -p results/qwen3
cp out/run.json results/qwen3/RUN-...-.json   # use the name validate printed
git checkout -b run/your-github-handle-qwen3-8b
git add results/
git commit -m "results: add <RUN-id> (qwen3-8b / q4_k_m on <your GPU>)"
```

CI validates the record, regenerates the website index, and deploys. Your
number appears in the leaderboard and on the model page.

## What happens after merge

- Your run starts as **PENDING**.
- When someone else confirms the number on a second machine, it becomes
  **REPRODUCED**. Arrange reproductions on Discord.
- Once CI has checked schema, outliers and provenance, it becomes **VERIFIED**.

## Rules

- One JSON file per run, produced by the runner. Hand-edited numbers are
  detectable (the id is a content hash of the record) and will be closed.
- `--contributor` must be your GitHub handle.
- `--model-revision` must pin the exact weights you measured (commit hash or
  file hash). Two runs of "the same model" at different revisions are
  different runs.
- Never commit API keys. The runner does not persist them, and neither should
  you.
- Synthetic or estimated numbers do not belong here. There is a leaderboard of
  zero rather than a leaderboard of noise.

## Development

See [README.md](README.md) for site development commands and the full schema
reference in [`schema/benchmark.schema.json`](schema/benchmark.schema.json).
Questions, hardware talk and reproduction requests: the
[Discord server](https://discord.gg/rpsxH4Ss7k).
