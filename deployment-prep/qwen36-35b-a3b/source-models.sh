#!/usr/bin/env bash
set -euo pipefail

TOKEN_FILE="${HF_TOKEN_FILE:-/home/mlasota/legal-ai/documentation/hf_token.cfg}"
CACHE_DIR="${CACHE_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.hf-cache}"

MODEL_IDS=(
  "nvidia/Qwen3.6-35B-A3B-NVFP4"
  "Qwen/Qwen3.6-35B-A3B-FP8"
)

if [[ ! -f "${TOKEN_FILE}" ]]; then
  echo "HF token file not found: ${TOKEN_FILE}" >&2
  exit 1
fi

if ! command -v python >/dev/null 2>&1; then
  echo "python is required to source the models" >&2
  exit 1
fi

python - <<'PY' "${TOKEN_FILE}" "${CACHE_DIR}" "${MODEL_IDS[@]}"
import os
import sys

try:
    from huggingface_hub import snapshot_download
except Exception as exc:
    raise SystemExit(
        "huggingface_hub is required. Install it in the active Python environment first."
    ) from exc

token_file = sys.argv[1]
cache_dir = sys.argv[2]
model_ids = sys.argv[3:]

with open(token_file, "r", encoding="utf-8") as handle:
    token = handle.read().strip()

if not token:
    raise SystemExit(f"Token file is empty: {token_file}")

os.makedirs(cache_dir, exist_ok=True)

for model_id in model_ids:
    target_dir = os.path.join(cache_dir, model_id.replace("/", "__"))
    print(f"Downloading {model_id} -> {target_dir}")
    snapshot_download(
        repo_id=model_id,
        token=token,
        local_dir=target_dir,
        local_dir_use_symlinks=False,
    )

print("Model source prep complete.")
PY